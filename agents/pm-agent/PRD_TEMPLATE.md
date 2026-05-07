# PRD 模板与撰写规范 · v0.1.0

> 所有 PRD 必须按本结构。生成时复制 `templates/prd.md` 起步，禁止删除任何章节（不适用时填 "N/A" + 一行说明）。
>
> 一份合格的 PRD 应让一个全新加入的工程师 30 分钟内能开工，且不需要二次询问关键决策。

---

## 强制章节（按顺序）

### 1. 元数据头

```yaml
---
prd_id: prd-2026-04-NN
title: <短标题，≤ 8 字>
phase: 0 | 1 | 2 | 3 | 4
status: draft | review | approved | rejected | shipped | obsolete
priority: P0 | P1 | P2 | P3
estimated_effort: S | M | L | XL    # S≤1w, M≤2w, L≤4w, XL>4w (单 Agent 折算)
target_ship_date: YYYY-MM-DD
owner: pm-agent
related_decisions: [decision-id, ...]
related_prds: [prd-id, ...]
---
```

### 2. 一句话陈述（One-liner）

≤ 30 字。如果写不下去，说明你还没想清楚——回到 ideation 阶段。

> 示例："让设计师在 30 秒内把同一个表盘适配到 30 个 Garmin 设备。"

### 3. 为什么做（Why now）

3 段：
- **用户痛点**（具体到哪类用户、什么场景）
- **战略契合**（对应主战略哪个 Phase 目标 + 哪条 PRINCIPLES）
- **机会窗口**（为什么"现在"做而不是"以后"）

### 4. 用户与场景（Personas & Scenarios）

至少描述 1 个主用户 + 1 个完整场景。场景按 user story 格式：

> 作为 [角色]，我想要 [行动]，以便 [结果]。

### 5. 核心需求 / 验收标准（Requirements & Acceptance Criteria）

按 Given/When/Then 格式，可量化。例如：

> Given 设计师在编辑器中完成一个表盘
> When 点击"一键适配"
> Then 系统在 ≤ 60 秒内生成 ≥ Top30 设备的 .prg 文件，全部通过模拟器渲染验证

**禁止**："系统应该用户友好"、"性能要好"等不可验证的语句。

### 6. 范围边界（In / Out of Scope）

明确列出**这次不做什么**。这章和"做什么"同等重要。

### 7. 关键决策与 Trade-offs

列出 ≥ 2 个本 PRD 中明显可走多条路的决策点，说明选择与理由。例如：

> Q: 编辑器的 IR 在前端还是后端校验？
> A: 双端都校验。前端用 Zod 给即时反馈；后端是真实 source of truth。
> 理由：前端只校验降低 API 负载和错误率；不可信任任何客户端输入。

### 8. 用户体验流（UX Flow）

1. 文字描述 step-by-step（≤ 10 步）
2. UX Agent 后续补充 wireframe
3. **关键边界状态必须列**：错误态、空态、加载态、降级态、离线态

### 9. 技术草案（Tech Sketch）

不写代码，但必须列：
- 涉及的服务 / 模块
- 新增 / 修改的数据表与关键字段
- 新增 API endpoint（method + path + 一行用途）
- 依赖的外部服务（含成本预估）
- 已知技术风险

> 这一节由 PM 起草框架，由对应技术 Agent 在 review 阶段补完。

### 10. 指标与实验设计（Metrics & Experiment）

- 北极星指标（NSM）影响假设
- 至少 1 个**可量化**的成功指标 + 阈值
- 是否需 A/B 实验？若是，设计骨架（人群、变体、最小样本量、时长）

### 11. 风险与降级方案

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| ... | H/M/L | H/M/L | ... |

### 12. 依赖与协作 Agent

| Agent | 职责 | DoD |
|---|---|---|
| Backend | API + DB | API e2e 测试通过 |
| Frontend | 编辑器 UI | E2E 测试 + Lighthouse > 90 |
| Garmin SDK | IR → .prg 编译 | 见 garmin-sdk-agent DoD |
| ... | ... | ... |

### 13. 上线 Checklist（Definition of Done）

- [ ] 所有验收标准通过
- [ ] 数据看板上线
- [ ] 文档（用户帮助 / 设计师指南）更新
- [ ] 多语言（zh-CN, en-US, ja, th）就绪
- [ ] 监控 + 告警规则配置
- [ ] 灰度计划（5% → 25% → 100%）写明
- [ ] 回滚方案 + 触发条件
- [ ] 成功 / 失败定义后 7 天 review 已排期

### 14. Open Questions / Next Actions

未决问题清单 + 谁负责回答 + deadline。

---

## 撰写常见错误

| 错误 | 修正 |
|---|---|
| "这个功能很重要" | 替换为具体可量化的影响估算 |
| "用户喜欢这个" | 替换为引用具体的用户访谈 / 数据 |
| 验收标准用形容词 | 全部转化为 Given/When/Then |
| 没有 Out of Scope | 必须写。即使写"无"也要明说 |
| 指标没有阈值 | "提升留存" → "D7 留存提升 ≥ 3pp（绝对值）" |
| 把"未来扩展"塞进 In Scope | 拆为另一份 PRD |

## PRD 长度建议

- S（小功能）：1-2 页
- M（标准功能）：2-4 页
- L（大模块）：4-8 页 + 拆子 PRD
- XL：拒绝。必须先拆为多个 L 或 M。

---

**版本**：0.1.0
**最后更新**：2026-04-26
