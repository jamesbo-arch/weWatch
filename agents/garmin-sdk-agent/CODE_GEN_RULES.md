# IR → Monkey C 代码生成规则 · v0.1.0

> 这份文件回答唯一的问题：**给定一个 IR 节点，应该生成什么 Monkey C 代码？**
>
> 一切翻译规则集中在这里，便于审计与回归。Agent 不得"凭感觉"翻译；任何与本文档不一致的输出都视为 bug。

---

## 顶层翻译流程

```
IR 根
 ├─→ manifest.xml          （由 meta + targets + 权限派生）
 ├─→ monkey.jungle         （由 targets + 资源结构派生）
 ├─→ resources/strings/    （由 meta.name/description 多语言派生）
 ├─→ resources/colors.xml  （由 color_scheme 派生）
 ├─→ resources/fonts.xml   （由 typography 派生：仅引用系统字体）
 ├─→ resources/drawables/  （拷贝 image asset）
 ├─→ source/App.mc         （应用入口，固定模板）
 ├─→ source/View.mc        （核心绘制逻辑，由 layout 派生）
 └─→ source/Bindings.mc    （由 data_bindings 派生）
```

每一项都有"模板 + slot 注入"的明确规则。详见下文。

---

## 1. `manifest.xml` 生成

模板（`templates/manifest.xml`）+ 注入：

```xml
<iq:manifest xmlns:iq="http://www.garmin.com/xml/connectiq" version="3">
  <iq:application
      id="{{ derived: stable hash of meta.id }}"
      type="watchface"
      name="@Strings.AppName"
      entry="WeWatchApp"
      launcherIcon="@Drawables.LauncherIcon"
      minSdkVersion="3.2.0">

    <iq:products>
      {{ for each device in targets }}
      <iq:product id="{{ device.product_code }}"/>
      {{ end for }}
    </iq:products>

    <iq:permissions>
      {{ derived: union of permissions required by complications & data_bindings }}
      <!-- 例如，存在 heart_rate complication → 加 SensorHistory -->
    </iq:permissions>

    <iq:languages>
      {{ for each locale in meta.name.keys }}
      <iq:language>{{ locale_code }}</iq:language>
      {{ end for }}
    </iq:languages>
  </iq:application>
</iq:manifest>
```

**规则要点**：
- `id` 使用稳定哈希（基于 `meta.id`），保证同一表盘多次构建产物 ID 一致，便于 Connect IQ Store 升级。
- `minSdkVersion`：默认 `3.2.0`（覆盖所有 Top 30 设备）；若 IR 使用了高版本特性，自动提升并在 build_report 中标注。
- 权限按"最小必要原则"派生。绝不申请未使用的权限——会被 Garmin 审核拒。

## 2. `monkey.jungle` 生成

```
project.manifest = manifest.xml

# 默认资源
base.resourcePath = resources

# 形状特化
{{ for each shape in {round, square, rectangle} }}
{{shape}}.resourcePath = resources-{{shape}}
{{ end }}

# 设备特化（仅对需要差异化资源的设备）
{{ for each device in targets where has_specialized_resources }}
{{device.id}}.resourcePath = resources-device-{{device.id}}
{{ end }}

# 排除规则（节省体积）
{{ for each device in targets }}
{{device.id}}.excludeAnnotations = {{ devices_other_than(device) }}
{{ end }}
```

**规则要点**：
- 用 jungle 的 device-specific resourcePath 让每个设备只打包自己需要的图（关键的体积优化）。
- `excludeAnnotations` 用于剔除其他设备特定的代码块（结合 `(:device_id)` 注解）。

## 3. 颜色与字体资源

`resources/colors.xml`：

```xml
<resources>
  <color id="ColorPrimary">{{ color_scheme.primary }}</color>
  <color id="ColorSecondary">{{ color_scheme.secondary }}</color>
  <color id="ColorAccent">{{ color_scheme.accent }}</color>
  <color id="ColorDanger">{{ color_scheme.danger }}</color>
  <color id="ColorBackground">{{ color_scheme.background }}</color>
  {{ if color_scheme.supports_aod }}
  <color id="ColorPrimaryAod">{{ color_scheme.aod_overrides.primary || color_scheme.primary }}</color>
  ...
  {{ end }}
</resources>
```

**MIP 屏幕设备特殊规则**：颜色会自动量化到设备调色板（fenix MIP 屏只有 16 色）。Agent 需在 `resources-mip/colors.xml` 中生成量化后的颜色，而不是让 SDK 在运行时量化（运行时量化会闪屏）。

`resources/fonts.xml`：

```xml
<resources>
  <font id="FontMain" filename="../fonts/system_numeric_large.fnt" />
  <!-- v0.1 仅系统字体，filename 为 SDK 提供的预置字体路径 -->
</resources>
```

实际上 v0.1 **不打包字体文件**，而是用 SDK `Graphics.FONT_*` 常量。`resources/fonts.xml` 在 v0.2 引入自定义字体时启用。

字体引用通过代码常量映射：

| `family` (IR) | Monkey C 常量 |
|---|---|
| `system-tiny` | `Graphics.FONT_XTINY` |
| `system-small` | `Graphics.FONT_TINY` |
| `system-medium` | `Graphics.FONT_SMALL` |
| `system-large` | `Graphics.FONT_LARGE` |
| `system-numeric-large` | `Graphics.FONT_NUMBER_HOT` |
| `system-numeric-mild` | `Graphics.FONT_NUMBER_MILD` |

> ⚠️ 不同 SDK 版本提供的字体常量可能微调。Agent 在 SDK 升级时必须更新本表。

## 4. `source/App.mc`（应用入口，几乎固定）

```monkey-c
import Toybox.Application;
import Toybox.WatchUi;
import Toybox.Lang;

class WeWatchApp extends Application.AppBase {
    function initialize() {
        AppBase.initialize();
    }

    function onStart(state as Lang.Dictionary?) as Void {}
    function onStop(state as Lang.Dictionary?) as Void {}

    function getInitialView() as Lang.Array<WatchUi.Views or WatchUi.InputDelegates>? {
        return [ new WeWatchView() ] as Lang.Array<WatchUi.Views or WatchUi.InputDelegates>;
    }
}
```

**Agent 不应修改此文件结构**，仅做必要的 import 增加。

## 5. `source/View.mc`（核心绘制逻辑）

这是 Agent 最复杂的生成对象。模板骨架：

```monkey-c
import Toybox.WatchUi;
import Toybox.Graphics;
import Toybox.System;
import Toybox.Lang;
import Toybox.ActivityMonitor;   // 按需

class WeWatchView extends WatchUi.WatchFace {

    private var _w as Lang.Number = 0;
    private var _h as Lang.Number = 0;
    private var _isAod as Lang.Boolean = false;

    function initialize() {
        WatchFace.initialize();
    }

    function onLayout(dc as Graphics.Dc) as Void {
        _w = dc.getWidth();
        _h = dc.getHeight();
    }

    function onShow() as Void {}
    function onHide() as Void {}

    function onUpdate(dc as Graphics.Dc) as Void {
        // 1. 清空
        dc.setColor(Graphics.COLOR_TRANSPARENT, getBgColor());
        dc.clear();

        // 2. 背景
        drawBackground(dc);

        // 3. 元素（按 IR layout.elements 顺序）
        {{ for each element in layout.elements }}
        draw_{{element.id}}(dc);
        {{ end }}
    }

    function onPartialUpdate(dc as Graphics.Dc) as Void {
        // AOD 部分更新：仅根据 aod_strategy 与每个元素 visibility.aod_visible 决定
        {{ for each element where aod_visible }}
        draw_{{element.id}}(dc);
        {{ end }}
    }

    function onEnterSleep() as Void {
        _isAod = true;
        WatchUi.requestUpdate();
    }

    function onExitSleep() as Void {
        _isAod = false;
        WatchUi.requestUpdate();
    }

    // ----- 元素绘制函数（一个元素一个） -----
    {{ for each element in layout.elements }}
    {{ generate_draw_function(element) }}
    {{ end }}

    // ----- 工具函数 -----
    private function getBgColor() as Lang.Number {
        return Application.loadResource(Rez.Strings.ColorBackground) as Lang.Number;
    }
}
```

### 5.1 元素绘制函数生成规则

每种 element type 对应一种 `generate_draw_function` 实现：

#### `time` 元素

```monkey-c
private function draw_el_time(dc as Graphics.Dc) as Void {
    var clockTime = System.getClockTime();
    var s = Lang.format("$1$:$2$", [
        clockTime.hour.format("%02d"),
        clockTime.min.format("%02d")
    ]);

    var color = _isAod
        ? (Application.loadResource(Rez.Colors.ColorPrimaryAod) as Lang.Number)
        : (Application.loadResource(Rez.Colors.ColorPrimary) as Lang.Number);

    dc.setColor(color, Graphics.COLOR_TRANSPARENT);
    dc.drawText(
        (_w * {{ anchor.x }}).toNumber(),
        (_h * {{ anchor.y }}).toNumber(),
        Graphics.{{ map_font_to_const }},
        s,
        Graphics.TEXT_JUSTIFY_{{ map_align }} | Graphics.TEXT_JUSTIFY_VCENTER
    );
}
```

#### `date` 元素

类似 `time`，但调用 `Time.Gregorian.info(Time.now(), Time.FORMAT_MEDIUM)` 并按 `props.format` 重组。

> **本地化注意**：`props.locale == "auto"` 时，Garmin 会按设备系统语言自动选择。`zh-CN` 时月份要用中文（`Lang.format("$1$月$2$日", ...)`）。

#### `text` 元素（静态）

直接 `dc.drawText` 出 `props.content`。如包含 `{{binding_id}}`，先解引用 binding 当前值。

#### `image` 元素

```monkey-c
private function draw_el_image(dc as Graphics.Dc) as Void {
    var bmp = WatchUi.loadResource(Rez.Drawables.{{asset_id}}) as Graphics.BitmapResource;
    dc.drawBitmap(
        ((_w * {{ anchor.x }}) - bmp.getWidth() / 2).toNumber(),
        ((_h * {{ anchor.y }}) - bmp.getHeight() / 2).toNumber(),
        bmp
    );
}
```

#### `shape` 元素（rectangle / circle / line / arc）

按 props.kind 分支：
- `rectangle` → `dc.fillRectangle` / `drawRectangle`
- `circle` → `dc.fillCircle` / `drawCircle`
- `line` → `dc.drawLine`
- `arc` → `dc.drawArc`

#### `complication` 元素

每种 `data_type` 都有专用取数与渲染：

```monkey-c
// data_type == "heart_rate"
private function draw_el_hr(dc as Graphics.Dc) as Void {
    var hr = Activity.getActivityInfo().currentHeartRate;
    var s = (hr == null) ? "--" : hr.toString();

    var color = Application.loadResource(Rez.Colors.ColorAccent) as Lang.Number;
    dc.setColor(color, Graphics.COLOR_TRANSPARENT);
    dc.drawText(
        (_w * {{ anchor.x }}).toNumber(),
        (_h * {{ anchor.y }}).toNumber(),
        Graphics.{{ font }},
        s + " BPM",
        Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER
    );
}
```

每个 data_type 的取数 API、null 处理、单位转换都在 `complications/` 子模板内一一固化。Agent 不允许"创造性"取数。

#### `progress_arc` 元素

```monkey-c
private function draw_el_steps_arc(dc as Graphics.Dc) as Void {
    var info = ActivityMonitor.getInfo();
    var steps = info.steps != null ? info.steps : 0;
    var goal = info.stepGoal != null ? info.stepGoal : 10000;
    var pct = (steps.toFloat() / goal.toFloat()).clamp(0.0, 1.0);

    var sweep = {{ sweep_angle }} * pct;

    // 背景弧
    dc.setColor(Application.loadResource(Rez.Colors.ColorSecondary) as Lang.Number, Graphics.COLOR_TRANSPARENT);
    dc.setPenWidth({{ thickness }});
    dc.drawArc(_w / 2, _h / 2, _w / 2 - {{ thickness }},
               Graphics.ARC_CLOCKWISE,
               {{ start_angle }}, {{ start_angle + sweep_angle }});

    // 进度弧
    dc.setColor(Application.loadResource(Rez.Colors.ColorAccent) as Lang.Number, Graphics.COLOR_TRANSPARENT);
    dc.drawArc(_w / 2, _h / 2, _w / 2 - {{ thickness }},
               Graphics.ARC_CLOCKWISE,
               {{ start_angle }}, {{ start_angle }} + sweep);
}
```

### 5.2 AOD 处理总规则

- `onPartialUpdate` 只绘制 `visibility.aod_visible == true` 的元素。
- AMOLED 设备的 AOD 模式禁止画大面积亮色（防烧屏）—— Agent 在生成 AOD 路径代码时强制把所有 fill 区域 ≥ 30% 屏幕的元素降级为描边模式。
- AOD 帧率严格按 `aod_strategy` 控制：
  - `static` → 不实现 `onPartialUpdate`（仅在分钟变化时刷新整屏）
  - `minimal_seconds` → 实现 `onPartialUpdate`，且只更新时间区域（用 `dc.setClip` 限定区域）
  - `full` → 实现 `onPartialUpdate` 全画面，但 Agent 只对支持的设备启用

### 5.3 性能反模式禁忌

Agent 在生成代码时**绝不允许**出现以下模式：

| 反模式 | 替代 |
|---|---|
| `onUpdate` 中 `loadResource` | 在 `onLayout` 缓存到成员变量 |
| 字符串拼接 `"a" + "b" + "c"` 多次 | 使用 `Lang.format` |
| 在 `onPartialUpdate` 中分配新对象 | 仅复用预分配对象 |
| 任意位置使用 `dc.fillPolygon`（极慢） | 改用多次 `fillRectangle` 或预渲染 bitmap |
| 大量浮点运算 | 转 fixed-point 或预计算 |
| `requestUpdate()` 在 `onUpdate` 中调用 | 永远不允许 |

## 6. `source/Bindings.mc`（数据绑定缓存）

```monkey-c
import Toybox.System;
import Toybox.ActivityMonitor;

module Bindings {
    var _hrCache as Lang.Number? = null;
    var _hrCachedAt as Lang.Number = 0;

    function getHr() as Lang.Number? {
        var now = System.getTimer();
        if (_hrCache == null || (now - _hrCachedAt) > {{ ttl_ms }}) {
            var info = Activity.getActivityInfo();
            _hrCache = info != null ? info.currentHeartRate : null;
            _hrCachedAt = now;
        }
        return _hrCache;
    }
    // ... 其余 binding 同模式
}
```

## 7. 多设备特化（基于 jungle annotation）

对需要"针对单个设备生成不同代码"的情况（罕见但存在），使用 `(:device_id)` 注解：

```monkey-c
(:fenix7)
function getMaxBrightness() { return 1000; }

(:venu3)
function getMaxBrightness() { return 600; }
```

并在 `monkey.jungle` 中通过 `excludeAnnotations` 控制每个 build target 包含哪一份。

## 8. 生成器自检（生成完后必跑）

Agent 在生成完所有源文件后，必须自动跑下列静态检查（在 `monkeyc` 编译之前）：

1. **每个 element 都有对应 draw 函数**
2. **每个 color_ref / font_ref 都已在 resources 中定义**
3. **每个 import 都在文件头声明**
4. **没有 TODO / FIXME / placeholder 字符串残留**
5. **没有硬编码 hex 颜色或 magic number**（除注释/字符串外）
6. **AOD 路径不含违规 fill**

任一失败 → 修正或拒绝任务。

---

**版本**：0.1.0
**最后更新**：2026-04-26
**与 IR_SCHEMA.md 的版本绑定**：本文件 v0.1.x 仅适用于 IR v0.1.x
