# Cost Budget · v0.1.0

> 三层预算：用户级（订阅档配额）/ 任务级（单次上限）/ 平台级（月度封顶）。任意一层被打破都触发硬刹车。

---

## 1. 单位约定

- **credit**：抽象单位，对内统一记账
- 1 credit ≈ $0.005 平台原始成本（含 LLM + image gen + moderation 摊销）
- 1 个"基础任务"（极简表盘 + 无图）约 1 credit
- 1 个"图像背景任务"约 5-8 credits

## 2. 用户级配额（按订阅档）

| Tier | 月度配额 | 单任务上限 | 备注 |
|---|---|---|---|
| Free | 3 credits | 3 | 仅纯色/渐变背景 |
| Plus ($3.99/mo) | 30 credits | 10 | 含图像背景 |
| Pro ($7.99/mo) | 200 credits | 30 | 含图像背景 + 优先排队 |
| Signed designer | 500 credits | 100 | 商业用途 |

超额行为：
- Free → 强制提示升级
- 付费档 → 可购买 credit 包（10 credits = $1.99）

## 3. 任务级上限

每次任务请求中 `budget_credits` 字段不可超过用户单任务上限。

任务执行中**软停**：累计成本 > 80% budget → 警告，但仍执行；> 100% → 硬停（除非 fallback 是 cheaper path）。

## 4. 平台级月预算

| 项目 | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| LLM 总开支 | $300 | $1500 | $8000 |
| 图像生成总开支 | $200 | $1000 | $6000 |
| Moderation API | $100 | $400 | $1500 |
| 自部署 GPU（境内） | $0 | $500 | $2500 |
| **合计月上限** | **$600** | **$3400** | **$18000** |

> 阶段升级条件：与营收挂钩（成本占营收 < 25% 才允许涨档）。

接近 80% → DevOps Agent + Founder 同时收 P1 告警。

## 5. 实现

```ts
// workers/ai-pipeline/src/cost/cost-guard.ts
export class CostGuard {
  async beforeCall(userId: string, plannedCredits: number) {
    const userQuota = await getUserQuota(userId);
    const platformQuota = await getPlatformQuotaToday();
    if (plannedCredits > userQuota.taskMax) throw new BudgetTaskExceeded();
    if (userQuota.monthlyRemaining < plannedCredits) throw new BudgetUserExceeded();
    if (platformQuota.todayRemaining < plannedCredits) throw new BudgetPlatformExceeded();
    await reserve(userId, plannedCredits);
  }
  async afterCall(userId: string, actualCredits: number, plannedCredits: number) {
    await commit(userId, actualCredits);
    if (actualCredits > plannedCredits * 1.5) {
      await reportAnomaly({ userId, ratio: actualCredits / plannedCredits });
    }
  }
}
```

## 6. 异常

- **budget exceeded by far** (单任务实际成本 > 计划 2×) → 自动写 ERROR_PLAYBOOK 新条目
- **平台日预算耗尽** → AI 生成功能在该 region 暂停（已排队任务继续；新任务返回 503 with Retry-After=86400）
- **滥用检测**：同一 IP / 用户 1h 内 > 50 任务 → 限流 + 风控审查

## 7. 与 Backend Agent 的接口

预算逻辑由 Backend 侧实现，AI Pipeline Agent 只负责"在每个 LLM/image 调用前后"上报：

```
POST /api/v1/_internal/credits/reserve
POST /api/v1/_internal/credits/commit
POST /api/v1/_internal/credits/refund    // 调用失败时
```

## 8. 监控

| 指标 | 告警 |
|---|---|
| 当日平台支出 / 当日预算 | 80% → P2；100% → P0 |
| 单任务平均成本 | > 历史均值 × 1.5 → P3 |
| 用户配额耗尽率 | > 50% 用户耗尽 → 调档建议 |
| Refund / commit 比 | > 5% → 检查模型稳定性 |

---

**版本**：0.1.0
**最后更新**：2026-04-26
