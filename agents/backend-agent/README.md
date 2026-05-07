# Backend Agent · 知识库与 Prompt 套件

> 本目录是 weWatch 平台 **Backend Agent** 的"大脑"。
>
> Backend Agent 拥有所有 server-side 业务逻辑：API、数据库、鉴权、支付、文件存储、内容审核 hooks、与第三方（Stripe / Garmin / 内容审核服务）的集成。
>
> 它是平台的"血液系统"——所有数据流经它。同时，它也是 IR Schema 的**源头权威**：Frontend / Garmin SDK / AI Pipeline 三个 Agent 都引用 `packages/ir-schema/` 作为共享契约。

---

## 目录结构

```
agents/backend-agent/
├── README.md                       ← 你正在看
├── SYSTEM_PROMPT.md                 ← 主 prompt
├── ARCHITECTURE.md                  ← 后端整体架构
├── API_CONVENTIONS.md               ← REST/RPC、版本、错误格式、命名
├── DB_CONVENTIONS.md                ← Drizzle schema 设计规则、迁移、索引
├── SECURITY_RULES.md                ← 鉴权、密钥、SQL 注入、CSRF、PII 处理
├── ERROR_HANDLING.md                ← 错误分类与对外暴露规则
├── TESTING_RULES.md                 ← 单测/契约测/E2E 规范
├── HOW_TO_BOOTSTRAP.md              ← 第一周上手
└── templates/
    ├── nestjs_module/               ← 标准 NestJS 模块骨架
    ├── drizzle_migration.ts
    ├── api_contract.md              ← API endpoint 设计模板
    └── service_test.ts
```

## 与其他 Agent 的握手

| 对方 Agent | 共享契约 / 接口 | 谁是 source of truth |
|---|---|---|
| Frontend Agent | OpenAPI / TS 类型（自动从 Zod 派生）| **Backend** |
| Garmin SDK Agent | `packages/ir-schema/` IR 定义 | **共同维护**（IR 变更需双方同意）|
| AI Pipeline Agent | IR Schema + 生成任务 API | **Backend** |
| QA Agent | API 契约测试夹具 | Backend |
| DevOps Agent | 部署描述（Dockerfile、env vars）| Backend |
| Security Agent | 依赖、CVE、密钥审计 | Backend 配合 |
| PM Agent | API 设计 review、新功能技术草案 | PM 出 PRD，Backend 出 tech sketch |

## 使用方式

### 在 Cowork / Claude Agent SDK 中调用

1. system prompt = `SYSTEM_PROMPT.md` 全文
2. 知识库挂载：本目录 + `packages/ir-schema/` + `agents/garmin-sdk-agent/IR_SCHEMA.md` + 主战略文档
3. 工具白名单：
   - `Read` / `Write` / `Edit`（限 `apps/api/`、`packages/`、`docs/api/`）
   - `Bash`（限 `pnpm`、`drizzle-kit`、`vitest`、`tsc`、`eslint`）
   - `Git`（PR；不可直接 push 主分支）
4. **不给**：生产环境数据库写权限、生产 secrets、Stripe live key、域名 DNS

### 输入契约

```json
{
  "task_id": "be-...",
  "type": "implement_endpoint | schema_migration | refactor | bug_fix | integration | review",
  "prd_ref": "prds/phase-1/prd-042-designer-kyc.md",
  "scope": "...",
  "constraints": { "deadline": "...", "no_breaking_changes": true }
}
```

### 输出契约

- 代码（NestJS module 或同 monorepo 包）
- Drizzle migration（如需）
- 单元 + 集成测试
- API doc（OpenAPI 自动生成 + 手写说明）
- PR + 变更说明

---

**版本**：0.1.0
**最后更新**：2026-04-26
