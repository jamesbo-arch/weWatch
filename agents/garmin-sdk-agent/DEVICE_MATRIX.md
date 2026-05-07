# Garmin Device Matrix · v0.1.0

> Top 30 主流在售 / 高活跃 Garmin 设备的能力矩阵。Agent 在校验 IR `targets` 时以本文件为唯一权威。
>
> ⚠️ 本表中具体数值（内存、API level、传感器型号）以本文档撰写时（2026-04）的官方 SDK 为准。**新设备发布或 SDK 升级后必须更新**。每个数字必须可追溯到 `developer.garmin.com` 的设备规格页。
>
> 字段说明见文末。

---

## 数据表

| device_id | 商品名 | shape | resolution | display | mem_kb | aod_supported | aod_strategy_max | hr | gps | weather | barometer | min_sdk | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `fr55`   | Forerunner 55  | round | 208×208 | MIP    | 32  | no  | static | yes | yes | yes | no  | 3.2 | 入门跑步表 |
| `fr165`  | Forerunner 165 | round | 390×390 | AMOLED | 96  | yes | minimal | yes | yes | yes | no  | 5.0 | 性价比极高 |
| `fr255`  | Forerunner 255 | round | 260×260 | MIP    | 64  | no  | static | yes | yes | yes | yes | 4.1 | 跑者主流 |
| `fr265`  | Forerunner 265 | round | 416×416 | AMOLED | 128 | yes | minimal | yes | yes | yes | yes | 5.0 | AMOLED 跑表 |
| `fr955`  | Forerunner 955 | round | 260×260 | MIP    | 96  | no  | static | yes | yes | yes | yes | 4.1 | 高端铁三 |
| `fr965`  | Forerunner 965 | round | 454×454 | AMOLED | 128 | yes | minimal | yes | yes | yes | yes | 5.0 | 高端铁三 AMOLED |
| `fenix7` | fenix 7        | round | 260×260 | MIP    | 96  | no  | static | yes | yes | yes | yes | 4.1 | 多运动旗舰 |
| `fenix7s`| fenix 7S       | round | 240×240 | MIP    | 96  | no  | static | yes | yes | yes | yes | 4.1 | 小尺寸 |
| `fenix7x`| fenix 7X       | round | 280×280 | MIP    | 96  | no  | static | yes | yes | yes | yes | 4.1 | 大尺寸 |
| `fenix7pro`| fenix 7 Pro  | round | 260×260 | MIP    | 128 | no  | static | yes | yes | yes | yes | 4.2 | + 心率改进 |
| `fenix7xpro_solar`| fenix 7X Pro Solar | round | 280×280 | MIP | 128 | no | static | yes | yes | yes | yes | 4.2 | 太阳能 |
| `fenix7pro_amoled`| fenix 7 Pro AMOLED | round | 416×416 | AMOLED | 128 | yes | full | yes | yes | yes | yes | 5.0 | AMOLED 旗舰 |
| `epix2`  | epix (Gen 2)   | round | 416×416 | AMOLED | 128 | yes | minimal | yes | yes | yes | yes | 4.1 | epix 经典 |
| `epix2pro_42`| epix Pro Gen2 42mm | round | 390×390 | AMOLED | 128 | yes | full | yes | yes | yes | yes | 4.2 | |
| `epix2pro_47`| epix Pro Gen2 47mm | round | 416×416 | AMOLED | 128 | yes | full | yes | yes | yes | yes | 4.2 | |
| `epix2pro_51`| epix Pro Gen2 51mm | round | 454×454 | AMOLED | 128 | yes | full | yes | yes | yes | yes | 4.2 | |
| `venu2`  | Venu 2         | round | 416×416 | AMOLED | 96  | yes | minimal | yes | yes | yes | no  | 3.2 | |
| `venu2s` | Venu 2S        | round | 360×360 | AMOLED | 96  | yes | minimal | yes | yes | yes | no  | 3.2 | |
| `venu3`  | Venu 3         | round | 454×454 | AMOLED | 128 | yes | full | yes | yes | yes | no  | 5.0 | 智能化最强 |
| `venu3s` | Venu 3S        | round | 390×390 | AMOLED | 128 | yes | full | yes | yes | yes | no  | 5.0 | |
| `vivoactive5` | Vivoactive 5 | round | 390×390 | AMOLED | 96 | yes | minimal | yes | yes | yes | no | 5.0 | 性价比智能表 |
| `instinct2`| Instinct 2   | round | 176×176 | MIP (单色叠加) | 32 | no | static | yes | yes | no  | yes | 3.2 | 户外硬汉 |
| `instinct2x`| Instinct 2X | round | 176×176 | MIP    | 32 | no | static | yes | yes | no  | yes | 3.2 | 大表盘版 |
| `instinct_crossover` | Instinct Crossover | round | 176×176 | MIP+混合指针 | 32 | no | static | yes | yes | no | yes | 3.2 | 混合表 |
| `marq2`  | MARQ Gen2      | round | 416×416 | AMOLED | 128 | yes | full | yes | yes | yes | yes | 4.2 | 商务奢华 |
| `tactix7` | tactix 7      | round | 260×260 | MIP    | 96  | no  | static | yes | yes | yes | yes | 4.1 | 战术 |
| `descentmk2` | Descent Mk2 | round | 280×280 | MIP   | 96  | no  | static | yes | yes | yes | yes | 4.1 | 潜水表 |
| `enduro2`| Enduro 2       | round | 280×280 | MIP    | 96  | no  | static | yes | yes | yes | yes | 4.1 | 超长续航 |
| `vivomove_trend`| Vivomove Trend | round | 390×390 | 混合 | 32 | no | static | yes | no  | yes | no  | 3.2 | 混合指针 |
| `swim2`  | Swim 2         | round | 208×208 | MIP    | 32  | no  | static | yes | yes | no  | no  | 3.2 | 游泳专用 |

---

## 字段说明

- **device_id**：Agent 内部使用的稳定 ID，与 jungle / manifest 中的 `product` 关键字对应（开发时以 SDK Devices 定义为准；本表 ID 为业务层别名）。
- **商品名**：用户面对的 Garmin 商品名。
- **shape**：`round` / `square` / `rectangle`。
- **resolution**：物理像素 `width × height`。
- **display**：`MIP`（反射式，常亮但色彩弱、调色板小）/ `AMOLED`（自发光，色彩佳但需 AOD 策略）/ 混合。
- **mem_kb**：Watch Face 类型可用内存上限（不是设备总内存）。**生成产物 + 运行时常驻必须 ≤ 此值的 70%**。
- **aod_supported**：是否支持 Always-On Display。
- **aod_strategy_max**：本设备允许的最高 AOD 策略（IR `performance_hints.aod_strategy` 不可超过此值）。
- **hr / gps / weather / barometer**：传感器/数据可用性。
- **min_sdk**：本设备最低支持的 Connect IQ SDK API level。

---

## 校验逻辑（Agent 必做）

收到 IR + targets 时，对每个 target 设备运行：

1. **IR shape 与设备 shape 匹配？** 不匹配 → 从 targets 剔除并报告。
2. **设备内存预算够吗？** 评估资源 + 预估代码 + 运行时分配，>70% 阈值 → 拒绝或简化。
3. **每个 complication 的 data_type 都有对应传感器？** 没有 → 按 fallback 处理（默认剔除）。
4. **performance_hints.aod_strategy ≤ device.aod_strategy_max？** 否 → 自动下调到设备允许的最高值并在 build_report 中标注。
5. **min_sdk 满足？** 否 → 设备剔除。

---

## 内存预算建议（来自实测，非官方）

| 设备类 | 资源占比上限 | 代码占比上限 | 运行时 |
|---|---|---|---|
| MIP 32KB（Instinct 2 类） | 12 KB | 8 KB | 12 KB |
| MIP 64-96KB | 30 KB | 20 KB | 30 KB |
| MIP 128KB | 50 KB | 28 KB | 50 KB |
| AMOLED 96KB | 35 KB | 22 KB | 35 KB |
| AMOLED 128KB | 55 KB | 28 KB | 45 KB |

**来源**：上述数字为内部基线，需要在 Phase 0 实际编译多个 demo 后校准。每次校准结果回写到本表 `notes` 列。

---

## 维护清单（每次 SDK 升级必走）

- [ ] 跑一遍 `monkeyc --device <each>` 验证编译通过
- [ ] 更新 `min_sdk` 列
- [ ] 在 `developer.garmin.com` 比对每台设备的 capability 是否变更
- [ ] 用 demo 表盘实测内存占用，更新预算建议表
- [ ] 提 PR，由 Founder review

---

**版本**：0.1.0
**最后更新**：2026-04-26
**下一次必须更新**：Garmin SDK 7.5 发布、或新设备发布（fenix 8 等）
