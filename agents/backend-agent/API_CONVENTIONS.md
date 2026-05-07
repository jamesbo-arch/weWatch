# API Conventions · v0.1.0

> 所有 weWatch HTTP API 必须遵守。Frontend Agent / Mobile Agent / 第三方集成方都依赖本约定。

---

## 1. URL 设计

- 前缀：`/api/v{N}/`
- 资源名：复数、kebab-case、名词
- 子资源：嵌套不超过 2 层

```
GET    /api/v1/watchfaces                   # 列表
GET    /api/v1/watchfaces/:id               # 详情
POST   /api/v1/watchfaces                   # 创建
PATCH  /api/v1/watchfaces/:id               # 部分更新
DELETE /api/v1/watchfaces/:id               # 软删
GET    /api/v1/designers/:id/watchfaces     # 关联资源（OK）
GET    /api/v1/designers/:id/watchfaces/:wfId/builds   # 不要这样（≥3 层）
                                            # 改：GET /api/v1/builds?watchfaceId=...
```

非 CRUD 动作：用动词 sub-path

```
POST /api/v1/watchfaces/:id:publish
POST /api/v1/watchfaces/:id:unpublish
POST /api/v1/purchases/:id:refund
POST /api/v1/designers/:id/payouts:trigger
```

冒号语法可读性强且 RESTful 兼容。

## 2. 版本管理

- URL 版本号（`/v1/`），不在 header
- 每个 v 版本至少维护 12 个月
- destructive 变更必须 v+1 或 deprecate 6 个月

## 3. 请求格式

- Content-Type：`application/json`（默认）/ `multipart/form-data`（上传）
- Body 必须可被 Zod schema 校验
- 数字 ID 用 string（避免 JS 精度问题）—— 推荐 ULID 或 nanoid
- 时间一律 ISO8601 UTC（"2026-04-26T08:30:00Z"）
- 货币：金额用整数（最小货币单位，如 cent），单独 `currency` 字段

```json
{
  "amount": 399,
  "currency": "USD",
  "createdAt": "2026-04-26T08:30:00Z",
  "watchfaceId": "wf_01HXYZABC..."
}
```

## 4. 响应格式

成功：直接返回资源或资源数组（不要无谓的包裹）

```json
{ "id": "...", "name": "..." }
```

列表：

```json
{
  "items": [...],
  "page": { "cursor": "abc", "hasMore": true, "total": 1234 }
}
```

错误：统一格式

```json
{
  "error": {
    "code": "DESIGNER_KYC_INCOMPLETE",
    "message": "Complete KYC before publishing.",
    "details": { "missingFields": ["legal_name"] },
    "requestId": "req_01HXYZ..."
  }
}
```

## 5. HTTP 状态码

| 码 | 用途 |
|---|---|
| 200 | OK，含响应体 |
| 201 | Created（POST 资源） |
| 204 | No content（DELETE / 异步触发） |
| 400 | 入参不合法（Zod 失败） |
| 401 | 未鉴权 |
| 403 | 已鉴权但无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如重复创建） |
| 422 | 业务规则失败（区别于 400 的语法层）|
| 429 | 限流 |
| 500 | 未预期错误 |
| 503 | 暂时不可用（依赖故障）|

## 6. 鉴权

- Header：`Authorization: Bearer <token>` 或 cookie
- 请求 ID：服务端生成 `X-Request-Id`，回写响应 header
- 客户端可传 `X-Idempotency-Key` 实现幂等性（POST / PATCH 必须支持）

## 7. 分页

游标分页（不用 offset）：

```
GET /api/v1/watchfaces?cursor=eyJpZCI6Ind...&limit=20
```

## 8. 排序与过滤

```
GET /api/v1/watchfaces?sort=-createdAt&filter[shape]=round&filter[priceMax]=500
```

排序前缀 `-` = desc。

## 9. 国际化

- `Accept-Language: zh-CN,zh;q=0.9,en;q=0.8`
- 错误消息按用户 locale 返回（仅 message 字段；code 永远英文）

## 10. 限流

- 默认匿名 60 req/min/IP；登录用户 600 req/min/user
- 关键接口（购买、KYC、审核）单独限流
- 超限 → 429 + `Retry-After` header

## 11. Webhook 设计

- Path：`/api/v1/webhooks/<provider>`
- 必须验签（Stripe 用 signing secret，自有用 HMAC）
- 必须幂等（重复事件不重复处理）
- 5xx 由对方重试，2xx 视为已接收
- 处理时间 > 5s 改异步（立即 200，后台处理）

## 12. 错误代码命名

- 全大写 + 下划线
- `<DOMAIN>_<NOUN>_<STATE>` 模式

例：
- `DESIGNER_KYC_INCOMPLETE`
- `WATCHFACE_IR_INVALID`
- `PURCHASE_PAYMENT_FAILED`
- `BUILD_DEVICE_UNSUPPORTED`

错误代码定义维护在 `packages/api-types/src/error-codes.ts`，所有客户端引用同一枚举。

## 13. OpenAPI / 类型生成

- 用 `nestjs/swagger` 自动生成 OpenAPI
- 用 `openapi-typescript` 自动生成前端 TS 类型 → `packages/api-types/src/openapi.d.ts`
- CI 强制：openapi.json 与代码不一致 → fail

## 14. 反模式（Backend Agent 不得做）

- ❌ 把 query string 参数当 body 主键
- ❌ 用 GET 修改资源
- ❌ 不一致的字段名（`createdAt` vs `created_at` 同时出现）
- ❌ 把内部错误堆栈直接返回客户端
- ❌ 用 200 + `{ success: false }` 表示业务失败（应用 4xx/5xx）
- ❌ Inline 写超过 5 个 if-else 的业务逻辑（拆 service 方法）

---

**版本**：0.1.0
**最后更新**：2026-04-26
