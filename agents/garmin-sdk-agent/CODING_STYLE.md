# Monkey C 编码规范 · v0.1.0

> 本规范是 Garmin SDK Agent 自动生成代码必须遵循的样式与性能契约。审查 PR 时也以此为准。
> 原则：**保守 > 炫技**；**可读 > 简短**；**分配少 > 写法美**。

---

## 1. 命名

- 类名：`PascalCase`，例如 `WeWatchView`、`ComplicationDrawer`。
- 函数 / 方法：`camelCase`。
- 私有成员：以下划线前缀，例如 `_isAod`、`_w`、`_hrCache`。
- 常量：`UPPER_SNAKE`，仅用于 module 级。
- 资源 ID：`PascalCase`，分类前缀（`Color*` / `Font*` / `Drawable*` / `String*`）。
- 元素绘制函数固定模式：`draw_<element_id>(dc)`，element_id 来自 IR。

## 2. 类型注解

- **强制类型注解**所有函数参数与返回值。Monkey C 强类型检查器对没注解的代码不做严格分析。
- 优先使用 SDK 提供的具体类型（`Lang.Number`、`Lang.Boolean`、`Graphics.Dc`），避免 `Object`。
- Nullable 一律显式：`Lang.Number?` 而不是 `Lang.Number`（即使你"知道"它非空）。

```monkey-c
// ✅ 好
private function drawHeartRate(dc as Graphics.Dc, hr as Lang.Number?) as Void { ... }

// ❌ 差
private function drawHeartRate(dc, hr) { ... }
```

## 3. 注释规则

- 文件头必须包含：生成时间、生成器版本、源 IR id（便于回溯）。
- 每个 `draw_<id>` 函数前一行注释：`// IR element: <id>, type=<type>`。
- 不允许 TODO / FIXME 残留在生成代码中（应抛错或作为 Playbook 条目）。

## 4. 资源访问

- **统一 `Application.loadResource` 入口**，避免直接 `Rez.X.Y as Y`（生成器在 helper 函数封装）。
- 重资源（Bitmap、Font）必须在 `onLayout` 缓存为成员变量，禁止 `onUpdate` / `onPartialUpdate` 中重新加载。
- 字符串资源永远走 `Rez.Strings.*`，禁止硬编码字面量（多语言友好）。

## 5. 性能模式（必须遵守）

| 模式 | 规则 |
|---|---|
| **预分配** | 所有循环内复用的对象在 `initialize` 或 `onLayout` 中分配 |
| **避免装箱** | 整数运算用 `Number`，浮点不必要时不用 `Float` |
| **字符串拼接** | 多片段用 `Lang.format`，避免 `"a" + "b" + "c"` 链式拼接 |
| **避免 try/catch 热路径** | `onUpdate` / `onPartialUpdate` 中禁用 try/catch（分配 Exception 对象昂贵）|
| **绘制顺序** | 最大区域元素先画，小元素后画（减少 over-draw） |
| **尽量少 setColor** | 同色批量绘制，减少 GPU 状态切换 |
| **AOD 严格** | `onPartialUpdate` 必须用 `dc.setClip` 限定区域；不允许 setColor 全屏调用 |

## 6. AOD 反模式（违反 = build 失败）

```monkey-c
// ❌ 完全错误：AOD 中分配新对象 + 全屏 fill
function onPartialUpdate(dc) {
    var s = "Hello " + System.getClockTime().hour;  // 分配
    dc.setColor(0xFFFFFF, Graphics.COLOR_TRANSPARENT);
    dc.fillRectangle(0, 0, 454, 454);                // 烧屏 + 耗电
    dc.drawText(...);
}

// ✅ 正确：clip + 复用 + 描边
function onPartialUpdate(dc) {
    dc.setClip(_timeRegion.x, _timeRegion.y, _timeRegion.w, _timeRegion.h);
    dc.setColor(_aodFg, Graphics.COLOR_TRANSPARENT);
    dc.drawText(_timeAnchorX, _timeAnchorY, _timeFont, _timeStringCache,
                Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
}
```

## 7. Null 处理

- 所有传感器读数都按"可能为 null"处理，UI 显示 `--`，绝不 crash。
- 用早返：

```monkey-c
function drawHeartRate(dc as Graphics.Dc) as Void {
    var info = Activity.getActivityInfo();
    if (info == null) { drawHrPlaceholder(dc); return; }
    var hr = info.currentHeartRate;
    if (hr == null) { drawHrPlaceholder(dc); return; }
    drawHrValue(dc, hr);
}
```

## 8. 设备特化（注解）

- 每个设备特定函数必须用 `(:device_id)` 注解，并在 `monkey.jungle` 中通过 `excludeAnnotations` 控制。
- 命名约定：注解使用 device_id 全小写（`(:fr255)`、`(:venu3)`）。
- 一个文件不允许同时包含 3+ 套设备特化分支——拆为单独的设备特化文件。

## 9. 模块化

- 每个 IR 元素类型对应 `source/elements/<type>.mc`，函数命名 `draw_<id>`。
- 复杂逻辑（数据缓存、单位转换、本地化日期）拆到 `source/lib/`。
- View.mc 保持薄。

## 10. 自检清单（生成器在 emit 后跑）

- [ ] 所有函数都有类型注解
- [ ] 没有硬编码颜色 hex（除资源 XML 外）
- [ ] 没有硬编码字符串字面量（用户可见的）
- [ ] 没有 TODO / FIXME / placeholder
- [ ] `onUpdate` 不调用 `loadResource`
- [ ] `onPartialUpdate` 不分配对象、不调用 `requestUpdate`
- [ ] 所有传感器调用都做 null 检查
- [ ] 文件头有元数据注释

---

**版本**：0.1.0
**最后更新**：2026-04-26
