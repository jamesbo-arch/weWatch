# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此代码库中工作时提供指引。

## 项目概述

**weWatch** 是一个 Garmin 表盘市场平台。用户描述或上传表盘设计；AI 流水线生成中间表示（IR）；构建工作器通过 Garmin SDK 将其编译为 Monkey C；编译后的 `.prg` 文件通过市场分发。

## Monorepo 结构

pnpm + Turbo monorepo。工作区根目录：`apps/`、`packages/`、`workers/`、`agents/`、`tools/`。

- **`apps/api`** — NestJS REST API（PostgreSQL + Drizzle ORM）
- **`apps/web`** — Next.js 前端（消费者市场 + 设计师工具 + 管理后台）
- **`packages/ir-schema`** — **核心契约包**（Watch Face IR 的 Zod schemas + TypeScript 类型）
- **`packages/api-types`** — 自动生成的 OpenAPI → TypeScript 类型
- **`packages/shared-utils`** — 公共工具函数
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

# 针对单个包
pnpm --filter @wewatch/ir-schema test
pnpm --filter @wewatch/ir-schema build

# 数据库（在 apps/api 下执行）
pnpm --filter @wewatch/api db:migrate
pnpm --filter @wewatch/api db:seed

# 从 IR 生成 JSON Schema（供非 TS 消费者使用）
pnpm --filter @wewatch/ir-schema json-schema
```

## 本地开发服务（Docker Compose）

```bash
docker compose up -d                        # PostgreSQL 16、Redis 7、Meilisearch 1.10
docker compose --profile garmin build       # 构建 Garmin SDK 镜像（可选，较重）
```

服务已预配置健康检查和持久化卷。

## `@wewatch/ir-schema` — 核心契约

**所有包都依赖此包。** 在开发任何 app/worker 之前，请先阅读 `packages/ir-schema/src/schema.ts` 和 `packages/ir-schema/src/devices.ts`。

- `schema.ts` — Watch Face 中间表示的 Zod schemas
- `types.ts` — 从 Zod schemas 推导出的 TypeScript 类型
- `devices.ts` — 设备能力矩阵（30+ 款 Garmin 型号）
- `validators.ts` — 设备专属校验规则
- `IR_VERSION` 常量从 `index.ts` 导出

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

- `apps/api` 继承基础配置，并添加 `experimentalDecorators: true`（NestJS 装饰器）
- `apps/web` 继承基础配置，并添加 `jsx: "preserve"`（Next.js）

## ESLint（Flat Config）

ESLint 9 flat config，配置文件为 `eslint.config.js`，无 `.eslintrc.json`。`@typescript-eslint/no-explicit-any` 为 error 级别。`no-console` 为 warning 级别（允许 `.warn` 和 `.error`）。

## AI 智能体

`agents/` 目录包含 AI 子智能体的知识库，非人工文档。每个智能体有 `SYSTEM_PROMPT.md`、领域专属指南和代码/文档模板。智能体文件必须包含 `version: x.y.z` 和 `last_updated: YYYY-MM-DD` 的 frontmatter；变更需经 PR 审查。

- **`garmin-sdk-agent`** — IR → Monkey C 代码生成、Garmin SDK 编译/发布、设备性能预算
- **`backend-agent`** — NestJS 模块设计、Drizzle schema 规范、安全规则
- **`ai-pipeline-agent`** — Prompt → IR 流水线、LLM 模型选择、图像生成规则
- **`pm-agent`** — 产品策略、PRD 模板、优先级框架

## Garmin SDK

Garmin SDK 运行在 Docker 内（`infra/docker/Dockerfile.garmin-sdk`）。build-worker 通过 `docker run` 启动它。`connectiq-sdk-manager-windows/` 目录包含提取出的 SDK 管理器（Windows 版）。禁止在 Docker 外运行 SDK 编译。

## 环境变量

必需的环境变量（完整列表见 `turbo.json`）：
- `DATABASE_URL`、`REDIS_URL` — Docker Compose 本地服务
- `ANTHROPIC_API_KEY` — AI 流水线
- `REPLICATE_API_TOKEN` 或 `OPENAI_API_KEY` — 图像生成
- `GARMIN_DEVELOPER_KEY_PATH` — 用于签名编译后的表盘
- `STRIPE_*` — 市场支付
- `R2_*` — Cloudflare R2（编译后的 `.prg` 存储）

`.env.example` 尚未创建；在初始化新环境时请创建。

## 项目状态

第 0 阶段（原型期）。`@wewatch/ir-schema` 和所有 `agents/` 知识库已完成。应用和 workers 处于骨架阶段——`apps/api`（NestJS）和 `apps/web`（Next.js + Tailwind CSS v4）已完成脚手架搭建，可在此基础上实现功能。
