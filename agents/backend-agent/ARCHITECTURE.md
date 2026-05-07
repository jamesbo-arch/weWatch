# Backend Architecture · v0.1.0

> 描述 weWatch 后端的服务划分、依赖关系、数据流。本文档与代码同步——任何架构变更先更新本文。

---

## 1. 模块全景

```
apps/api/                        ← 单体 NestJS（Phase 1-2 优先单体，避免过早微服务化）
├── src/
│   ├── modules/
│   │   ├── auth/                 ← 用户/设计师注册、登录、OAuth、Session
│   │   ├── users/                ← User 资料、设置、locale
│   │   ├── designers/            ← Designer 档案、KYC、payout 设置
│   │   ├── watchfaces/           ← Watch Face 上传、版本、IR、构建任务派发
│   │   ├── builds/               ← 构建任务状态、产物 URL
│   │   ├── store/                ← 浏览、搜索、推荐、详情
│   │   ├── purchases/            ← 单品购买、订阅、订单
│   │   ├── payouts/              ← 设计师分账、提现
│   │   ├── reviews/              ← 评价、评论
│   │   ├── moderation/           ← 内容审核工作流
│   │   ├── notifications/        ← 站内信、邮件、推送编排
│   │   ├── analytics/            ← 事件采集 → ClickHouse / PostHog
│   │   ├── admin/                ← 平台后台 API
│   │   └── webhooks/             ← Stripe / 阿里支付 / 内容审核回调
│   ├── infra/
│   │   ├── db/                   ← Drizzle client + 迁移
│   │   ├── cache/                ← Redis client
│   │   ├── storage/              ← R2 / S3 client
│   │   ├── queue/                ← BullMQ
│   │   ├── search/               ← Meilisearch client
│   │   ├── payment/              ← Stripe / 微信支付 / 支付宝 client
│   │   ├── i18n/                 ← 多语言
│   │   └── observability/        ← logger / tracer / metrics
│   ├── common/                   ← 全局守卫、拦截器、过滤器、装饰器
│   └── main.ts

packages/
├── ir-schema/                    ← Zod IR Schema（Backend / Frontend / Garmin SDK 共享）
├── api-types/                    ← OpenAPI 派生的 TS 类型（前端/移动端用）
├── shared-utils/                 ← 通用工具（日期、currency、locale）
└── feature-flags/                ← Feature flag 客户端（PostHog 包装）

workers/                          ← 独立部署的 worker 进程
├── build-worker/                 ← 监听 BullMQ 触发 Garmin SDK 编译
├── moderation-worker/            ← 调内容审核服务
├── payout-worker/                ← 月度分账批处理
└── analytics-worker/             ← 事件清洗 → ClickHouse
```

## 2. 服务边界与通信

### Phase 1 (单体)

- 所有模块在一个 NestJS 进程
- 模块间通过依赖注入（DI），**不允许**直接读对方 DB 表（必须走对方 Service）
- 重 / 异步任务（构建、内容审核、邮件、分账）走 BullMQ → workers

### Phase 3+ (按需拆分)

可能的拆分顺序：
1. `build-worker` → `garmin-build-service`（独立部署，便于水平扩展）
2. `analytics` → 独立服务（数据隔离）
3. 其他暂不拆

## 3. 数据流（关键路径）

### 设计师上传表盘 → 上架

```
Designer (Web)
  → POST /api/v1/watchfaces (multipart: ir.json + assets)
    → watchfaces.controller
      → watchfaces.service.create(): zod validate IR, store to R2, write DB
        → moderation.queue.enqueue({ watchface_id })
        → builds.queue.enqueue({ watchface_id, target_devices: ['fr255', ...] })
        → return { id, status: 'pending_review' }

(async)
moderation-worker → moderation.service.process()
  → 调阿里云盾 / OpenAI Moderation
  → DB update status = 'approved' | 'rejected'
  → 触发 notifications

(async)
build-worker → 调 Garmin SDK Agent (内部 RPC 或 Job)
  → 接收 build_report.json + .prg URLs
  → DB update build status = 'success' | 'failed'
  → 上架到 Connect IQ Store（Phase 1 半自动；Phase 2 自动）
```

### 用户购买 → 安装

```
User (Web/App)
  → POST /api/v1/purchases (watchface_id, payment_method)
    → purchases.controller
      → purchases.service.checkout()
        → Stripe.PaymentIntent.create
        → DB insert purchases (pending)
        → return { client_secret }
  ← 前端用 Stripe Elements 完成支付
  → Stripe webhook → /api/v1/webhooks/stripe
    → webhooks.service.handlePaymentIntentSucceeded()
      → DB update purchases (succeeded)
      → 派发安装通知 + Connect IQ Store 兑换码（如适用）
      → 入账设计师待结算 ledger
```

## 4. 数据库

- 主库：PostgreSQL 16（按地理：新加坡为主，杭州为中国大陆主）
- ORM：Drizzle（schema-first、强类型、与 Zod 互导）
- 迁移：Drizzle Kit
- 命名：snake_case 表名，camelCase 列名（在 Drizzle schema TS 中映射）
- 见 `DB_CONVENTIONS.md`

## 5. 缓存

- Redis (Upstash)：session、限流、热门表盘列表（TTL 60s）
- 本地内存：仅开发，生产禁用单进程缓存

## 6. 对象存储

- Cloudflare R2 主桶：`wewatch-prod-watchfaces`、`wewatch-prod-assets`
- 国内：阿里云 OSS 镜像
- 上传走预签名 URL（避免穿后端）；下载走 CDN

## 7. 鉴权

- 用户：Lucia Auth + cookie session（Web）+ JWT（移动端）
- 设计师：同 user，角色字段区分 + 必须完成 KYC 才能 publish
- 平台后台：单独 admin auth（mTLS + 2FA）
- API to API：HMAC + nonce + 5min 时间窗

## 8. 第三方依赖

| 服务 | 用途 | 关键风险 | 备份 |
|---|---|---|---|
| Stripe Connect | 全球支付 + 设计师分账 | 单点故障 | 备 Lemon Squeezy 集成（开关） |
| 微信支付 / 支付宝 | 中国境内 | 资质 / 备案 | 必须本地主体 |
| Cloudflare R2 + CDN | 存储与分发 | 中国访问差 | 国内用 OSS 镜像 |
| 阿里云盾 / OpenAI Moderation | 内容审核 | 假阳/假阴 | 双引擎 + 人工兜底 |
| Garmin Connect IQ Store | 表盘分发 | 政策变更 | sideload 渠道 |
| PostHog | 产品分析 + feature flag | 自托管避免出口数据 | 自托管 + ClickHouse |
| Sentry | 错误追踪 | 自托管避免泄漏 | 自托管选项 |

## 9. 部署拓扑

- **新加坡 region**（主）：API 主集群、Postgres 主、R2、Redis
- **欧美 region**（边缘）：CDN、Cloudflare Workers BFF
- **中国大陆**（独立主体）：阿里云杭州 / 北京双区，独立数据库
- 多 region 数据**不直接同步**——只复制"已审核 + 已授权 跨境分发"的表盘元数据

## 10. 已知架构风险

| 风险 | 对策 |
|---|---|
| 单体早期演进快导致模块耦合 | 严格 module DI，不允许跨表读 |
| Stripe Connect 拒绝某些国家设计师 | Lemon Squeezy 备选 + 文档化 KYC 路径 |
| 内容审核误判率高 | 双引擎 + 人工 + 设计师申诉队列 |
| 跨境数据合规 | 中国主体独立 DB + 仅同步必要字段 |
| 大表盘资源（mp4 动效）爆 R2 单文件限制 | 资源拆片 + 限制单包尺寸 |

---

**版本**：0.1.0
**最后更新**：2026-04-26
