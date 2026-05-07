# 性能预算 · v0.1.0

> Agent 在生成与编译前必须做"预算估算"。任一项预算被突破 → 拒绝任务并返回明确改动建议。
>
> 数字均为**保守基线**，需在 Phase 0 实际编译多个 demo 后校准并写回本文件。

---

## 1. 内存预算（按设备类）

| 设备类 | 总可用 | 资源上限 | 代码上限 | 运行时上限 | 触发动作 |
|---|---|---|---|---|---|
| Instinct 2 / Instinct 2X / Crossover | 32 KB | 12 KB | 8 KB | 12 KB | 超 70% 拒绝 |
| Forerunner 55 / Swim 2 | 32 KB | 12 KB | 8 KB | 12 KB | 同上 |
| Vivomove Trend | 32 KB | 10 KB | 8 KB | 14 KB | 同上（混合机制保留更多 RT）|
| FR255 / FR955 / fenix7 / Venu2 | 64-96 KB | 30 KB | 20 KB | 30-46 KB | 超 70% 拒绝 |
| FR165 / Venu2S / Vivoactive 5 | 96 KB | 35 KB | 22 KB | 39 KB | 超 70% 拒绝 |
| FR265 / FR965 / Venu3 / fenix7 Pro | 128 KB | 55 KB | 28 KB | 45 KB | 超 70% 拒绝 |
| epix2 / MARQ Gen2 / fenix7 Pro AMOLED | 128 KB | 55 KB | 28 KB | 45 KB | 超 70% 拒绝 |

**估算方法**（在 codegen 阶段执行）：
- **资源**：所有 PNG/JPG 字节数之和 + 自定义字体字节数 × 1.05（解码 overhead）
- **代码**：每 KB 源码估算 ~0.6 KB 字节码（保守）；编译后用 `monkeyc --output-bytecode-size` 校正
- **运行时**：每个动态字符串、缓存对象按声明大小累加；位图运行时 = `width × height × bytes_per_pixel × 1.2`

## 2. 帧率预算

| 模式 | 设备 | 最大帧率 | 实际策略 |
|---|---|---|---|
| Active（亮屏） | MIP 全部 | 1 Hz | 仅在分钟变化或交互时 `requestUpdate` |
| Active | AMOLED 全部 | 1 Hz（默认）/ 60 Hz（动效场景，仅短暂） | IR.performance_hints.redraw_budget = high 时允许 |
| AOD | MIP 全部 | N/A（MIP 无 AOD）| static |
| AOD | AMOLED 96KB | 1/60 Hz | minimal_seconds：仅每 1 分钟刷新时间区域 |
| AOD | AMOLED 128KB Pro 系列 | 1 Hz | full：可每秒刷新，但仅限 setClip 区域 |

## 3. 电池影响预算

**目标**：weWatch 表盘相比 Garmin 原生表盘多耗电不超过 5%（24h 周期）。

| 行为 | 估算耗电增量 / 24h | 触发降级 |
|---|---|---|
| 心率 complication（30s TTL） | ~1% | OK |
| 天气 complication（10min TTL） | ~0.5% | OK |
| GPS 触发 | ~10% | 禁止表盘触发 GPS |
| AOD full 模式 | ~3-8% | 仅 Pro 设备 |
| AOD 全屏渐变背景 | ~5% | 强制简化为单色 |
| 后台数据请求（HTTP）| ~2% / 次 | 表盘禁止；Widget 才允许 |

## 4. 包体积预算

| 类型 | 单设备 .prg 上限 | 触发动作 |
|---|---|---|
| 全部 MIP 设备 | 80 KB | 超出警告，超 100KB 拒绝 |
| AMOLED 96KB | 100 KB | 超 120KB 拒绝 |
| AMOLED 128KB | 150 KB | 超 180KB 拒绝 |

包体积 = `.prg` 文件物理大小（含资源、字节码、元数据）。Connect IQ Store 对 `.iq` 整体包也有上限（视设备数量，~8MB 量级）。

## 5. 编译时间预算（CI）

| 阶段 | 单 device 上限 | 单任务总上限（30 设备） |
|---|---|---|
| codegen | 5 s | 5 s（一次性） |
| monkeyc | 30 s | 5 min（并行） |
| 模拟器截图 | 15 s | 4 min（并行） |
| 报告生成 + PR | 10 s | 10 s |
| **总计** | - | **~10 min** |

超出 → DevOps 告警 + 性能优化 issue。

## 6. 调用预算（Garmin SDK API）

- `Activity.getActivityInfo()`：**每帧最多 1 次**，结果缓存到帧末。
- `Toybox.Weather.getCurrentConditions()`：**TTL ≥ 10 分钟**。
- `System.getClockTime()`：可频繁调用（轻量），但仍建议每帧只调 1 次。
- `WatchUi.loadResource`：仅在 `onLayout` / `initialize`，禁止 `onUpdate`。

---

## 7. 校准流程

1. Phase 0 完成 5-8 个真机表盘后，分别测：
   - 实际 .prg 大小
   - 模拟器内存峰值（用 `monkeydo --device <id> --debug`）
   - 真机 24h 电池消耗对比
2. 把实测值与本表对比，差异 > 20% 则更新本表。
3. 每次 SDK 升级后重新校准。

---

**版本**：0.1.0
**最后更新**：2026-04-26
**首次校准截止**：Phase 0 结束（M2）
