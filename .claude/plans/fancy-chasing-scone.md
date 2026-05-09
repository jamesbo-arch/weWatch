# 容器 App 动态渲染能力 — Render Spec + Monkey C 运行时渲染器

## Context

**已完成**：License MVP 已验证完整技术链路（设备序列号 → HMAC → LICENSED 界面），代码在 `feat/license-mvp` 分支。

**当前问题**：Monkey C App 只能显示固定的 LICENSED/LOCKED 状态，表盘样式是硬编码的。要成为真正的"容器 App"，需要从 API 动态获取表盘设计数据，在手表上运行时渲染不同的表盘样式。

**目标**：一个 `weWatch Player` Monkey C App，激活成功后从 API 拉取 **Render Spec（简化版表盘描述 JSON）**，在手表上运行时渲染出对应的表盘内容，无需重新编译或提交 IQ Store。

```
激活成功 → API 返回 renderSpec → Monkey C 解析 JSON → 运行时绘制表盘
```

---

## 架构

### Render Spec 格式（新增，独立于完整 IR）

Render Spec 是一个轻量 JSON，专为 Monkey C 运行时渲染设计（目标 < 2KB）：

```json
{
  "v": 1,
  "bg": "000000",
  "elements": [
    { "t": "arc",   "c": "00AA44", "r": 8 },
    { "t": "time",  "x": 50, "y": 42, "c": "FFFFFF", "f": "hot" },
    { "t": "text",  "x": 50, "y": 62, "v": "MIDNIGHT", "c": "00CC55", "f": "tiny" },
    { "t": "date",  "x": 50, "y": 72, "c": "666666", "f": "small" },
    { "t": "steps", "x": 50, "y": 82, "c": "8888FF", "f": "xtiny" },
    { "t": "heart", "x": 25, "y": 82, "c": "FF4444", "f": "xtiny" },
    { "t": "battery","x": 75, "y": 82, "c": "FFAA00", "f": "xtiny" }
  ]
}
```

**字段说明**（缩写 key 减少传输体积）：
- `v`：版本号
- `bg`：背景色（6 位 hex，不含 #）
- `t`：元素类型（arc/time/text/date/steps/heart/battery）
- `x`,`y`：位置（屏幕宽高百分比，0-100）
- `c`：颜色（6 位 hex）
- `f`：字体（hot/medium/small/tiny/xtiny → Garmin 内置字体）
- `v`：静态文本内容（仅 text 类型）
- `r`：arc 类型的内缩像素数

### 数据流

```
Monkey C onStart()
  → POST /api/v1/licenses/activate {deviceSerial, watchfaceId}
  ← { activated: true, licenseKey: "...", renderSpec: {...} }
  → 缓存 renderSpec 到 Application.Storage
  → 通知 WatchFaceView 用 spec 渲染

WatchFaceView.onUpdate(dc)
  → 读取 spec["elements"] 数组
  → 遍历每个元素，按 type 分发到对应 draw 函数
  → drawArc / drawTime / drawText / drawDate / drawSensor
```

---

## 需要修改的关键文件

| 文件 | 操作 |
|------|------|
| `apps/api/src/infra/db/schema/watchfaces.ts` | 新增 `renderSpec` JSONB 列 |
| `apps/api/src/infra/db/migrations/` | 生成 0003 迁移 |
| `apps/api/src/modules/licenses/dto/licenses.dto.ts` | 扩展 activate 响应，加入 `renderSpec` |
| `apps/api/src/modules/licenses/licenses.service.ts` | activate 时 JOIN watchfaces 取 renderSpec |
| `apps/api/src/modules/licenses/licenses.controller.ts` | 返回 renderSpec 字段 |
| `apps/web/src/app/activate/page.tsx` | 显示 renderSpec 预览（可选） |
| `tools/garmin-demo/source/LicenseDemoApp.mc` | 接收 renderSpec，传给 View |
| `tools/garmin-demo/source/LicenseDemoView.mc` | 重写为动态渲染器 |
| `tools/garmin-demo/source/LicenseChecker.mc` | 解析响应中的 renderSpec 字段 |

---

## 实现任务

### T1 — 数据库：watchfaces 表新增 renderSpec 列（30min）
- 在 `apps/api/src/infra/db/schema/watchfaces.ts` 增加：
  ```typescript
  renderSpec: jsonb('render_spec'),
  ```
- 生成迁移：`0003_add_render_spec.sql`
  ```sql
  ALTER TABLE watchfaces ADD COLUMN render_spec jsonb;
  ```
- 直接用 `docker exec wewatch-pg psql` 应用（同之前迁移方式）

### T2 — 为演示表盘填充 renderSpec（15min）
- 用 SQL 更新 ID = `24669676-c951-4dac-8c6e-052d57c0dfd3` 的表盘记录，写入 Midnight Minimal 的 renderSpec JSON（如上格式示例）
- 验证：`SELECT render_spec FROM watchfaces WHERE id = '...'`

### T3 — API：扩展 activate 响应（1h）
- `licenses.service.ts`：`activate()` 方法在激活成功后 JOIN watchfaces 取 `renderSpec`
  - `db.select({ renderSpec: watchfaces.renderSpec }).from(watchfaces).where(eq(watchfaces.id, watchfaceId))`
  - 追加到返回值
- `licenses.dto.ts`：activate 响应 Zod schema 新增 `renderSpec: z.record(z.unknown()).nullable()`
- `licenses.controller.ts`：响应中透传 `renderSpec`
- 验证：`curl -X POST .../activate` 返回 `{ activated, licenseKey, renderSpec: {...} }`

### T4 — API 单元测试更新（30min）
- 更新 `licenses.service.spec.ts`：mock watchfaces 查询，验证 renderSpec 被正确透传

### T5 — Monkey C：LicenseChecker 解析 renderSpec（30min）
- `LicenseChecker.mc`：`activate()` 回调中从 `data` 字典读取 `renderSpec` 字段
- 把 renderSpec 缓存到 `Application.Storage.setValue("renderSpec", spec)`
- 提供 `getRenderSpec() as Dictionary?` 方法供 View 调用

### T6 — Monkey C：重写 LicenseDemoView 为动态渲染器（2h）
重写 `LicenseDemoView.mc`，核心逻辑：

```monkeyc
function onUpdate(dc as Graphics.Dc) as Void {
    var spec = _renderSpec;
    if (spec == null) { drawLoading(dc); return; }
    if (_state == STATE_LOCKED) { drawLocked(dc); return; }

    // 背景色
    var bg = parseColor(spec["bg"]);
    dc.setColor(bg, bg); dc.clear();

    // 遍历 elements
    var elements = spec["elements"] as Array;
    for (var i = 0; i < elements.size(); i++) {
        var el = elements[i] as Dictionary;
        var type = el["t"].toString();
        if (type.equals("arc"))     { drawSpecArc(dc, el); }
        else if (type.equals("time"))    { drawSpecTime(dc, el); }
        else if (type.equals("text"))    { drawSpecText(dc, el); }
        else if (type.equals("date"))    { drawSpecDate(dc, el); }
        else if (type.equals("steps"))   { drawSpecSteps(dc, el); }
        else if (type.equals("heart"))   { drawSpecHeart(dc, el); }
        else if (type.equals("battery")) { drawSpecBattery(dc, el); }
    }
}
```

辅助函数：
- `parseColor(hexStr as String) as Number`：6 位 hex → Garmin 颜色整数
- `resolveFont(f as String) as Graphics.FontType`：字符串 → FONT_*
- `pctX(x as Number) as Number`、`pctY(y as Number) as Number`：百分比坐标 → 像素

### T7 — Monkey C：LicenseDemoApp 对接（30min）
- `onActivateResponse` 成功后，从 data 字典取 renderSpec
- 调用 `view.setRenderSpec(spec)` 和 `view.setState(STATE_UNLOCKED)`

### T8 — 编译 & 模拟器验证（30min）
```bash
monkeyc.bat -f tools/garmin-demo/monkey.jungle -o tools/garmin-demo/bin/LicenseDemo.prg \
  -y developer_key.der -d fr265
monkeydo.bat tools/garmin-demo/bin/LicenseDemo.prg fr265
```
验证模拟器显示由 API 动态返回的表盘样式（而非硬编码）。

---

## 验证标准

1. `POST /api/v1/licenses/activate` 响应中包含 `renderSpec` 字段（非 null）
2. 修改数据库中 renderSpec（改颜色/布局），不重新编译，重启 app 后模拟器显示新样式
3. 模拟器正确渲染：背景色、时间、日期、步数、心率、电量元素
4. App 离线时从 Application.Storage 读取上次缓存的 renderSpec 并正常渲染

---

## 技术风险

| 风险 | 缓解方案 |
|------|---------|
| Monkey C JSON 解析 nested array 的类型安全 | 每个 `elements[i]` 强转 Dictionary，null 检查每个字段 |
| Garmin 设备内存限制 | renderSpec 控制在 2KB 以内，elements 不超过 20 个 |
| Application.Storage 序列化 | Dictionary 可直接 setValue/getValue，无需手动序列化 |
| 字体映射不全 | 枚举所有支持的 Garmin 字体名称，fallback 到 FONT_SMALL |
