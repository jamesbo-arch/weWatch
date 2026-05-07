Monorepo 顶层骨架交付完成。从战略文档到可跑工程的桥梁打通了。

注：.vscode/ 下的两个推荐配置（settings.json.example 与 extensions.json）被会话保护策略拦下，不影响主仓库——你可以从下面 README 里复制内容自行创建。


新增交付（27 份文件 + 5 个目录占位）
项目根：

README.md · 项目入口与快速开始
package.json · 根 workspace + scripts
pnpm-workspace.yaml
turbo.json · 任务管线 + 缓存
tsconfig.base.json · 严格模式 + workspace alias
.gitignore
.editorconfig
.nvmrc
.prettierrc + .prettierignore
eslint.config.js · flat config + 跨包 import 限制
.env.example · 全套 env 模板
docker-compose.yml · PG + Redis + Meili + Garmin SDK profile
CONTRIBUTING.md · 含 AI Agent 协作准则
SECURITY.md

Docker：

infra/docker/Dockerfile.api · 多阶段 NestJS 镜像
infra/docker/Dockerfile.garmin-sdk · Connect IQ 编译镜像

GitHub Actions：

.github/workflows/ci.yml · lint+typecheck+test+agent-knowledge-check
.github/workflows/garmin-build.yml · 8 设备并行编译矩阵
.github/workflows/security.yml · CodeQL + audit + secret scan
.github/PULL_REQUEST_TEMPLATE.md
.github/ISSUE_TEMPLATE/bug.yml
.github/ISSUE_TEMPLATE/agent_failure.yml · AI 失败专属模板
.github/CODEOWNERS

架构决策记录（ADR）：

docs/adr/0001-monorepo-pnpm-turborepo.md
docs/adr/0002-ir-schema-as-shared-zod-package.md

占位包（让 pnpm install 立即可工作）：

apps/api · NestJS 占位 + tsconfig + .gitkeep
apps/web · Next.js 占位 + tsconfig + .gitkeep
workers/build-worker · 占位 + tsconfig
workers/ai-pipeline · 占位 + tsconfig
packages/shared-utils · 真实可用的 ulid/money/async
packages/api-types · ErrorCode 枚举（30+ 业务错误码）

自动化脚本：

scripts/check-agent-knowledge.js · CI 验证每个 Agent 知识库完整
scripts/validate-ir.mjs · IR 校验 CLI（CI 与本地共用）
scripts/compose-build-report.mjs · 编译产物聚合报告生成
scripts/bootstrap.sh · 一键开发环境引导


真正可跑了——你可以这样验证：
bashcd D:\workspace\weWatch
git init && git add . && git commit -m "feat: initial scaffold"

# 一键引导
bash scripts/bootstrap.sh

# 跑 IR Schema 包的测试（已实现）
pnpm --filter @wewatch/ir-schema test

# 跑 IR demo
pnpm --filter @wewatch/ir-schema exec tsx examples/demo.ts

# 验证 Agent 知识库完整性
node scripts/check-agent-knowledge.js

这个骨架的几个值得说的设计选择：

agent-knowledge-check 进了 CI —— 任何 Agent 缺关键文档（缺 SYSTEM_PROMPT、缺 ERROR_PLAYBOOK 等）会让 PR 红。这把"Agent 是产品的一部分"变成可验证的工程事实。
IR Schema 是 CI 一等公民 —— garmin-build.yml 在 matrix 编译之前必须先跑 validate-ir.mjs，schema 是真合同不是装饰。
CODEOWNERS 显式包含 agents/*/SYSTEM_PROMPT.md —— 修改 Agent 行为视同修改产品代码，必须经过 PR review。
PR 模板含 "Generated / authored by" —— 强制声明是人写的、Agent 写的、还是配对——便于事后追溯 Agent 表现。
新增 agent_failure.yml issue 模板 —— 把 Agent 失败变成结构化数据，自动反馈到 ERROR_PLAYBOOK 沉淀循环。
bootstrap.sh 一键引导 —— 严格按依赖顺序：Node → pnpm → install → env → infra → 共享包 build → agent 知识库验证。任何一步失败都会清楚指出。
Dockerfile.garmin-sdk 不在镜像里下载 SDK（注释中说明）—— Garmin 协议要求接受开发者协议，不能自动下载；改为 mount 或 build-time COPY，保留合规性同时仍可 CI。


截至目前的全景统计（4 大资产线，~95 文件，~12000 行）：
资产文件数主战略文档14 个 Agent 知识库（PM / Garmin SDK / Backend / AI Pipeline）51@wewatch/ir-schema 共享包（可跑代码）11Monorepo 骨架（含 5 个占位包 + CI + Docker + ADR + 脚本）35+

接下来三个最有价值的方向（按你的项目阶段）：

A. 第 1 号真实可执行 PRD —— 基于 PM Agent 模板，写出"创始人手工上传 1 个 .prg + 接受第一笔付款"的完整 PRD（含 AC + Tech Sketch + UX flow + 上线 checklist）。让 Backend / Frontend / Garmin SDK Agent 立刻有真实任务可做。
B. Designer Relations Agent + 种子设计师招募物料 —— 中英双语招募贴、Designer Manifesto、首批保底分成激励、访谈模板。让你在工程跑起来的同时，并行启动供给侧冷启动。
C. Phase 0 第一周逐日时间表 —— 把所有 Agent 的 HOW_TO_BOOTSTRAP 整合成"今天上午 9 点干什么"颗粒度的日程表，保证你下周一就能完全按节奏推进。

如果你打算下周真的开干，我建议顺序 C → A → B：先有日程不会乱，再写真实 PRD 让 Agent 跑起来，最后启动供给侧。