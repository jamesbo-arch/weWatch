# Testing Rules · v0.1.0

> "未测试的代码是定时炸弹"。本规则定义 Backend Agent 必须遵守的测试金字塔。

---

## 1. 金字塔

```
        E2E         (少，关键 happy path + 关键失败路径)
      ─────────
     Contract       (中，每个 endpoint 都有)
   ─────────────
   Unit (Service)   (多，业务逻辑全覆盖)
 ─────────────────
```

## 2. 单元测试（vitest）

- 每个 service 方法 → 至少：1 happy + 1 主要 error 路径 + 边界值
- Mock 边界：mock `*Repository` 与外部 SDK，不 mock 同模块内的 helper
- 覆盖率：核心模块 ≥ 85%，工具 ≥ 70%
- 命名：`describe('ServiceName.methodName')` + `it('does X when Y')`

## 3. 契约测试

- 每个 controller endpoint 都有
- 用 supertest 黑盒调用，断言 status + body schema
- 校验 body 用 Zod schema（与 production 同）

```ts
import { request } from 'supertest';
import { app } from '../test-helper';

describe('POST /api/v1/watchfaces', () => {
  it('creates a draft watchface for an authed designer', async () => {
    const res = await request(app)
      .post('/api/v1/watchfaces')
      .set('Cookie', authCookie('ds_test_001'))
      .send(validIRPayload);
    expect(res.status).toBe(201);
    expect(WatchFaceResponseSchema.parse(res.body)).toBeDefined();
  });

  it('returns 422 with DESIGNER_KYC_INCOMPLETE if KYC not done', async () => {
    const res = await request(app)
      .post('/api/v1/watchfaces')
      .set('Cookie', authCookie('ds_test_no_kyc'))
      .send(validIRPayload);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('DESIGNER_KYC_INCOMPLETE');
  });
});
```

## 4. E2E 测试

- 仅覆盖关键流程：注册→上传→上架→购买→安装通知
- 用 Playwright 跨 Web/API 端到端跑
- 每个 PR 跑；夜间跑全量

## 5. 数据准备

- 用 Drizzle migration 重置 test DB（每次 suite 前）
- 用 builders 创建测试数据（避免散落的固定 SQL）

```ts
const designer = await Builders.designer({ kycStatus: 'approved' }).create();
const watchface = await Builders.watchface({ designerId: designer.id }).create();
```

## 6. 外部服务 mock

- Stripe：用官方 `stripe-mock` 容器或自有 fixture
- 阿里云盾：fixture
- Garmin SDK Agent：mock 一个返回 fixture 的 service
- DB：真实 PG（推荐）或 testcontainers
- Redis：real（轻量）

**禁止**：跑 unit/contract test 时打真实第三方网络。

## 7. Property-based test（适用场景）

IR Schema、价格计算、分账算法等"输入空间大"的场景用 `fast-check`：

```ts
import { fc } from 'fast-check';

it('payout calculation is monotonic in revenue', () => {
  fc.assert(fc.property(
    fc.float({ min: 0, max: 1e6 }),
    fc.float({ min: 0, max: 1 }),
    (revenue, share) => calcPayout(revenue, share) <= revenue
  ));
});
```

## 8. CI 门槛

- 任何 PR：所有 test 必须通过
- 覆盖率下降 ≥ 2pp → fail
- E2E 慢测：仅 main 分支跑全量

## 9. 反模式

- ❌ 测试里 `Math.random` 或 `Date.now()` 不固定（用 fixed seed / fake timer）
- ❌ 测试间共享状态（每次重置）
- ❌ 测试只跑 mock，从不跑真实 DB
- ❌ 用 sleep 解决并发（用事件 / future）
- ❌ console.log 当断言

---

**版本**：0.1.0
**最后更新**：2026-04-26
