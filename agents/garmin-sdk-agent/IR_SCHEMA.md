# Watch Face IR Schema · v0.1.0

> **IR (Intermediate Representation)** 是 weWatch 平台所有"表盘描述"的统一中间格式。
> - 设计师工具（可视化编辑器）输出 IR
> - AI 生成器输出 IR
> - 后端存储 IR（PostgreSQL JSONB 字段）
> - Garmin SDK Agent 接收 IR → 翻译为 Monkey C → 编译为 .prg
>
> 未来扩展到其他厂商（Wear OS、华为、小米）时，IR 不变，只增加新的"翻译器"。
>
> **设计原则**：声明式（描述"是什么"而非"怎么画"），与具体设备无关，足够表达 95% 的实用表盘需求。剩余 5% 通过 `escape_hatch` 字段提供低层覆盖。

---

## Schema 总览

```jsonc
{
  "ir_version": "0.1.0",
  "meta": {
    "id": "wf_xxx",                    // 平台分配
    "designer_id": "ds_xxx",
    "name": { "default": "...", "zh-CN": "...", "en-US": "..." },
    "description": { "default": "..." },
    "tags": ["sport", "minimal", "amoled"],
    "created_at": "ISO8601",
    "license": "platform-default" | "cc-by" | "custom",
    "ai_generated": false,
    "ip_review_status": "pending" | "approved" | "rejected"
  },
  "canvas": {
    "shape": "round" | "square" | "rectangle",
    "reference_resolution": [454, 454],   // 设计稿原始分辨率，渲染时按比例缩放
    "background": { ... 见 §背景 ... }
  },
  "color_scheme": {
    "primary": "#FFFFFF",
    "secondary": "#888888",
    "accent": "#FF6600",
    "danger": "#FF0033",
    "background": "#000000",
    "supports_aod": true,
    "aod_overrides": { "primary": "#666666", ... }
  },
  "typography": {
    "fonts": [
      {
        "id": "main",
        "family": "system-large",        // 见 §字体策略
        "fallback": "system-medium"
      }
    ]
  },
  "layout": {
    "engine": "anchor",                   // anchor | grid（v0.1 仅 anchor）
    "elements": [ ... 见 §元素 ... ]
  },
  "interactions": [ ... 见 §交互（可选）... ],
  "data_bindings": [ ... 见 §数据绑定 ... ],
  "performance_hints": {
    "redraw_budget": "low" | "medium" | "high",
    "aod_strategy": "static" | "minimal_seconds" | "full"
  },
  "escape_hatch": {
    "monkey_c_snippets": []               // 仅签约设计师可用，需安全审核
  }
}
```

---

## §背景 (canvas.background)

```jsonc
{
  "type": "solid" | "gradient" | "image" | "layered",
  "solid": { "color": "#000000" },
  "gradient": {
    "kind": "linear" | "radial",
    "stops": [{ "offset": 0, "color": "#000" }, { "offset": 1, "color": "#222" }],
    "angle_deg": 45              // linear 必填
  },
  "image": {
    "asset_id": "asset_bg_001",
    "fit": "cover" | "contain" | "tile",
    "tint": null | "#FF000080"
  },
  "layered": {
    "layers": [ /* 嵌套上面任意一种 */ ]
  }
}
```

**重要约束**：
- `image` 类型在 MIP 屏幕设备上会自动量化为 8/16 色调色板，agent 不接受高频细节背景（会自动 dither 但效果差）。
- 渐变在 MIP 屏幕上自动降级为 2-3 色 banding。

## §字体策略 (typography.fonts)

为避免引入大体积自定义字体导致内存爆炸，**v0.1 仅支持系统字体族**：

| family | 适用 | 描述 |
|---|---|---|
| `system-tiny` | 全设备 | 用于角标 |
| `system-small` | 全设备 | 用于副信息 |
| `system-medium` | 全设备 | 用于通用文本 |
| `system-large` | 全设备 | 用于次要时间显示 |
| `system-xtiny` | 部分设备 | 极小字体（不在所有设备可用，需 fallback） |
| `system-numeric-large` | 全设备 | 数字专用大字体（推荐用于时间显示） |

自定义字体支持在 v0.2 引入，需走单独的"字体审核"流程。

## §元素 (layout.elements)

每个元素都是以下类型之一：

```jsonc
{
  "id": "el_time_main",
  "type": "time" | "date" | "text" | "image" | "shape" | "complication" | "indicator" | "progress_arc",
  "anchor": {
    "x": 0.5,                       // 相对画布宽度的比例 [0,1]
    "y": 0.5,                       // 相对画布高度的比例 [0,1]
    "align_x": "center" | "left" | "right",
    "align_y": "middle" | "top" | "bottom"
  },
  "size": {
    "mode": "auto" | "fixed",
    "width": 0.4,                   // mode=fixed 时使用，比例
    "height": 0.1
  },
  "style": {
    "color_ref": "primary" | "accent" | "#FF0000",
    "font_ref": "main",
    "opacity": 1.0,
    "shadow": null
  },
  "visibility": {
    "always": true,
    "aod_visible": true,
    "conditions": [ ... 见 §条件可见 ... ]
  },
  "props": { ... 类型相关 ... }
}
```

### 类型 `time`
```jsonc
"props": {
  "format": "HH:mm" | "hh:mm" | "HH:mm:ss" | "h:mm",
  "show_leading_zero": true
}
```

### 类型 `date`
```jsonc
"props": {
  "format": "YYYY-MM-DD" | "MMM dd" | "ddd, MMM dd" | "yyyy年MM月dd日",
  "locale": "auto" | "zh-CN" | "en-US"
}
```

### 类型 `text`
```jsonc
"props": {
  "content": "WeWatch",            // 静态文本，或 {{binding_id}} 引用 data binding
  "max_chars": 12
}
```

### 类型 `image`
```jsonc
"props": {
  "asset_id": "asset_xxx"
}
```

### 类型 `shape`
```jsonc
"props": {
  "kind": "rectangle" | "circle" | "line" | "arc",
  "stroke_width": 2,
  "fill": true,
  // arc 特定
  "start_angle": -90, "end_angle": 270
}
```

### 类型 `complication`（数据小部件）
```jsonc
"props": {
  "data_type": "heart_rate" | "steps" | "battery" | "calories" | "distance"
             | "weather_temp" | "weather_condition" | "moonphase"
             | "next_calendar" | "stress" | "body_battery" | "active_minutes",
  "display_style": "value" | "icon_value" | "ring_value" | "bar_value",
  "label": "BPM" | null,
  "unit_system": "metric" | "imperial" | "auto"
}
```

> **设备能力检查**：每个 complication 都需要目标设备具备相应传感器或数据源。Agent 在校验阶段会逐设备检查（见 `DEVICE_MATRIX.md`），不满足时按 IR 中的 `fallback_strategy` 处理（默认：从该设备的目标列表中剔除）。

### 类型 `indicator`（状态指示器）
```jsonc
"props": {
  "kind": "bluetooth" | "do_not_disturb" | "alarm" | "phone_battery_low",
  "icon_set": "default" | "minimal"
}
```

### 类型 `progress_arc`（进度弧）
```jsonc
"props": {
  "data_type": "steps_progress" | "calories_progress" | "active_minutes_progress",
  "start_angle": -90,
  "sweep_angle": 360,
  "thickness": 6,
  "background_color_ref": "secondary",
  "fill_color_ref": "accent"
}
```

## §条件可见 (visibility.conditions)

```jsonc
[
  { "when": "battery_level", "op": "lt", "value": 20 },
  { "when": "is_charging", "op": "eq", "value": true },
  { "when": "time_hour", "op": "between", "value": [22, 6] }   // 夜间模式
]
```

逻辑：所有 conditions AND；如需 OR，拆为多个元素或在 v0.2 引入 `logic_groups`。

## §数据绑定 (data_bindings)

用于把同一份数据复用到多个元素（节省运行时取数次数）：

```jsonc
[
  { "id": "hr", "source": "Toybox.ActivityMonitor.getHeartRateHistory", "ttl_sec": 30 },
  { "id": "weather", "source": "Toybox.Weather.getCurrentConditions", "ttl_sec": 600 }
]
```

元素中以 `{{hr.value}}` 形式引用。

## §性能预算提示 (performance_hints)

| 字段 | 取值 | 含义 |
|---|---|---|
| `redraw_budget.low` | 1 帧/分钟 | 极简，最省电 |
| `redraw_budget.medium` | 1 帧/秒（仅活跃模式）| 标准 |
| `redraw_budget.high` | 1 帧/秒（含 AOD 部分）| 重；仅 AMOLED 设备且 IR 经审核 |
| `aod_strategy.static` | AOD 完全静态截图 | 默认 |
| `aod_strategy.minimal_seconds` | 仅秒数 / 时分跳变 | 中等耗电 |
| `aod_strategy.full` | AOD 持续渲染 | 仅 fenix 7 Pro+ 等设备允许 |

Agent 会**强制根据目标设备能力裁剪此字段**——例如 MIP 屏幕设备一律降为 `low` + `static`。

## §Escape Hatch（高级，受限）

```jsonc
"escape_hatch": {
  "monkey_c_snippets": [
    {
      "id": "custom_anim",
      "phase": "before_draw" | "after_draw" | "on_partial_update",
      "code": "..."  // 字符串 Monkey C 代码
    }
  ]
}
```

- 仅"签约设计师"账号可使用此字段。
- 所有代码必须经 Security Agent 静态审计（禁止网络、文件系统、未公开 API、潜在死循环）。
- Agent 在生成时按 phase 注入到对应 hook，并加入沙箱性能监测代码。

## 校验规则速查（Agent 必做）

1. `ir_version` 必须在 Agent 支持范围内（当前：仅 `0.1.x`）
2. `meta.id` 必须存在且唯一
3. `canvas.shape` 必须与至少一个 target 设备匹配
4. 每个 element 的 `id` 在同一 IR 内唯一
5. 所有 `color_ref` / `font_ref` / `asset_id` / `binding_id` 必须能解析到定义
6. 所有 `complication.data_type` 必须有至少一个 target 设备支持
7. `escape_hatch.monkey_c_snippets` 仅当 `meta.designer_tier == "signed"` 时允许
8. `meta.ip_review_status == "approved"` 才允许进入构建
9. 资源体积总和（图片+字体）按设备最大可用内存的 60% 估算，超出则拒绝

校验失败时，Agent 必须返回：

```json
{
  "task_id": "...",
  "status": "rejected",
  "rejection_reason_code": "IR_VALIDATION",
  "rejection_details": [
    { "path": "layout.elements[2].props.data_type", "issue": "device 'instinct2' lacks weather_temp", "suggestion": "remove instinct2 from targets, OR add fallback_strategy" }
  ]
}
```

---

## 完整示例（极简表盘）

```json
{
  "ir_version": "0.1.0",
  "meta": {
    "id": "wf_demo_001",
    "designer_id": "ds_founder",
    "name": { "default": "weWatch Hello" },
    "tags": ["minimal", "demo"],
    "ip_review_status": "approved"
  },
  "canvas": {
    "shape": "round",
    "reference_resolution": [390, 390],
    "background": { "type": "solid", "solid": { "color": "#000000" } }
  },
  "color_scheme": {
    "primary": "#FFFFFF",
    "secondary": "#666666",
    "accent": "#FF6600",
    "danger": "#FF0033",
    "background": "#000000",
    "supports_aod": true,
    "aod_overrides": { "primary": "#888888", "accent": "#444444" }
  },
  "typography": {
    "fonts": [
      { "id": "main", "family": "system-numeric-large", "fallback": "system-large" },
      { "id": "small", "family": "system-small" }
    ]
  },
  "layout": {
    "engine": "anchor",
    "elements": [
      {
        "id": "el_time",
        "type": "time",
        "anchor": { "x": 0.5, "y": 0.5, "align_x": "center", "align_y": "middle" },
        "size": { "mode": "auto" },
        "style": { "color_ref": "primary", "font_ref": "main" },
        "visibility": { "always": true, "aod_visible": true },
        "props": { "format": "HH:mm", "show_leading_zero": true }
      },
      {
        "id": "el_date",
        "type": "date",
        "anchor": { "x": 0.5, "y": 0.7, "align_x": "center", "align_y": "middle" },
        "size": { "mode": "auto" },
        "style": { "color_ref": "secondary", "font_ref": "small" },
        "visibility": { "always": true, "aod_visible": false },
        "props": { "format": "ddd, MMM dd", "locale": "auto" }
      },
      {
        "id": "el_hr",
        "type": "complication",
        "anchor": { "x": 0.5, "y": 0.85, "align_x": "center", "align_y": "middle" },
        "size": { "mode": "auto" },
        "style": { "color_ref": "accent", "font_ref": "small" },
        "visibility": { "always": true, "aod_visible": false },
        "props": {
          "data_type": "heart_rate",
          "display_style": "icon_value",
          "label": "BPM"
        }
      }
    ]
  },
  "data_bindings": [
    { "id": "hr", "source": "Toybox.ActivityMonitor", "ttl_sec": 30 }
  ],
  "performance_hints": {
    "redraw_budget": "low",
    "aod_strategy": "static"
  }
}
```

---

**版本**：0.1.0
**最后更新**：2026-04-26
**Schema JSON Schema 文件（机读）**：`agents/garmin-sdk-agent/ir.schema.json`（待生成；建议用 `ts-json-schema-generator` 从 TS 类型自动生成，与后端共享）
