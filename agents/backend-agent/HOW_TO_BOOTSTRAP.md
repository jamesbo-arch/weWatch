# 如何在第一周把 Backend Agent 跑起来

> 本周目标：让 Backend Agent 能从 PRD → 出 PR（含 endpoint + 单测 + migration），真实合并、真实部署到 staging。

---

## Day 1：仓库与 monorepo 框架（半天）

1. 创建 monorepo（pnpm + Turborepo）

```
weWatch/
├── apps/
│   ├── api/              ← NestJS
│   └── web/              ← Next.js
├── packages/
│   ├── ir-schema/        ← 已有（详见后文）
│   ├── api-types/
│   └── shared-utils/
├── workers/
│   └── build-worker/
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── package.json
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'workers/*'
```

2. `apps/api` 跑 `nest new` 生成基础。
3. 装核心依赖：

```bash
cd apps/api
pnpm add @nestjs/{common,core,platform-express,swagger,config,jwt}
pnpm add zod drizzle-orm pg
pnpm add -D drizzle-kit vitest supertest @types/supertest
```

## Day 2：DB + 第一个 entity（半天）

1. 起本地 Postgres（docker）+ Redis（docker）
2. 在 `apps/api/src/infra/db/` 写 Drizzle config + 第一个 schema：

```ts
// schema/users.ts
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  locale: text('locale').notNull().default('en-US'),
  tier: text('tier').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
});
```

3. 跑迁移：`pnpm drizzle-kit generate && pnpm drizzle-kit migrate`

## Day 3：第一个 endpoint（end to end）

挑 `prd-001-mvp-marketplace.md`（创始人手工上传 .prg 表盘）作为开火 case，让 Backend Agent：

1. 读 PRD，写 `docs/api/watchfaces.md` 草案
2. 在 `packages/ir-schema/src/` 引入 `WatchFaceIRSchema`（已实现，见后续文件）
3. 创建 `watchfaces` module：

```
apps/api/src/modules/watchfaces/
├── watchfaces.module.ts
├── watchfaces.controller.ts
├── watchfaces.service.ts
├── watchfaces.repository.ts
├── dto/
│   ├── create-watchface.dto.ts   ← Zod 派生
│   └── watchface.response.ts
└── tests/
    ├── watchfaces.service.spec.ts
    └── watchfaces.controller.spec.ts
```

4. 实现 `POST /api/v1/watchfaces`（draft 创建，含 IR validation）
5. 写 6 个测试：3 单测 + 3 契约测试

## Day 4：把 Agent 接到 Claude Agent SDK

1. 在 Cowork / Claude Agent SDK 中创建 `backend-agent` subagent。
2. system prompt = `agents/backend-agent/SYSTEM_PROMPT.md` 全文。
3. 知识库挂载 + 工具白名单按 SYSTEM_PROMPT。
4. 派给 Agent 一个真实 task：

```json
{
  "task_id": "be-bootstrap-001",
  "type": "implement_endpoint",
  "prd_ref": "prds/phase-0/prd-001-mvp-marketplace.md",
  "scope": "GET /api/v1/watchfaces (list, paginated, filter by status)",
  "constraints": { "no_breaking_changes": true }
}
```

观察 Agent：
- 是否先看 PRD？
- 是否设计 contract 才动手？
- 是否写 Zod schema？
- 测试是否齐？
- 是否提 PR 而非直推？

如果有缺失，补 SYSTEM_PROMPT。

## Day 5：跑通 IR Schema 共享

1. 让 Backend Agent import `packages/ir-schema/`
2. 写一个 endpoint `POST /api/v1/_internal/validate-ir`，接受任意 IR JSON 返回校验结果
3. 让 Garmin SDK Agent 在 Day 6 调用它做"真伪测试"
4. 验证：当 IR 不合法时，两个 Agent 看到的错误结构一致

## Day 6：Webhook + 第一个集成

1. 让 Agent 实现 `POST /api/v1/webhooks/stripe`（mock 一个事件验签 + idempotency）
2. 用 Stripe CLI 本地触发测试事件
3. 验证幂等性（同事件两次只处理一次）

## Day 7：CI + Staging 部署

1. DevOps Agent 已 / 应已搭建 GitHub Actions
2. 跑全量测试 + 部署到 staging（Fly.io / Railway / Cloud Run）
3. 创始人在 staging 调通"创建 watchface → 校验 IR → 入库"
4. 写第一份 ADR：`/docs/adr/0001-monorepo-with-pnpm.md`

---

## 第一周末成功标准

- ✅ Backend Agent 完成至少 2 个真实 PR（合并）
- ✅ 单元 + 契约测试覆盖率 ≥ 80%
- ✅ IR Schema 在 Backend / Garmin SDK 两端表现一致
- ✅ Stripe webhook 验签 + 幂等通过
- ✅ Staging 环境跑通"创建 watchface"流程

---

## 你需要在第一周决定的事

- [ ] 选 Cloud Run / Fly.io / Railway（推荐 **Fly.io**：性价比 + 全球 region + 简单）
- [ ] PG 用 Neon（serverless）/ Supabase / 自建（推荐 **Neon** Phase 1，规模化后切自建）
- [ ] BullMQ 用 Upstash Redis 还是自建（推荐 **Upstash** 起步）
- [ ] 错误追踪用 Sentry SaaS 还是自托管（**SaaS** 起步，规模化后再说）

---

**版本**：0.1.0
**最后更新**：2026-04-26
