# weWatch

> 全球智能手表第三方表盘平台。Garmin 优先，逐步扩展至 Wear OS / 华为 / 小米 / Amazfit。
> 设计师驱动，AI 原生，跨厂商一次发布。

**Status**：Phase 0（构想期，调研与原型搭建中）

---

## 仓库结构

```
weWatch/
├── apps/                    应用进程
│   ├── api/                 NestJS 后端（单体起步，按需拆服务）
│   ├── web/                 Next.js 前端（消费者 + 设计师 + 后台三合一）
│   └── mobile/              React Native（Expo） · Phase 1 后期
├── packages/                可复用库（被 apps / workers 共享）
│   ├── ir-schema/           Watch Face IR Zod schema · ✅ 已实现
│   ├── api-types/           OpenAPI → TS 类型派生
│   └── shared-utils/        通用工具
├── workers/                 独立部署的后台进程
│   ├── build-worker/        派发 Garmin SDK 编译任务
│   ├── ai-pipeline/         消费 AI 生成请求，编排 LLM/image gen
│   ├── moderation-worker/   异步内容审核
│   └── payout-worker/       月度分账批处理
├── agents/                  AI Subagents 知识库（每个 agent 一个目录）
│   ├── pm-agent/            产品经理
│   ├── garmin-sdk-agent/    Garmin SDK 工程师
│   ├── backend-agent/       后端工程师
│   └── ai-pipeline-agent/   AI 生成管线编排
├── docs/                    跨模块文档
│   ├── adr/                 架构决策记录
│   ├── api/                 OpenAPI / endpoint 设计文档
│   └── strategy/            主战略文档
├── scripts/                 跨模块脚本
├── tools/                   开发工具（codegen, image post-process）
├── .github/workflows/       GitHub Actions CI / CD
├── docker-compose.yml       本地开发依赖（PG + Redis + Meili）
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── package.json
```

## 快速开始

### 前置条件

- Node 20.x（推荐用 fnm / nvm 管理；本仓库 `.nvmrc` 锁定版本）
- pnpm 9.x（`npm i -g pnpm`）
- Docker（本地数据库 + Garmin SDK 编译镜像）
- 一个 [Anthropic API key](https://console.anthropic.com)
- 可选：[Garmin Developer 账号](https://developer.garmin.com)（Phase 0 必须）

### 引导

```bash
git clone <this-repo>
cd weWatch
pnpm install                      # 拉所有依赖（pnpm workspace 自动 hoisting）
cp .env.example .env.local        # 填入你的 API keys
docker compose up -d              # 起 PG / Redis / Meilisearch
pnpm bootstrap                    # 跑全量 build + migrate + seed
```

### 常用命令

```bash
pnpm dev                  # 起所有 apps 与 workers（Turbo 并行）
pnpm test                 # 跑全量单测
pnpm lint                 # ESLint 全量
pnpm typecheck            # tsc 全量
pnpm build                # 构建产物
pnpm --filter @wewatch/ir-schema test    # 单包跑测试
pnpm --filter api dev                    # 仅起 API
```

### 调用 AI Subagents

每个 Agent 的 system prompt 与知识库都在 `agents/<name>/`。
配置 Cowork 或 Claude Agent SDK：

1. system prompt = `agents/<name>/SYSTEM_PROMPT.md` 全文
2. 知识库挂载该 agent 整个目录
3. 工具白名单按各自 SYSTEM_PROMPT 中说明
4. 第一周训练流程见各 agent 的 `HOW_TO_BOOTSTRAP.md`

## 战略与原则

- 战略主文档：[`docs/strategy/weWatch_战略与研发蓝图_v1.md`](./weWatch_战略与研发蓝图_v1.md)
- 产品原则（不可妥协）：[`agents/pm-agent/PRODUCT_PRINCIPLES.md`](./agents/pm-agent/PRODUCT_PRINCIPLES.md)
- 安全规则：[`agents/backend-agent/SECURITY_RULES.md`](./agents/backend-agent/SECURITY_RULES.md)
- IP 安全：[`agents/ai-pipeline-agent/IP_AND_SAFETY.md`](./agents/ai-pipeline-agent/IP_AND_SAFETY.md)

## 开发流程

- Trunk-based：所有改动走 PR → main
- 一个 PR 一个 commit（PR 内可多 commit，merge 时 squash）
- PR review 至少 1 人 + CI 全绿
- AI Agent 提交的 PR 也走相同流程（被 QA Agent 自动 review，关键变更升级人类）

## 维护

- 主战略文档每季度 review
- 各 Agent 知识库每月 review（详见各 `HOW_TO_BOOTSTRAP.md`）
- 架构决策走 `docs/adr/`

## License

Proprietary. © weWatch Pte. Ltd. 2026. All rights reserved.
（最终主体为新加坡公司，本文档撰写时仍在筹备）
