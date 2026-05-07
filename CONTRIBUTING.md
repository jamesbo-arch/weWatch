# Contributing to weWatch

> 本文档面向人类开发者**和** AI Subagent。后者读取本文档作为协作规范的一部分。

---

## 1. 开发环境

```bash
git clone <repo>
cd weWatch
nvm use                       # or: fnm use
corepack enable               # 启用 pnpm
cp .env.example .env.local    # 填入你的 API key
docker compose up -d          # 起 PG / Redis / Meili
pnpm install
pnpm bootstrap
pnpm dev
```

## 2. 分支策略

- `main` 受保护：必须 PR + 至少 1 人 review + CI 全绿才能合并
- 分支命名：
  - 人类：`<author>/<short-description>`，例：`james/designer-kyc-flow`
  - Agent：`agent/<agent-name>/<task-id>`，例：`agent/backend/be-2026-04-001`

## 3. 提交信息（Conventional Commits）

```
<type>(<scope>): <subject>

<body>

<footer>
```

`type`：`feat | fix | docs | style | refactor | perf | test | build | ci | chore`
`scope`：`api | web | mobile | ir | garmin | ai | infra | docs | agents/<name>`

例：

```
feat(api): add POST /designers/kyc/start endpoint

Implements PRD-042 step 1. Stripe Connect Express account creation with
HMAC idempotency. Migration adds designer_kyc_sessions table.

Refs: prds/phase-1/prd-042-designer-kyc.md
DoD-AC-1: ✅ verified
```

## 4. PR 流程

1. 写代码 + 测试 + 文档 → 自检 (`pnpm lint && pnpm typecheck && pnpm test`)
2. 开 PR，按 `.github/PULL_REQUEST_TEMPLATE.md` 填写
3. CI 必须全绿
4. 至少 1 人 review（关键模块需对应 CODEOWNERS）
5. squash merge

## 5. AI Agent 协作准则

每个 Agent 必须：

1. **从知识库读起**——`agents/<self>/SYSTEM_PROMPT.md` + 指定的支援文档
2. **遵守工具白名单**——不调用未授权工具，不绕过 PR 流程
3. **每个 task 都有可验证的 DoD**——含糊任务先问 PM Agent，不要"凭感觉"
4. **失败要响亮**——遇到无法解决的问题按各 agent 的"升级路径"上报
5. **沉淀经验**——每个新坑必须更新对应的 `ERROR_PLAYBOOK.md`
6. **诚实自评**——不夸大完成度，不假装看过没看过的文档

人类与 Agent 的 PR 走相同流程；Agent PR 由 QA Agent 与对应模块 owner 联合 review。

## 6. 修改 IR Schema 的特殊流程

`packages/ir-schema/` 是 Backend / Garmin SDK / Frontend / AI Pipeline 四个 Agent 共享的合同。
任何修改：

1. 同步修改 `agents/garmin-sdk-agent/IR_SCHEMA.md`（spec 文档）
2. 同步更新 `packages/ir-schema/CHANGELOG.md`
3. 评估是否需要 IR 版本号 bump（破坏性 → major；新增字段 → minor）
4. PR 必须 cc Backend + Garmin SDK 两方

## 7. 修改 PRINCIPLES 的特殊流程

见 `agents/pm-agent/PRODUCT_PRINCIPLES.md` 末尾"修改流程"。简言之：
- 创始人提议 → 文档化讨论 → 24h 冷静期 → 签字生效
- 不允许"顺便加上"

## 8. 安全

- 永不 commit `.env*`、私钥、Garmin developer key
- 发现潜在漏洞 → 私下报给 founder（不要在 issue 公开）
- 详见 `SECURITY.md`

## 9. 风格约束

- TypeScript：`tsconfig.base.json` 严格模式开
- ESLint + Prettier 在 PR 自动检查
- 命名：`camelCase` 变量 / `PascalCase` 类型 / `snake_case` DB 列
- 注释：业务复杂处必须中英任一注释

## 10. 文档作为代码

- `agents/*` 与 `docs/*` 与代码同 PR 改
- 任何"行为改变"必须同步更新文档
- 知识库文档头必须含 `version` 与 `last_updated`
