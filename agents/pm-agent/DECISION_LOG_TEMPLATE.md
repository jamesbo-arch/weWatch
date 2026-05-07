# Decision Log · 使用指南

> DECISION_LOG 不是"会议纪要"，是"半年后你看得懂为什么"的产物。
>
> **存放位置**：`decisions/decision-YYYY-MM-NN-<slug>.md`
> **模板**：`agents/pm-agent/templates/decision_record.md`
> **特殊模板**（KILL 一个功能）：`agents/pm-agent/templates/feature_kill_decision.md`

---

## 何时必须记录

任何满足以下任一项的决策：

- 影响 ≥ 1 个 PRD 的范围
- 修改路线图（NOW / NEXT / LATER）
- 修改产品原则
- 涉及 ≥ $500/月的支出
- 涉及合规、隐私、安全
- 反转过往决策（必须 link 旧决策）
- KILL 一个 backlog 中的功能（>= P2）

## 何时可以不记录

- 单纯的工程实现细节（代码层 ADR 写在 `/docs/adr/` 不在这里）
- 每日操作（task 系统已记录）
- 文案 / UI 微调

## 必须字段

见 `templates/decision_record.md` 头部 yaml。

特别强调：
- **Reversibility**：必须诚实评估反悔成本
- **Alternatives Considered**：至少 2 个，且必须有 "do nothing"
- **Consequences**：必须含负面后果，没有负面后果说明你没诚实

## 索引维护

PM Agent 在 `decisions/INDEX.md` 维护按主题分类的索引：

```markdown
# Decision Log Index

## 商业模式
- [decision-2026-04-01](decision-2026-04-01-stripe-vs-lemonsqueezy.md): 支付收单选 Stripe Connect

## 技术架构
- ...

## 产品范围
- ...

## 组织 / Agent 团队
- ...
```

每个 decision 必须 link 到至少一个主题。

## Review 节奏

- 每月 ritual: 浏览本月所有 decisions，看是否有需要 supersede 的
- 每季度: 检查 reversibility 高的决策是否被验证（对的就 confirm，错的就 supersede）

---

**版本**：0.1.0
**最后更新**：2026-04-26
