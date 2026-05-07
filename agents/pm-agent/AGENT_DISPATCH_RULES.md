# Agent 调度规则 · v0.1.0

> 当 PM Agent 把一个 PRD 拆成 N 个 task 时，**派给谁** 由本文档决定。
>
> 错配会浪费 token、错误反复、信任损失。

---

## Agent 名册（与 weWatch_战略与研发蓝图_v1.md §6.2 对应）

| # | Agent | 主管业务 | 适合任务 | 不适合任务 |
|---|---|---|---|---|
| 1 | pm-agent | 产品决策、调度 | PRD、roadmap、triage | 写代码、做设计 |
| 2 | ux-agent | 信息架构、wireframe | 流程图、组件清单、可用性 review | 视觉精修、品牌设计 |
| 3 | backend-agent | API、DB、业务逻辑 | NestJS endpoint、Drizzle schema、迁移、单测 | 移动端、嵌入式 |
| 4 | frontend-agent | Web 前端 | Next.js 页面、React 组件、Storybook | 移动 RN、原生 |
| 5 | mobile-agent | iOS/Android | RN/Expo 页面、原生模块、BLE/USB 集成 | Web 前端 |
| 6 | garmin-sdk-agent | Garmin SDK | IR → Monkey C 编译、设备适配、模拟器验证 | 其他厂商 SDK |
| 7 | devops-agent | CI/CD、IaC、监控 | GitHub Actions、Terraform、告警配置 | 业务代码 |
| 8 | qa-agent | 测试与质量 | 单测/E2E/回归、bug 复现、真机验证调度 | 写业务代码 |
| 9 | security-agent | 安全审计 | 依赖扫描、Semgrep、合规自检 | 业务功能开发 |
| 10 | ai-pipeline-agent | AI 生成管线 | 图像→IR→构建、模型选型 | 通用 LLM 应用 |
| 11 | growth-agent | 增长 | SEO、内容、社媒、ASO | 付费广告投放（需创始人审批）|
| 12 | content-mod-agent | 内容审核 | IP/敏感/违规识别 | 文案创作 |
| 13 | designer-rel-agent | 设计师关系 | 入驻、答疑、激励 | 商务谈判 |
| 14 | support-agent | 客服 | 工单、退款、安装故障 | 退款政策制定 |
| 15 | legal-agent | 合规 | 法规追踪、ToS/Privacy 维护、税务问答 | 任何决策 |
| 16 | data-analyst-agent | 数据分析 | 看板、A/B 实验、洞察 | 制定指标定义 |
| 17 | localization-agent | 本地化 | 翻译、文化适配 | 文化调研 |
| 18 | user-research-agent | 用研 | 访谈脚本、问卷、定性分析 | 商业判断 |

---

## 调度规则

### 规则 1：单一职责

一个 task 派给一个 Agent。如果一个 task 看起来需要 2+ Agent 协作，说明它**应该被拆**。

例：
- ❌ "实现表盘搜索功能"（含前后端）
- ✅ "搜索 API 设计与实现" → backend-agent
- ✅ "搜索页面 UI 与交互" → frontend-agent
- ✅ "搜索 UX 流程与组件清单" → ux-agent（前置）

### 规则 2：明确的依赖链

派任务时必须用 TaskCreate 的 `addBlockedBy` 标注上游依赖。例：

```
ux task   ─┐
           ├─→ frontend task ─┐
backend task ──────────────────┴─→ qa task → ship
```

无依赖的 task 才允许 owner Agent 立即开工。

### 规则 3：DoD 必须在 task 描述中

每个 task 的 description 字段必须含：
- 输入是什么（链接 PRD / 前置 task 的输出）
- 期望输出是什么
- 完成的可验证标准（DoD）
- 失败的兜底处理

### 规则 4：容量约束（防止过载）

| Agent | 周容量（medium task 当量） |
|---|---|
| 技术执行类（backend/frontend/mobile/garmin/ai-pipeline） | 4 |
| 工程支持类（devops/qa/security） | 3 |
| 软技能类（content-mod/designer-rel/support） | 5 |
| 调研类（user-research/data-analyst） | 2 |
| 协调类（pm/ux/legal/localization）| 3 |

PM Agent 在 sprint planning 时不允许超派。超派一次 → DECISION_LOG 记录原因。

### 规则 5：升级路径

| 情况 | 升级 |
|---|---|
| Agent 无能力解决 | PM Agent 重新派 / 拆 task |
| Agent 之间冲突（e.g., backend 与 garmin-sdk 对 IR schema 不一致）| PM Agent 仲裁，必要时升级创始人 |
| Agent 反复失败 (≥ 3 次) | PM Agent + 创始人 review，可能改 prompt 或换 Agent |
| 涉及法律 / 商业决策 | 不允许 Agent 决定，PM 转创始人 |

### 规则 6：禁止"PM 自己做"

PM Agent 不得绕过执行 Agent 自己写代码 / 设计 / 文案。即使"看起来更快"也不行——这破坏了团队结构与可追溯性。

### 规则 7：信息上下文最小化

派给 Agent 的 task 描述应该**自包含**（含必要的 PRD 摘录、约束、上游产出链接），不要让下游 Agent 还得自己去翻 5 个文件。原则："Agent 不需要知道战略，只需要知道这一个 task"。

---

## 反模式（PM Agent 不得做）

- ❌ 把含糊任务派出去等"看着办"
- ❌ 同一 task 派给 2 个 Agent 期待"自然分工"
- ❌ 让 garmin-sdk-agent 写后端 API（哪怕只是几行）
- ❌ 让 legal-agent 给出"是否合规"的最终结论（仅可给"风险评估"）
- ❌ 跳过 user-research 直接据"用户应该想要"的猜测做 PRD
- ❌ 把 P0 紧急派给周容量已满的 Agent（应升级到创始人 reorder）

---

**版本**：0.1.0
**最后更新**：2026-04-26
