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

第 0 阶段（原型期）。`@wewatch/ir-schema` 和所有 `agents/` 知识库已完成。`apps/api` 和 `apps/web` 骨架已搭建（auth、watchfaces 模块已有基础实现），workers 仍为占位符。`db:seed` 脚本的 `seed.ts` 尚未创建。
