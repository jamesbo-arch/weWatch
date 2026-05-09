# weWatch 产品路线图

> 最后更新：2026-05-09
>
> **当前分支**：`feat/license-mvp` — Phase 1 进行中

---

## 产品愿景

weWatch 是 Garmin 表盘的 **App Store**：用户一次购买，同一套 Monkey C 容器 App 动态渲染无限款表盘，无需多次安装。设计师通过 Web 编辑器或 AI 流水线创作表盘，平台负责编译、分发、变现。

```
设计师创作 → AI 生成 IR → SDK 编译 .prg → 市场上架
用户购买   → 设备激活   → 容器 App 拉取 Render Spec → 运行时渲染
```

---

## 阶段总览

| 阶段 | 名称 | 状态 | 核心交付 |
|------|------|------|---------|
| Phase 0 | 基础骨架 | ✅ 完成 | Monorepo、API/Web 框架、IR Schema、AI Agents |
| Phase 1 | 容器 App MVP | 🔄 进行中 | License 链路、Render Spec、动态渲染、背景图 |
| Phase 2 | 市场 MVP | ⏳ 待启动 | 支付、消费者页面、设计师工具、Build Worker |
| Phase 3 | AI 创作流水线 | ⏳ 待启动 | Prompt → IR → PRG 全自动、多设备矩阵 |
| Phase 4 | 生产就绪 | ⏳ 待启动 | 部署、CI/CD、监控、IQ Store 提交 |

---

## Phase 0 — 基础骨架 ✅

**目标**：建立可持续开发的工程底座。

### 已完成
- [x] pnpm + Turbo monorepo，工作区：`apps/` `packages/` `workers/` `agents/` `tools/`
- [x] `apps/api`：NestJS + PostgreSQL + Drizzle ORM，端口 3001，前缀 `/api/v1`
  - auth 模块（注册/登录，JWT httpOnly cookie，bcrypt cost=12）
  - watchfaces 模块（上传、列表、magic bytes 校验）
  - 限流：ThrottlerGuard 100 req/min/IP
- [x] `apps/web`：Next.js 15 + Tailwind CSS v4，端口 3000
  - 页面：首页、表盘列表、设计师上传、激活页
- [x] `packages/ir-schema`：Watch Face IR 的 Zod schema + TypeScript 类型 + 设备能力矩阵（30+ 款）
- [x] `packages/shared-utils`：ULID、货币格式化、异步重试
- [x] `agents/`：garmin-sdk-agent、backend-agent、ai-pipeline-agent、pm-agent 知识库
- [x] Docker Compose：PostgreSQL:5432、Redis:6379、Meilisearch:7700
- [x] GitHub Actions CI：lint + typecheck + test

---

## Phase 1 — 容器 App MVP 🔄

**目标**：验证"一个 App 二进制，动态渲染多款表盘"的完整技术链路。

**分支**：`feat/license-mvp`

### 已完成

#### 数据库
- [x] `watchfaces` 表新增 `render_spec JSONB` 列（migration `0003_add_render_spec.sql`）
- [x] 4 款演示表盘数据入库：

| ID | 名称 | 背景类型 |
|----|------|---------|
| `24669676-...` | Midnight Minimal / GALAXY | 代码渐变（深蓝紫） |
| `84dd4fc5-...` | Solar Flare | 代码渐变（橙红） |
| `a1b2c3d4-...` | Aurora Borealis | PNG 背景图（极光） |
| `b2c3d4e5-...` | Nebula Dream | PNG 背景图（星云） |

#### API — License 模块
- [x] `POST /api/v1/licenses/activate`：设备序列号 → HMAC-SHA256 → licenseKey + renderSpec
  - 新激活返回 201，重复激活返回 200（`isNew` 标志）
  - FK 违规（无效 watchfaceId）返回 400，不泄漏 500
- [x] `GET /api/v1/licenses/check`：验证 licenseKey 有效性
- [x] `licenses.service.spec.ts`：13 个测试用例全通过

#### Monkey C 容器 App（`tools/garmin-demo/`）
- [x] `LicenseDemoApp.mc`：WatchFace 主入口，管理 Background Service 生命周期
- [x] `LicenseServiceDelegate.mc`：Background Service（`(:background)` 注解），调用 HTTP API
- [x] `LicenseChecker.mc`：封装 activate/check HTTP 请求，缓存 renderSpec 到 `Application.Storage`
- [x] `LicenseDemoView.mc`：运行时 Render Spec 解析器，支持：
  - 元素类型：`arc` / `time` / `text` / `date` / `steps` / `heart` / `battery` / `gradient`
  - 背景图片：`bg_img` 字段 → 加载 PRG 内置 PNG（`aurora` / `nebula`）
  - 状态屏：Loading / Locked / Network Error
- [x] 背景图生成脚本：`tools/garmin-demo/gen-backgrounds.mjs`（Node.js 纯 stdlib，生成 416×416 PNG）
- [x] 已编译并在模拟器（fr265）验证的 PRG：
  - `LicenseDemo_Midnight.prg`（107KB）
  - `LicenseDemo_Solar.prg`（107KB）
  - `LicenseDemo_Aurora.prg`（445KB，含背景图）
  - `LicenseDemo_Nebula.prg`（445KB，含背景图）

### 待完成（Phase 1 收尾）

- [ ] **P1-T1**：`apps/api` 启动可靠性修复
  - 当前痛点：`--env-file=.env` 在 Windows 上静默失效，需手动 PowerShell 循环加载
  - 方案：在 `apps/api/src/main.ts` 顶部用 `dotenv.config()` 加载，或在 `package.json` dev 脚本中改用 `dotenv-cli`
  - 验收：`pnpm --filter api dev` 直接可用，无需手动设置环境变量

- [ ] **P1-T2**：`db:seed` 脚本
  - `apps/api/src/db/seed.ts`（CLAUDE.md 记录：此文件尚未创建）
  - 写入 4 款演示表盘 + 1 个演示设计师账号 + 对应 render_spec

- [ ] **P1-T3**：PR 合并与分支清理
  - `feat/license-mvp` → `master` 的 PR
  - 更新 CLAUDE.md 项目状态节为"Phase 1 完成"

- [ ] **P1-T4**：`.env.example` 文件（CLAUDE.md 记录：尚未创建）

---

## Phase 2 — 市场 MVP ⏳

**目标**：让真实用户能发现表盘、购买、激活，设计师能上架。

**预计周期**：6–8 周

### 2A — 支付与许可证（后端）
- [ ] Stripe 集成
  - `POST /api/v1/payments/checkout`：创建 Checkout Session
  - `POST /api/v1/payments/webhook`：Stripe 回调，验证签名，触发 `licenses.activate()`
  - DB：`orders` 表（id、userId、watchfaceId、stripeSessionId、status、paidAt）
- [ ] 价格层级：免费（price=0 直接激活）/ 付费（需先支付）
- [ ] License 与 Order 关联：`orders.licenseId` FK

### 2B — 消费者市场（前端）
- [ ] 表盘列表页（`/watchfaces`）：卡片网格、过滤（免费/付费/设备型号）、搜索（Meilisearch）
- [ ] 表盘详情页（`/watchfaces/[id]`）：预览图、描述、价格、购买按钮
- [ ] 购买流程：Stripe Checkout → 成功回调 → 激活页（`/activate?watchfaceId=xxx`）
- [ ] 用户中心（`/account`）：已购表盘列表、激活二维码/口令
- [ ] 国际化（next-intl）：zh-CN、en-US

### 2C — 设计师工具
- [ ] 设计师注册/认证流程（`designers` 表已有，需审核逻辑）
- [ ] 表盘上传页（`/designer/upload`）完善：
  - 当前只有文件上传骨架，需补全：预览图上传、价格设置、设备目标选择
  - Render Spec 可视化预览（Konva.js，复用 Web 编辑器组件）
- [ ] 设计师收益面板（`/designer/earnings`）：销量、收益、提现申请

### 2D — Build Worker 实现
- [ ] `workers/build-worker/src/index.ts`：当前为 TODO 占位符
  - 轮询 `watchfaces` 表中 `status='pending_build'` 的记录
  - 启动 Garmin SDK Docker 容器：`docker run --rm -v ... garmin-sdk monkeyc ...`
  - 编译 IR JSON → Monkey C → `.prg` 文件
  - 上传 `.prg` 到 Cloudflare R2
  - 更新 `watchfaces.prg_url`、`status='published'`
- [ ] Garmin SDK Docker 镜像完善（`infra/docker/Dockerfile.garmin-sdk`）
- [ ] 编译任务队列（Redis BullMQ）

---

## Phase 3 — AI 创作流水线 ⏳

**目标**：用户用自然语言描述表盘，平台自动生成并上架。

**预计周期**：4–6 周（依赖 Phase 2 Build Worker）

### 3A — AI Pipeline Worker
- [ ] `workers/ai-pipeline/src/index.ts`：当前为 TODO 占位符
  - 接收 prompt（文字描述）
  - 调用 Claude API：prompt → Watch Face IR JSON（遵循 `@wewatch/ir-schema`）
  - IR 校验（设备能力矩阵）
  - 生成 Render Spec（轻量版，供容器 App 使用）
  - 可选：Replicate/DALL-E 生成背景图（存 R2，写入 `bg_img_url`）
  - 提交给 Build Worker 编译

### 3B — Render Spec v2
- [ ] `bg_img_url`：支持远程 URL 背景图（PRG 编译期下载并打包）
- [ ] 新元素类型：`ring`（进度环）、`icon`（内置图标）、`weather`（天气）
- [ ] Render Spec 版本升级机制（`v` 字段）

### 3C — 多设备矩阵编译
- [ ] Build Worker 一次提交，为多个目标设备（fr265、fr965、fenix7、epix2 等）并行编译
- [ ] 每款设备的 PRG 独立存储（`watchface_builds` 表）
- [ ] 容器 App 按设备型号拉取对应 PRG

### 3D — 内容审核
- [ ] AI Pipeline 生成后自动审核（Claude content safety）
- [ ] 人工审核队列（管理后台）

---

## Phase 4 — 生产就绪 ⏳

**目标**：可靠上线，可被真实用户使用。

**预计周期**：3–4 周

### 4A — 部署
- [ ] API 部署：Fly.io（`fly.toml`，多区域）
- [ ] Web 部署：Vercel（Next.js 零配置）
- [ ] 数据库：Fly Postgres 或 Neon（带连接池）
- [ ] 文件存储：Cloudflare R2（`BUCKET/prg/`、`BUCKET/thumbnails/`、`BUCKET/backgrounds/`）
- [ ] Redis：Upstash（Serverless，用于 BullMQ 和限流）

### 4B — CI/CD
- [ ] GitHub Actions 补全：
  - `ci.yml`：lint + typecheck + test（已有基础版本）
  - `deploy-api.yml`：main 分支推送 → fly deploy
  - `deploy-web.yml`：main 分支推送 → vercel deploy
  - `build-worker.yml`：构建 Garmin SDK Docker 镜像并推送 GHCR
- [ ] 环境分离：dev / staging / production

### 4C — 监控与可观测性
- [ ] Sentry：API 错误追踪、性能监控
- [ ] PostHog：用户行为分析（购买漏斗、激活率）
- [ ] Grafana + Prometheus（可选，Build Worker 编译耗时）
- [ ] 健康检查端点：`GET /api/v1/health`

### 4D — IQ Store 提交
- [ ] 容器 App 正式发布（weWatch Player）
  - 支持设备列表（至少覆盖 fr265、fr965、fenix7s）
  - App Store 截图和描述（多语言）
- [ ] Developer Key 管理（production key 与 dev key 分离）
- [ ] IQ Store 审核通过流程文档

### 4E — 安全加固
- [ ] `LICENSE_HMAC_SECRET` 轮换机制
- [ ] API Rate Limiting 细化（激活接口单独限流：10 次/设备/天）
- [ ] GDPR/CCPA 合规：数据删除端点、隐私政策页
- [ ] 依赖漏洞扫描（`pnpm audit` + Dependabot）

---

## 技术债务跟踪

| 项目 | 位置 | 优先级 | 说明 |
|------|------|--------|------|
| `db:seed` 未实现 | `apps/api/src/db/seed.ts` | P1 | CLAUDE.md 记录 |
| `.env.example` 缺失 | 项目根 | P1 | 新成员无法快速上手 |
| workers 仍为占位符 | `workers/*/src/index.ts` | P2 | build-worker、ai-pipeline |
| `packages/api-types` 未生成 OpenAPI | `packages/api-types` | P2 | 计划 OpenAPI → TypeScript 类型 |
| Meilisearch 搜索未接入 API | `apps/api` | P2 | 容器已运行但无索引逻辑 |
| Web 页面多为骨架 | `apps/web/src/app/` | P2 | 购买流程、用户中心未实现 |
| Garmin SDK 禁止在 Docker 外编译 | `CLAUDE.md` | P2 | 规则已存在，build-worker 需遵守 |

---

## 架构决策记录（ADR）

### ADR-001：容器 App 而非多个独立 App
**决策**：一个 `weWatch Player` PRG 通过 Render Spec 渲染所有表盘，而非每款表盘独立编译发布。
**原因**：IQ Store 审核周期长（数周）；容器 App 一次审核，内容通过 API 更新，无审核延迟。
**代价**：PRG 体积较大（含背景图时 ~445KB）；新元素类型需重编译 PRG。

### ADR-002：Render Spec 与 Watch Face IR 分离
**决策**：维护两套描述格式：完整 IR（`@wewatch/ir-schema`）用于编译，轻量 Render Spec（JSONB）用于运行时渲染。
**原因**：完整 IR 面向 Garmin SDK 编译器，字段复杂；Render Spec 面向 Monkey C 运行时，需控制在 2KB 以内。
**代价**：AI pipeline 需同时输出两套格式。

### ADR-003：背景图打包进 PRG 而非运行时下载
**决策**：PNG 背景图在编译期通过 Garmin drawable 资源系统打包进 PRG，Render Spec 用 `bg_img` 字段选择。
**原因**：Garmin WatchFace 前台禁用 `Communications`，Background Service 下载的 `BitmapResource` 不属于 `PersistableType`，无法传递给前台。
**代价**：新背景图需重新编译推送 PRG；PRG 体积因图片增大（每张约 170KB 编译后）。

### ADR-004：License 用 HMAC 而非服务端验证
**决策**：`licenseKey = HMAC-SHA256(secret, "${deviceSerial}:${watchfaceId}")`，设备本地可验证。
**原因**：手表可能离线；本地验证避免每次表盘刷新都需要网络请求。
**代价**：secret 泄漏则所有 licenseKey 可被伪造；需定期轮换 `LICENSE_HMAC_SECRET`。
