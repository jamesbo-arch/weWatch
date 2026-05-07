# 每周节奏 · v0.1.0

> PM Agent 与创始人之间的固定节奏。错过节奏 → 整个 Agent 团队会失去校准。
>
> **设计目标**：让创始人每天 < 15 分钟在管理上，每周 < 90 分钟在 ritual 上。

---

## 日例行（每个工作日 ≤ 15 分钟）

### 早 08:30 · Daily Brief（PM Agent 推送）

格式（≤ 200 字）：

```markdown
# Daily Brief · 2026-04-NN

## 昨日完成
- ✅ <task> by <agent>
- ✅ ...

## 今日 Top 3 推荐关注
1. <事项 + 你需要做的决定 / 5min 操作>
2. ...
3. ...

## 风险 / 异常
- <如有>

## 你今日唯一必做（如有）
- <若需要 reset，给一句话>
```

创始人在早晨 5 分钟扫一遍。无异常 → 不必回复。有异常 → 用 1 行回复批示。

### 全天 · 异步沟通

PM Agent 与其他 Agent 用 Task 系统沟通。**只有 P0 才允许打断创始人**。

### 晚 18:00 · End-of-Day Capture（创始人主动）

创始人花 5 分钟把今天产生的任何"灵感 / 听到的用户反馈 / 看到的竞品消息" 倾倒给 PM Agent。
PM Agent 立即按 `[type=ideation]` 流程处理（不要求当晚 KILL/ADD，第二天 Daily Brief 给建议）。

---

## 周例行（周一上午 60 分钟）

### Step 1: PM 发送周报（周一 08:00）

模板（在 `templates/weekly_report.md`）：

```markdown
# Week NN Report · 2026-MM-DD

## 北极星 + 输入指标
| 指标 | 本周 | 上周 | 变化 | 目标 | 状态 |
|---|---|---|---|---|---|
| NSM (MPI) | ... | ... | ... | ... | 🟢/🟡/🔴 |
| ...

## 已完成（按 PRD）
- ✅ PRD-XXX <标题> · <一句话结果>
- ✅ ...

## 进行中
- 🟡 PRD-XXX · 进度 X%, 下周完成 / 风险

## 未启动 / 阻塞
- ⚪ PRD-XXX · 等待 X

## 用户 / 设计师反馈摘要
- <≤ 5 条最值得关注的>

## 实验状态
- exp-XX: 进行中, day X/N, 当前 lift +X%
- exp-XX: 已结束, 决策: ship/kill/iterate

## DECISION_LOG 本周新增
- decision-XX: <一句话>

## PM 给创始人的 3 个建议
1. ...
2. ...
3. ...

## Open Questions（需要你这周决定）
- Q1: ...
- Q2: ...
```

### Step 2: 周一 09:30 创始人 30-min 回应

创始人对周报逐条批示：

- 指标偏离 → 是否 spawn investigation task
- 完成项 → confirm，或要求复盘
- 进行中 → 是否调整优先级
- 反馈 → 哪些转 backlog，哪些 KILL
- Open Questions → 直接回答

### Step 3: 周一下午 PM 输出 Sprint Plan

基于创始人批示，PM Agent 走 `[type=planning]` 流程，输出本周 sprint plan。
创始人 5 分钟内审批（否决任一 task → PM 重排）。

### Step 4: 周五 17:00 PM 自检

PM Agent 自评本周表现（参照 SYSTEM_PROMPT §性能指标）：

- 完成率 vs. 计划
- 创始人无效打扰次数
- 决策溯源完整性
- 哪条原则被挑战 / 重申

存档到 `reports/pm-self-eval-week-NN.md`。

---

## 月例行（每月第一周一 90 分钟）

### Step 1: 月报（替代当周周报）

涵盖：
- 完整漏斗 + cohort 分析
- 上月所有 PRD review（哪些达 DoD，哪些没达）
- 设计师 / 用户 NPS（季度才采集，月内插补）
- 实验回顾（上线了什么，下来了什么）
- 财务摘要（MRR、烧钱、Runway）
- Roadmap 调整建议

### Step 2: PRINCIPLES Health Check

PM Agent 询问：本月是否有原则被挑战 / 被违反 / 觉得过时？
若有 → 提议修订（走 `PRODUCT_PRINCIPLES.md` 修改流程）

### Step 3: Backlog 大扫除

逐项 review backlog 中超 30 天未启动的 item：
- 仍重要 → 重新评分
- 不重要 → KILL（用 `templates/feature_kill_decision.md` 归档）

目标：backlog item 数稳定在 30-50（过多说明聚焦不够）。

### Step 4: 跨 Agent 健康检查

向每个 Agent 询问：
- 上月遇到的最大障碍
- ERROR_PLAYBOOK / 知识库需要补充什么
- 与 PM Agent 协作的不顺之处

汇总后 → PM 给创始人一份 1 页"Agent 团队健康度"报告。

---

## 季度例行（每季度末 半天）

### Strategy Sync

- 主战略文档（`weWatch_战略与研发蓝图_v1.md`）整体 review
- Phase 推进进度评估
- 是否需要变更 phase 顺序、KPI、预算
- 输出 `weWatch_战略与研发蓝图_v_N+1.md`（递增版本）

---

## 当 ritual 失败时

ritual 失败 = 没在规定时间产出 / 创始人持续不回应 / 节奏被业务 emergency 打乱。

PM Agent 反应：
1. 立即 surface 给创始人："本周 ritual 未按时执行，原因是什么？"
2. 不要"补一份不完整的"，要找到根因
3. 若连续 2 周失败 → P1 升级，必须创始人当面（chat）确认是否需要修改 ritual 设计

---

**版本**：0.1.0
**最后更新**：2026-04-26
