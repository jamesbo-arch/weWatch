# Error Handling · v0.1.0

> 错误的标准分类、对外暴露、内部追溯。Backend Agent 写代码时必须按此分类抛错。

---

## 1. 分类

```
DomainError (业务错)              → 4xx，对外可见 message + code
  ├── ValidationError              → 400
  ├── AuthError                    → 401 / 403
  ├── NotFoundError                → 404
  ├── ConflictError                → 409
  └── BusinessRuleError            → 422

InfrastructureError (基础设施错)  → 5xx，对外通用 message
  ├── DatabaseError
  ├── ExternalServiceError         → 502 / 503
  ├── TimeoutError                 → 504
  └── UnknownError                 → 500
```

## 2. 抛错实践

**好**：

```ts
if (!designer.kycCompleted) {
  throw new BusinessRuleError({
    code: 'DESIGNER_KYC_INCOMPLETE',
    message: 'Complete KYC before publishing a watch face.',
    details: { missingFields: designer.kycMissingFields },
  });
}
```

**差**：

```ts
throw new Error('kyc not done');   // 没分类、没 code、没 details
```

## 3. 全局过滤器

NestJS 全局 ExceptionFilter 把所有错误归一：

```ts
{
  error: {
    code: 'DESIGNER_KYC_INCOMPLETE',
    message: '...',                          // 按 Accept-Language 翻译
    details: { ... },
    requestId: 'req_01HXYZ...',
  }
}
```

未知 Error → 500 + 不暴露 message 细节，仅 `requestId`。

## 4. 重试策略

| 错误类型 | 重试 | 说明 |
|---|---|---|
| ValidationError | ❌ | 客户端 bug，重试无意义 |
| AuthError | ❌ | 用户重新登录 |
| ConflictError | 视情况 | 乐观锁冲突可指数退避重试 |
| DatabaseError 暂时性（连接断、deadlock） | ✅ | 指数退避 3 次 |
| ExternalServiceError | ✅ | 指数退避 + 熔断 |
| TimeoutError | ✅ | 短重试，避免雪崩 |

实现：用 `p-retry` 或自有装饰器；service 层抛清晰的错误，retry 在 client / queue 层做。

## 5. 熔断

外部依赖（Stripe / 内容审核 / Garmin）必须有熔断器（用 `opossum` 或自实现）：

- 错误率 > 50%（10s 窗口）→ open
- open 30s 后 half-open
- 触发 → 内部告警 + 降级策略（如审核：进人工队列；支付：返回友好错误让用户稍后再试）

## 6. 日志

- 错误 log 包含：requestId、userId（如有）、code、stack、关键 context（不含 PII）
- 用结构化（JSON）日志，便于查询
- ERROR 级 → 触发 Sentry；WARN 级 → 仅入日志

## 7. 客户端友好

- 所有 message 默认英文，按 `Accept-Language` 翻译
- 重要错误提供"下一步操作"（如"完成 KYC"按钮链接）
- 不要"哎呀出错了"这种废话

## 8. 监控触发

| 错误模式 | 告警等级 | 阈值 |
|---|---|---|
| 5xx 率 | P1 | > 1% / 5min |
| 单 endpoint 5xx | P2 | > 5% / 5min |
| 第三方熔断打开 | P1 | 任一 |
| 数据库连接池打满 | P0 | 任一 |
| webhook 验签失败 | P1 | > 0.1% / 5min |

---

**版本**：0.1.0
**最后更新**：2026-04-26
