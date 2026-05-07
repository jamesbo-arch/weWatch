# Security Rules · v0.1.0

> 这些规则是**绝对**的。Backend Agent 违反任意一条 = 任务失败。Security Agent 月度扫描会逐条检查。

---

## 1. 鉴权

- 所有 endpoint 默认要求登录，public 必须显式 `@Public()` 装饰
- 关键操作（支付、payout、删账号、admin）必须二次确认（OTP / WebAuthn）
- session 30 天无活动失效；长期未登录设备需重新二次确认

## 2. 授权（RBAC + ABAC）

- 用户能改自己 = ABAC（`resource.userId === actor.id`）
- 设计师只能改自己作品 = ABAC
- 后台权限按角色（admin / moderator / support）= RBAC
- 任何 endpoint 在 service 层必须有授权检查；controller 装饰器只是辅助

## 3. 输入校验

- 所有 endpoint 入参必须通过 Zod schema
- 文件上传：限大小、限类型、扫描病毒（ClamAV）+ 内容审核 hook
- 上传文件名必须重新生成（避免路径注入），原文件名仅作展示

## 4. 输出过滤

- API 响应必须经过 DTO 投影（不直接 dump entity，避免泄漏 internal 字段）
- 用户互看：`User.email` 不暴露给其他用户；只暴露 `displayName`

## 5. SQL 注入 / 命令注入

- 100% 走 Drizzle 参数化；禁止 `sql.raw(<user input>)`
- 禁止 `child_process.exec` 拼接用户输入；用 `execFile` 数组参数

## 6. 密钥管理

- 不入代码、不入日志、不入 commit history
- 本地：`.env.local`（git ignored）
- 生产：1Password / AWS Secrets Manager / Doppler，注入到运行时环境
- Garmin 开发者私钥：单独保管，3 副本（1Password + 离线 USB + 律师代管）
- 任何泄漏 → P0 事件，按响应预案旋转所有相关密钥

## 7. PII 处理

| 数据 | 存储 | 日志 | 第三方传 | 删除 |
|---|---|---|---|---|
| email | DB（明文） | ❌ | 仅 Stripe / 邮件服务 | 28 天宽限 → 永久删 |
| legal_name | DB（加密 col） | ❌ | 仅 Stripe Connect KYC | 同上 |
| 身份证 / passport | **不存**（Stripe 持有 token 即可） | ❌ | Stripe 持有 | n/a |
| 支付卡 | **不存** | ❌ | Stripe 持有 | n/a |
| 心率 / 生理数据 | 默认不收集 | ❌ | 永不外传 | 用户授权才收 |

加密用 AES-256-GCM + KMS 管理密钥。

## 8. CSRF / XSS

- API 用 JSON + cookie + SameSite=Lax + 自定义 header（`X-CSRF-Token`）
- 输出到 HTML 必须经 escape
- CSP header 严格白名单

## 9. CORS

- 生产 origin 白名单（不允许 `*`）
- credentials 仅对自有 origin 允许

## 10. 限流与滥用

- 全局：60 req/min/IP（匿名）/ 600（用户）
- 登录、注册、忘记密码：5 req/min/IP
- 文件上传：10/h/user
- AI 生成：按订阅档配额

## 11. 审计与追溯

- 所有 admin 操作写 `audit_events`
- 所有支付状态变更写 `audit_events`
- 所有 PII 访问（特别是 admin 看用户数据）写 `audit_events`
- 用户可申请"查看我被读取过哪些次"（GDPR 友好）

## 12. 第三方安全

- 集成新第三方前必须列：传出去什么数据、SOC2/合规证明、数据居留
- 任何中国厂商 SDK 不集成到全球版（避免合规风险）

## 13. 事件响应

- 发现疑似事故 → 1h 内 Founder + Security Agent 拉到一起
- 4h 内决定是否对外披露（按 GDPR 72h 通知规则更紧）
- 事后 7d 内 post-mortem + 沉淀到 `docs/security/incidents/`

## 14. Backend Agent 必跑的自检（每次 PR）

- [ ] 所有 endpoint 有 `@Auth` / `@Public` 装饰
- [ ] 所有 service 方法有授权检查
- [ ] Zod schema 覆盖所有入参
- [ ] 没有 PII 出现在新加的 log
- [ ] 没有 secret 出现在 diff
- [ ] 新增依赖经 `pnpm audit` 通过

---

**版本**：0.1.0
**最后更新**：2026-04-26
