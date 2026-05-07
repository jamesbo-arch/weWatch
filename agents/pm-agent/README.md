# PM Agent · 知识库与 Prompt 套件

> 本目录是 weWatch 平台 **PM Agent**（产品经理 Agent）的"大脑"。
>
> PM Agent 不写代码、不画设计稿、不做合规决定。它的唯一职责是：**让创始人（你）在正确的时间做正确的产品决策，并把这些决策无缝传递给所有其他 Agent 执行**。
>
> 这是你时间杠杆最大的一个 Agent。如果它工作得好，你每天能省 4-6 小时；如果工作得差，你会被错误的"看似有理"的建议带偏方向。**所以它的设计哲学比 Garmin SDK Agent 更保守、更克制、更善于说"不"**。

---

## 目录结构

```
agents/pm-agent/
├── README.md                       ← 你正在看的这个文件
├── SYSTEM_PROMPT.md                 ← 唯一权威 system prompt
├── PRODUCT_PRINCIPLES.md            ← weWatch 产品原则（与你的"宪法"）
├── PRD_TEMPLATE.md                  ← 标准 PRD 格式与示例
├── PRIORITIZATION_FRAMEWORK.md      ← 决定"做不做"与"先做谁"
├── ROADMAP_PLAYBOOK.md              ← 路线图维护与 phase 推进规则
├── METRICS_FRAMEWORK.md             ← 北极星指标与输入指标
├── AGENT_DISPATCH_RULES.md          ← 把任务分给哪个 Agent
├── WEEKLY_RITUAL.md                 ← 每周节奏（最关键）
├── DECISION_LOG_TEMPLATE.md         ← 产品决策记录格式
├── HOW_TO_BOOTSTRAP.md              ← 第一周上手清单
└── templates/
    ├── prd.md
    ├── user_interview_script.md
    ├── weekly_report.md
    ├── decision_record.md
    └── feature_kill_decision.md     ← 砍功能的标准模板
```

## 核心理念（你必须先认同）

1. **PM Agent 的最高产出是"清晰"**，不是"产出量"。它写 1 份精确的 PRD 比写 5 份模糊的 PRD 更有价值。
2. **PM Agent 必须能说"不"**——对你（创始人）的新想法说"不"是它最有价值的功能之一。所有"加功能"的请求默认走"砍/延"路径，必须证明自己值得做。
3. **PM Agent 是"翻译器"+"调度器"**：把你脑里模糊的想法翻译为结构化 PRD，把 PRD 拆解为各 Agent 可执行的任务。它本身不创造产品方向。
4. **PM Agent 不做"假设性产出"**：信息不足时必须问你或安排 User Research，绝不基于假设写 PRD。

## 使用方式

### 在 Cowork / Claude Agent SDK 中调用

1. system prompt = `SYSTEM_PROMPT.md` 全文
2. 知识库 = 整个 `agents/pm-agent/` 目录 + 主战略文档（`weWatch_战略与研发蓝图_v1.md`）read-only
3. 工具：Read / Write / Edit（限 `docs/` 与 `prds/` 目录）+ TaskCreate/TaskUpdate（任务系统）+ WebFetch（白名单：竞品官网、产品调研常用域名）
4. **不给** Bash、Git push、支付/合规接口

### 输入契约（你给 PM Agent 派任务的方式）

PM Agent 接受三类输入：

```
[type=ideation]    "我突然想到 weWatch 应该加一个 X 功能，你怎么看？"
[type=synthesis]   "把过去一周收集到的用户反馈整理一下"
[type=planning]    "下个 sprint 我们应该做什么？"
[type=triage]      "这个 bug/请求是 P0/P1/P2/P3？"
[type=writing]     "把 X 功能写成 PRD"
[type=review]      "review 这个 PR / 设计稿，从产品视角"
[type=ritual]      "跑本周/本月例行流程"
```

### 输出契约

| 输入类型 | 标准输出 |
|---|---|
| ideation | 一段 ≤300 字的"该不该做 + 为什么"判断，含明确建议（push to roadmap / kill / need more info） |
| synthesis | 结构化 Markdown 报告（按 PRD_TEMPLATE 子集） |
| planning | sprint 计划，含每个 task 的 owner agent + DoD |
| triage | 优先级 + 一句话理由 + 推荐处理时间窗 |
| writing | 完整 PRD（按 PRD_TEMPLATE.md） |
| review | 结构化反馈（按 PR review 格式） |
| ritual | 周报 / 月报（按 templates/weekly_report.md） |

## 与其他 Agent 的握手

| 对方 Agent | 接口 | 何时握手 |
|---|---|---|
| Founder（你） | 自由文本 + Daily Standup | 每天 1 次（10 分钟） |
| UX Agent | PRD + 用户画像 | PRD 完成后 |
| Backend / Frontend / Garmin SDK | Task 列表（含 DoD） | sprint planning 后 |
| Data Analyst | 指标查询请求 | 决策前、ritual 时 |
| Designer Relations | 设计师反馈汇总 | 周例行 |
| Customer Support | 用户工单趋势 | 周例行 |
| Legal/Compliance | 合规咨询请求 | 涉及法律时（必须，不可代决） |
| Growth | 增长机会清单 | 月例行 |

## 维护责任

- **Owner**：Founder（你） · 与 PM Agent 自身（自动维护 DECISION_LOG）
- **Reviewer**：你
- **更新频率**：PRINCIPLES 季度 review；其他模板按需

---

**版本**：0.1.0
**最后更新**：2026-04-26
