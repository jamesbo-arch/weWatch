# weWatch · AI Subagents 操作指南

> **读者**：创始人（James）
> **目的**：用 AI Agent 团队替代 10 人开发团队，以单人 + AI 完成 MVP
> **版本**：v1.0 · 2026-05-07

---

## 一、架构：你的 AI 团队是怎么工作的

### 两层模型

```
你（创始人）
    │  给高层目标、审批关键决策
    ▼
【主会话 · 编排层】← 你在 Claude Code 里直接对话的窗口
    │  负责召唤子 Agent、传递上下文、汇总结果
    │
    ├── pm-agent       规划 → PRD → 任务清单
    ├── ux-agent       信息架构 → 线框图 → 组件清单
    ├── backend-agent  NestJS API → Drizzle 迁移 → 单测
    ├── frontend-agent Next.js 页面 → React 组件 → E2E
    ├── qa-agent       测试审查 → Bug 复现 → 回归报告
    ├── security-agent 安全审计 → 合规检查
    ├── devops-agent   CI/CD → 部署 → 监控
    ├── garmin-sdk-agent  IR → Monkey C → .prg 编译
    └── ai-pipeline-agent Prompt → IR 生成
```

**关键原则**：
- pm-agent **负责规划**，不直接写代码
- 执行 agent（backend、frontend 等）**负责实现**，不做产品决策
- 你只做三件事：**给目标、审批计划、验收产出**

---

## 二、当前可用 Agent 一览

| Agent | 文件 | 触发时机 | 当前状态 |
|---|---|---|---|
| pm-agent | `.claude/agents/pm-agent.md` | 规划新功能、写 PRD、每周复盘 | ✅ 可用 |
| backend-agent | `.claude/agents/backend-agent.md` | 实现 API endpoint、数据库迁移 | ✅ 可用 |
| frontend-agent | `.claude/agents/frontend-agent.md` | Next.js 页面、React 组件 | ✅ 可用 |
| garmin-sdk-agent | `.claude/agents/garmin-sdk-agent.md` | IR → .prg 编译 | ✅ 可用 |
| ai-pipeline-agent | `.claude/agents/ai-pipeline-agent.md` | Prompt → IR 生成 | ✅ 可用（Phase 3）|
| qa-agent | `.claude/agents/qa-agent.md` | 每个 PR 合并前、发版回归 | ✅ 可用 |
| devops-agent | `.claude/agents/devops-agent.md` | 部署配置、CI 优化、监控 | ✅ 可用 |
| ux-agent | `.claude/agents/ux-agent.md` | 新功能开始前的 UX 骨架 | ✅ 可用 |
| security-agent | `.claude/agents/security-agent.md` | 涉及支付/KYC/PII 的 PR、每周扫描 | ✅ 可用 |

---

## 三、如何召唤 Agent

### 方式 A：在当前对话中点名（最常用）

直接在 Claude Code 对话里说明角色：

```
用 pm-agent 的视角处理这个请求：[你的目标]
```

```
召唤 backend-agent，完成以下任务：[任务描述]
```

Claude Code 会自动加载对应 `.claude/agents/<name>.md` 的系统提示。

### 方式 B：命令行开启专属会话

适合长时间专注在某个领域（如 PM 规划会议、Garmin 编译）：

```powershell
# PM 规划会话
claude --system-prompt agents/pm-agent/SYSTEM_PROMPT.md

# Garmin SDK 编译会话
claude --system-prompt agents/garmin-sdk-agent/SYSTEM_PROMPT.md
```

---

## 四、标准工作流：从目标到代码

### 流程图

```
你说出目标
    │
    ▼
pm-agent 评估（值不值得做？是否在 roadmap？）
    │ 输出：结论 + 任务清单（含 owner/依赖/DoD）
    ▼
你审批（5 分钟，重点看：scope 是否合理、优先级是否正确）
    │
    ▼
按依赖顺序派发执行 agent
    ├── 无依赖任务 → 并行执行（节省时间）
    └── 有依赖任务 → 顺序执行
    │
    ▼
qa-agent 审查每个 PR
    │
    ▼
security-agent 审查涉密 PR（支付/PII/鉴权）
    │
    ▼
你验收，pm-agent 更新进度
```

### 任务依赖顺序（标准 feature）

```
ux-agent（UX 骨架）
    ↓
backend-agent（API 设计 + 实现）  ←→  frontend-agent（页面实现，并行）
    ↓
qa-agent（测试审查）
    ↓
security-agent（如涉及支付/鉴权）
    ↓
devops-agent（部署到 staging）
    ↓
你验收
```

---

## 五、可直接复制的起手提示词

### 5.1 启动一个新功能

```
以 pm-agent 身份：

我想做这个功能：[一句话描述]

请：
1. 判断它是否在当前 Phase 的 roadmap 范围内
2. 如果是，输出任务清单（owner agent / 依赖关系 / 规模 S·M·L / DoD）
3. 如果不是，告诉我为什么，以及最近的合理时机
```

---

### 5.2 评估一个想法值不值得做

```
以 pm-agent 身份：

我有个想法：[描述]

对照 weWatch 战略文档和产品原则做 RICE 评估，
给出 ADD_TO_BACKLOG / NEEDS_RESEARCH / KILL_NICELY / DO_NOW 结论，
并说明理由。
```

---

### 5.3 派发具体任务给执行 agent

```
召唤 [backend-agent / frontend-agent / ...] 完成以下任务：

任务 ID：[be-001 / fe-001 / ...]
来源 PRD：[文件路径 或 内联描述]
输入：[前置任务的输出或约定]
期望输出：[具体交付物]
DoD：[可量化的验收标准]
约束：[截止时间、不能改动的部分等]
```

---

### 5.4 让 QA Agent 审查 PR

```
召唤 qa-agent 审查以下 PR：

PR 描述：[内容或链接]
对应 PRD 验收标准（AC）：[列出 AC 条目]
重点检查：[测试完整性 / 特定功能的边界 case]
```

---

### 5.5 每日早报（每天开始时发）

```
以 pm-agent 身份，给我今日 standup：

昨天完成：[可选，或让 pm-agent 从 git log 推断]
当前阻塞：[可选]

请输出：
1. 今日 top 3 任务（附 owner agent）
2. 有无需要我决策的问题
3. 有无风险需要关注
```

---

### 5.6 每周复盘（每周五发）

```
以 pm-agent 身份，做本周复盘：

本周完成：[列出]
未完成：[列出 + 原因]
本周遇到的意外：[列出]

请：
1. 更新 roadmap 进度（当前在 Phase X 的第几周）
2. 输出下周计划（含任务 + owner + 优先级）
3. 识别任何与原始战略的偏差
```

---

### 5.7 遇到跨 Agent 冲突时

```
以 pm-agent 身份仲裁以下冲突：

冲突描述：[backend-agent 说 X，garmin-sdk-agent 说 Y]
涉及的文件/模块：[IR Schema / API 设计 / ...]
双方理由：[各自的论据]

请给出裁决，并说明是否需要我（创始人）最终拍板。
```

---

## 六、每个阶段激活哪些 Agent

### Phase 0（当前）：骨架 + 验证

| Agent | 是否激活 | 主要工作 |
|---|---|---|
| pm-agent | ✅ | 写 Phase 1 PRD、规划冲刺 |
| backend-agent | ✅ | 搭 API 骨架、第一个 endpoint |
| frontend-agent | ✅ | 搭页面骨架、市场首页 |
| qa-agent | ✅ | 从第一个 PR 开始介入 |
| devops-agent | ✅ | CI 已跑通，准备 staging 部署 |
| ux-agent | ✅ | Phase 1 首个功能的 UX 骨架 |
| security-agent | ⏳ | 第一个支付接口出现时激活 |
| garmin-sdk-agent | ⏳ | IR Schema 确认后激活 |
| ai-pipeline-agent | ❌ | Phase 3 |

### Phase 1：MVP 上线

全部 9 个 agent 激活。security-agent 在 Stripe 集成时必须介入。

### Phase 3：AI 原生

ai-pipeline-agent 正式接入，与 garmin-sdk-agent 形成自动化管线。

---

## 七、常见问题

**Q：pm-agent 说"不做"，我怎么办？**

pm-agent 会引用具体原则说明原因。你有两个选项：
1. 接受：把想法放进 backlog，等合适时机
2. 挑战：告诉 pm-agent"我知道这个冲突，但我的理由是 X"，让它重新评估或升级给创始人（就是你自己）决策

**Q：agent 做出来的东西我不满意怎么办？**

直接反馈："这不对，原因是 X，重新做 Y 部分"。不要客气——agent 不会生气，但模糊的"做得更好"会让它不知道改哪里。

**Q：多个 agent 并行会不会互相冲突？**

可能会，特别是在共享资源（ir-schema、API contract）上。对策：
- 明确任务边界（backend 写 API，frontend 读 API types，不交叉写）
- 涉及 IR Schema 变更时，backend-agent 和 garmin-sdk-agent 必须都参与 review

**Q：agent 出错了怎么办？**

不要直接告诉 agent"你错了"。给出具体的错误证据（测试失败日志、不符合预期的行为），agent 会根据证据修复。

---

## 八、Agent 知识库文件位置

每个 agent 的完整知识库在 `agents/` 目录下，`.claude/agents/` 只是入口配置：

```
agents/
├── pm-agent/          ← SYSTEM_PROMPT.md + 产品原则 + PRD 模板等
├── backend-agent/     ← SYSTEM_PROMPT.md + 架构规范 + API 约定等
├── frontend-agent/    ← （知识库待补充）
├── garmin-sdk-agent/  ← SYSTEM_PROMPT.md + IR Schema + 设备矩阵等
├── ai-pipeline-agent/ ← SYSTEM_PROMPT.md + 管线架构 + Prompt 模板等
└── qa-agent/          ← （知识库待补充）
```

如果需要让 agent 遵守更细致的规范，在 `agents/<name>/` 目录下补充文档，并在对应的 `.claude/agents/<name>.md` 中引用。

---

*本文档由创始人 + pm-agent 协作维护。每个 Phase 启动前更新一次。*
