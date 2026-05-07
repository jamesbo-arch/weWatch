# Roadmap Playbook · v0.1.0

> 路线图不是甘特图，是承诺。所以它必须**可少不可多**——少承诺、多兑现。

---

## 路线图三层结构

```
[NOW]    本 sprint（1-2 周）  · 已 committed，几乎不可变
[NEXT]   本 phase（3-4 个月）  · 大方向明确，细节可调
[LATER]  下一 phase             · 趋势性，随学习更新
```

> 没有"下下个 phase 之外"的路线图。10 个月之后的事不应该出现在路线图上。

---

## NOW · 本 sprint

- 由 PM Agent 在周一 sprint planning 后产出
- 含 4-8 个 task，每个 task 1 owner agent + 明确 DoD
- **承诺率**：本 sprint 的 task 至少 75% 必须按时完成；低于此值连续 2 sprint → 缩小 sprint 容量
- 状态板：每天自动更新（PM Agent 维护）

## NEXT · 本 phase

- 由 PM Agent 在 phase 启动时拟定，含 5-10 个里程碑（PRD 级）
- 每个里程碑 = "Phase N 必交付的能力"
- 每月 review 一次，根据数据 / 用户反馈 / 竞品调整
- 调整必须进 DECISION_LOG

## LATER · 下一 phase

- 仅含 3-5 个"主题"（不是具体功能）
- 例如：Phase 2 的 LATER 主题：
  - "AI 原生体验"
  - "中国市场上线"
  - "社区与设计师 IP"
- 主题不"承诺"，只表"方向意图"

---

## Phase 推进规则（决定何时进入下一 Phase）

每个 Phase 都有"Exit Criteria"。**未满足 Exit Criteria 不允许进入下一 Phase**。

### Phase 0 → Phase 1 Exit

- [ ] Garmin SDK Agent 跑通 sample_task → 真机
- [ ] ≥ 5 个手工/Agent 生成表盘
- [ ] ≥ 10 名用户访谈完成 + 报告
- [ ] ≥ 5 名设计师访谈完成 + 报告
- [ ] 主体注册完成（新加坡）
- [ ] PRD `prd-001-mvp-marketplace` 通过 review

### Phase 1 → Phase 2 Exit

- [ ] MVP 上线 ≥ 60 天
- [ ] ≥ 200 上架表盘 / ≥ 100 注册设计师 / ≥ 5000 用户
- [ ] 月 GMV ≥ $3K
- [ ] T2I（试装到完成）≥ 60%
- [ ] 退款率 < 5%
- [ ] DECISION_LOG ≥ 20 条

### Phase 2 → Phase 3 Exit

- [ ] 编辑器月活设计师 ≥ 200
- [ ] 订阅用户 ≥ 1500
- [ ] LTV/CAC ≥ 2.5（不要求 4，但要求趋势）
- [ ] 中国 ICP 备案完成或明确放弃
- [ ] AI 生成管线技术验证完成

### Phase 3 → Phase 4 Exit

- [ ] 月活 ≥ 50000
- [ ] 月 GMV ≥ $80K
- [ ] 现金流接近转正（月烧钱 < 月收入 1.5x）
- [ ] 已招到第 1 位核心合伙人 OR 明确无需招聘的运营模型
- [ ] 跨平台技术验证完成（至少 1 个非 Garmin 厂商 demo）

---

## Roadmap 修改流程

修改 NEXT 或 LATER：

1. PM Agent 在月 ritual 中提议
2. 创始人批准 / 拒绝
3. 进入 DECISION_LOG（必须，含变更前后对比）
4. 同步主战略文档（如影响 phase 目标）

修改 NOW（本 sprint）：

- 仅 P0 紧急允许
- 任何修改必须创始人即时签字
- DECISION_LOG 立即记录

---

## Roadmap 视图（Markdown 表格示例）

```markdown
# weWatch Roadmap · 2026-Q2

## NOW (Sprint 23, 2026-04-26 to 2026-05-09)
- [ ] [PRD-042] 设计师 KYC 流程 v1 · backend + frontend
- [ ] [PRD-043] 多设备适配 v1（Top 10 设备） · garmin-sdk
- [ ] [PRD-044] 支付集成 Stripe Connect · backend
- [ ] [BUG-198] 安装引导 step-3 转化率掉 30% · ux + frontend

## NEXT (Phase 1 余下 8 周)
- M1: 公网 alpha 上线（5 月底）
- M2: 设计师入驻 v1
- M3: 表盘上传 + 浏览 + 购买闭环
- M4: 客服与退款流程
- M5: 多语言 zh/en/ja/th

## LATER (Phase 2 主题)
- 可视化编辑器
- 订阅会员
- 设计师社区雏形
- 自动多设备适配生产化

## 不在路线图中（避免被误认为 in-roadmap）
- 中国大陆上线 → Phase 3
- AI 生成 → Phase 3
- 跨平台 → Phase 4
```

---

## 长期路线图与"未来想象"

创始人难免会想"3 年后 weWatch 应该长什么样"。这是好事，但**不放进路线图**。
专门的 `vision/2030.md` 文档存放，与 roadmap 分开管理。每季度一次 vision check 检查 roadmap 是否朝那里走。

---

**版本**：0.1.0
**最后更新**：2026-04-26
