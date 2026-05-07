# Database Conventions · v0.1.0

> 主库：PostgreSQL 16；ORM：Drizzle；迁移：drizzle-kit。

---

## 1. 命名

- 表：snake_case，**复数**（`users`, `watch_faces`, `purchase_items`）
- 列：snake_case
- 主键：`id`（默认）
- 外键：`<reference>_id`（`user_id`, `watch_face_id`）
- 时间戳：`created_at`, `updated_at`, `deleted_at`（必须，全部）
- 布尔：`is_*`（`is_published`）或 `has_*`
- 枚举字段：用 PG enum，命名 `<table>_<field>_enum`

Drizzle TS 端用 camelCase（列映射）：

```ts
export const watchFaces = pgTable('watch_faces', {
  id: text('id').primaryKey(),
  designerId: text('designer_id').notNull(),
  name: jsonb('name').$type<LocalizedString>(),
  ir: jsonb('ir').$type<WatchFaceIR>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

## 2. 主键策略

- ULID 字符串（`wf_01HXYZ...`）
- 类型前缀（`wf_`, `ds_`, `usr_`, `prc_`）便于日志辨识
- 不用 auto-increment（不利于分布式 + 信息泄漏）

## 3. 必备列

每张表必备：

```sql
id           text PRIMARY KEY
created_at   timestamptz NOT NULL DEFAULT now()
updated_at   timestamptz NOT NULL DEFAULT now()
deleted_at   timestamptz                          -- 软删
version      integer NOT NULL DEFAULT 1            -- 乐观锁
```

软删：所有 SELECT 默认 `WHERE deleted_at IS NULL`。物理删除仅 admin 工具，需审批。

## 4. 索引规则

- 所有外键必须有索引
- 高频查询列建索引（含复合，按"等值列在前，范围列在后"）
- 文本搜索：用 Meilisearch，PG 仅做精确匹配
- JSONB 字段如需查询：GIN 索引；否则不索引（节约写入开销）

每张表的索引清单维护在 schema TS 文件头注释。

## 5. JSONB 使用

- 适用：schema 灵活、无 join 需求的字段（如 IR、metadata、locale 文本）
- 禁用：业务关键的可查询字段（应拆出独立列）
- 必须有 Zod 类型 + Drizzle `$type<>()` 标注

## 6. 迁移规则

每次迁移一个 .sql 文件，命名 `NNNN_<verb>_<noun>.sql`，含 up + down：

```sql
-- migration: 0042_add_designer_kyc_status.sql
-- up
ALTER TABLE designers ADD COLUMN kyc_status designer_kyc_status_enum NOT NULL DEFAULT 'pending';
CREATE INDEX idx_designers_kyc_status ON designers(kyc_status);

-- down
DROP INDEX IF EXISTS idx_designers_kyc_status;
ALTER TABLE designers DROP COLUMN kyc_status;
```

零停机部署 checklist：
- [ ] add column nullable / with default
- [ ] backfill 数据（如需，单独 job）
- [ ] code: 双写（旧字段 + 新字段）
- [ ] code: 切换读
- [ ] code: 切换写
- [ ] 下个 release: drop 旧字段

## 7. 关系 vs JSONB

| 场景 | 选择 |
|---|---|
| 一对多 + 需 join 查询 | 关系 |
| 一对多 + 完整文档读写 | JSONB |
| 多对多 | 关系 + 中间表 |
| 嵌套层数 ≥ 3 + 灵活 | JSONB |
| 高频按内层字段过滤 | 关系 |

例：
- watchface ↔ asset：关系（asset 可被多个 watchface 引用）
- watchface.ir：JSONB（整体读写、不按字段查询）
- purchase ↔ purchase_items：关系（按 watchface 查销售）

## 8. 事务

- 默认：service 方法包事务
- 跨多 service / 涉及外部 IO（HTTP / Queue）：用 outbox pattern，不开长事务
- 隔离级别：默认 read committed；财务相关用 serializable

## 9. 多区域数据隔离

- 全球库 ≠ 中国库
- 每张表必须明确 `data_region` 元数据（注释中）
- 跨境同步走专门同步任务（设计师作品同步），不直连

## 10. PII 字段标记

```ts
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),         // PII: yes
  legalName: text('legal_name'),          // PII: yes (encrypted at rest)
  ...
});
```

PII 字段：
- 加列注释 `-- PII: yes`
- 静态扫描器（可写一个简单脚本）确保未出现在日志 / 错误 / 第三方 outbound

## 11. 审计表

任何"会被监管或财务审计"的写操作 → 写一份不可改的 audit row：

```sql
audit_events (
  id text PRIMARY KEY,
  actor_id text NOT NULL,
  actor_type text NOT NULL,         -- user | designer | admin | system | agent
  action text NOT NULL,             -- 'purchase.refund' etc
  target_type text NOT NULL,
  target_id text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip text, user_agent text
)
```

## 12. 反模式

- ❌ 软删字段叫 `is_deleted`（用 `deleted_at` 时间戳）
- ❌ 在 JSONB 里塞 1MB+ 数据
- ❌ 用浮点存金额
- ❌ 不写 down migration
- ❌ 直接在生产 DB 跑临时 SQL
- ❌ 跨 region join

---

**版本**：0.1.0
**最后更新**：2026-04-26
