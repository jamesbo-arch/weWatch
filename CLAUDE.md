# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code（claude.ai/code）在此代码库中工作时提供指引。

## 项目概述

**weWatch** 是一个 Garmin 表盘市场平台。用户描述或上传表盘设计；AI 流水线生成中间表示（IR）；构建工作器通过 Garmin SDK 将其编译为 Monkey C；编译后的 `.prg` 文件通过市场分发。

## Monorepo 结构

pnpm + Turbo monorepo。工作区根目录：`apps/`、`packages/`、`workers/`、`agents/`、`tools/`。

- **`apps/api`** — NestJS REST API（PostgreSQL + Drizzle ORM），端口 3001，前缀 `/api/v1`
- **`apps/web`** — Next.js 前端（消费者市场 + 设计师工具 + 管理后台），端口 3000
- **`packages/ir-schema`** — **核心契约包**（Watch Face IR 的 Zod schemas + TypeScript 类型）
- **`packages/api-types`** — 错误码定义（计划生成 OpenAPI → TypeScript 类型）
- **`packages/shared-utils`** — ULID、货币、异步重试等工具函数
- **`workers/build-worker`** — 轮询任务，启动 Garmin SDK Docker 容器，上传 `.prg` 文件
- **`workers/ai-pipeline`** — LLM prompt → IR 生成 → 移交 build-worker
- **`agents/`** — AI 子智能体知识库（garmin-sdk、backend、pm、ai-pipeline）

## 核心命令

```bash
pnpm bootstrap          # 首次初始化：install + build + db migrate + seed
pnpm dev                # 启动所有应用和 workers（Turbo，并发数=12）
pnpm build              # 构建所有包
pnpm test               # 运行所有单元测试（Vitest）
pnpm test:watch         # 监听模式
pnpm lint               # ESLint 全量扫描
pnpm lint:fix           # ESLint 自动修复
pnpm typecheck          # tsc 全量检查
pnpm format             # Prettier（TS/JS/JSON/MD/YAML）
pnpm format:check       # Prettier 检查（不写入）

# 针对单个包（--filter 使用包名或目录短名均可）
pnpm --filter @wewatch/ir-schema test
pnpm --filter @wewatch/ir-schema build
pnpm --filter api dev               # 仅启动 API
pnpm --filter web dev               # 仅启动 Web

# 运行单个测试文件（Vitest）
pnpm --filter api exec vitest run src/auth/auth.service.spec.ts

# 数据库（apps/api）
pnpm --filter api db:migrate
pnpm --filter api db:seed           # 注意：seed.ts 尚未创建

# 智能体管理
pnpm agents:list                    # 列出所有 agents/
pnpm agents:check                   # 校验 agent 知识库 frontmatter

# 从 IR 生成 JSON Schema（供非 TS 消费者使用）
pnpm --filter @wewatch/ir-schema json-schema
```

## 本地开发服务（Docker Compose）

```bash
docker compose up -d                        # PostgreSQL:5432、Redis:6379、Meilisearch:7700
docker compose --profile garmin build       # 构建 Garmin SDK 镜像（可选，较重）
```

服务已预配置健康检查和持久化卷。Web 通过 `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`（浏览器端）和 `API_INTERNAL_URL=http://localhost:3001/api/v1`（服务端）访问 API。

## `@wewatch/ir-schema` — 核心契约

**所有包都依赖此包。** 在开发任何 app/worker 之前，请先阅读 `packages/ir-schema/src/schema.ts` 和 `packages/ir-schema/src/devices.ts`。

- `schema.ts` — Watch Face 中间表示的 Zod schemas
- `types.ts` — 从 Zod schemas 推导出的 TypeScript 类型
- `devices.ts` — 设备能力矩阵（30+ 款 Garmin 型号）
- `validators.ts` — 设备专属校验规则
- `IR_VERSION` 常量从 `index.ts` 导出
- 子路径导出：`@wewatch/ir-schema`、`@wewatch/ir-schema/devices`、`@wewatch/ir-schema/validators`

对 IR 的任何修改都必须评估对以下模块的影响：web 编辑器、API、build-worker、ai-pipeline 以及 garmin-sdk-agent 知识库。

## 导入规范

ESLint 禁止深层相对路径导入（`../../*`）。必须使用工作区别名：

```typescript
import { ... } from '@wewatch/ir-schema';
import { ... } from '@wewatch/api-types';
import { ... } from '@wewatch/shared-utils';
```

别名在 `tsconfig.base.json` 中定义，解析到各包的 `src/index.ts`。

## TypeScript 配置

基础配置（`tsconfig.base.json`）：`strict: true`、`noUncheckedIndexedAccess: true`、`noImplicitOverride: true`、`target: ES2022`、`moduleResolution: Bundler`。

- `apps/api` 继承基础配置，添加 `experimentalDecorators: true`（NestJS 装饰器），输出格式 CommonJS
- `apps/web` 继承基础配置，添加 `jsx: "preserve"`（Next.js）

## ESLint（Flat Config）

ESLint 9 flat config，配置文件为 `eslint.config.js`，无 `.eslintrc.json`。`@typescript-eslint/no-explicit-any` 为 error 级别。`no-console` 为 warning 级别（允许 `.warn` 和 `.error`）。

## 测试约定（Vitest）

- 测试文件命名：`**/*.spec.ts`
- API 测试使用 NestJS `Test.createTestingModule()`；通过 thenable 链模拟 Drizzle 查询构造器（每个查询方法返回自身以支持链式调用）
- 文件上传测试需验证 magic bytes（JPEG/PNG 文件头），不能只检查 MIME 类型

## API 安全约定

- JWT 通过 httpOnly cookie（名称：`ww_token`）传输，不放 Authorization header
- Bcrypt cost factor：12
- 限流：100 请求/分钟/IP（ThrottlerGuard 全局生效）
- 文件上传必须校验 magic bytes（SEC-05 规则），MIME 类型校验不够

## AI 智能体

`agents/` 目录包含 AI 子智能体的知识库，非人工文档。每个智能体有 `SYSTEM_PROMPT.md`、领域专属指南和代码/文档模板。智能体文件必须包含 `version: x.y.z` 和 `last_updated: YYYY-MM-DD` 的 frontmatter；变更需经 PR 审查。

- **`garmin-sdk-agent`** — IR → Monkey C 代码生成、Garmin SDK 编译/发布、设备性能预算
- **`backend-agent`** — NestJS 模块设计、Drizzle schema 规范、安全规则
- **`ai-pipeline-agent`** — Prompt → IR 流水线、LLM 模型选择、图像生成规则
- **`pm-agent`** — 产品策略、PRD 模板、优先级框架

## Garmin SDK

Garmin SDK 运行在 Docker 内（`infra/docker/Dockerfile.garmin-sdk`）。build-worker 通过 `docker run` 启动它。`connectiq-sdk-manager-windows/` 目录包含提取出的 SDK 管理器（Windows 版）。禁止在 Docker 外运行 SDK 编译。

## 环境变量

```
# 基础设施
DATABASE_URL            # PostgreSQL（Docker Compose 默认 localhost:5432）
REDIS_URL               # Redis（Docker Compose 默认 localhost:6379）
JWT_SECRET              # JWT 签名密钥
JWT_EXPIRES_IN          # JWT 有效期（如 7d）

# 文件存储（Cloudflare R2）
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_URL

# AI 流水线
ANTHROPIC_API_KEY
REPLICATE_API_TOKEN     # 或 OPENAI_API_KEY（图像生成二选一）

# Garmin 编译签名
GARMIN_DEVELOPER_KEY_PATH

# 支付（Phase 1）
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# 可观测性（可选）
SENTRY_DSN
POSTHOG_API_KEY
```

`.env.example` 尚未创建；初始化新环境时请参照上表创建 `.env.local`（已加入 `.gitignore`）。

## 项目状态

**Phase 1 进行中**（分支：`feat/license-mvp`）。完整路线图见 [ROADMAP.md](./ROADMAP.md)。

- **Phase 0**（完成）：monorepo 骨架、API/Web 框架、IR Schema、AI Agents 知识库
- **Phase 1**（进行中）：License MVP + 动态渲染已完成，待收尾：`db:seed`、`.env.example`、API 启动可靠性修复、PR 合并
- **Phase 2**（待启动）：Stripe 支付、消费者市场页面、设计师工具、Build Worker 实现
- `workers/build-worker` 和 `workers/ai-pipeline` 当前仍为 TODO 占位符
- `db:seed` 脚本（`apps/api/src/db/seed.ts`）尚未创建
- `.env.example` 尚未创建

## 编码行为准则（Karpathy Guidelines）

以下准则适用于所有编码任务，偏向谨慎而非速度。对于trivial任务可酌情判断。

### 1. 编码前先思考

实现前需做到：
- 明确陈述假设，不确定时主动提问。
- 存在多种解读时，列出并说明，不要默默选择。
- 若有更简单的方案，说出来，必要时推迟实现。
- 遇到不清晰的需求，停下来，说明困惑点，再询问。

### 2. 简单优先

- 不添加被要求之外的功能。
- 单次使用的代码不做抽象。
- 不加没被要求的"灵活性"或"可配置性"。
- 不为不可能发生的场景写错误处理。
- 若写了200行但50行够用，重写。

自问："资深工程师会觉得这过于复杂吗？"若是，简化。

### 3. 外科手术式修改

修改现有代码时：
- 不"顺手优化"相邻代码、注释或格式。
- 不重构没有问题的代码。
- 保持现有代码风格，即使你有不同偏好。
- 发现无关的死代码，提及即可，不要删除。

当你的修改产生孤立代码时：
- 删除**你的修改**导致不再使用的 import/变量/函数。
- 不删除原本就存在的死代码（除非被要求）。

判断标准：每一行改动都应能直接追溯到用户的需求。

### 4. 目标驱动执行

将任务转化为可验证的目标：
- "加验证" → "为非法输入写测试，再让测试通过"
- "修 bug" → "写能复现 bug 的测试，再让测试通过"
- "重构 X" → "确保重构前后测试都通过"

多步骤任务需列出简要计划，每步附上验证方式。
