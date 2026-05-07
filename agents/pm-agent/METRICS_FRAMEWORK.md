# 指标框架 · v0.1.0

> "如果一个功能上线 30 天后无法说清它对哪个指标产生了多少影响，那它就不该存在。" —— PM Agent 内化的真理。

---

## 一、北极星指标（NSM）

**Phase 0-2 北极星**：**月度付费表盘安装次数**（Monthly Paid Installs, MPI）

定义：自然月内，由付费用户（订阅或单品）触发的成功表盘"推送至手表"事件数。

为什么是它：
- 同时反映消费者（付费）+ 设计师（作品被装）+ 平台（成功完成 fulfillment）
- 比 GMV 更早领先（用户先装才付，先付才续）
- 比 DAU 更接近本质（DAU 高但不安装无意义）

**Phase 3+ 北极星升级**：**月度活跃订阅者数**（Active Paid Subscribers, APS）— 当订阅占收入 > 50% 时切换。

---

## 二、输入指标（Input Metrics）

NSM 是"结果"，输入指标是"原因"。我们日常优化的是输入。

### 消费者侧漏斗

```
访问首页
  ↓ Visit-to-Browse Rate (V2B)
浏览表盘详情页
  ↓ Browse-to-Try Rate (B2T)
开始安装流程
  ↓ Try-to-Install Rate (T2I)
完成安装
  ↓ Install-to-Use Rate (I2U) [7d]
持续使用 7 天
  ↓ Free-to-Paid Rate (F2P) [30d]
付费转化
```

| 指标 | Phase 1 基线 | Phase 2 目标 | Phase 3 目标 |
|---|---|---|---|
| V2B | 25% | 35% | 45% |
| B2T | 10% | 18% | 25% |
| T2I | 60% | 75% | 85% |
| I2U[7d] | 40% | 50% | 60% |
| F2P[30d] | 1% | 3% | 5% |

每条转化提升 → 直接驱动 NSM。

### 设计师侧漏斗

```
访问设计师页
  ↓
注册设计师账号
  ↓ Sign-to-Submit (≤ 7d)
提交首个作品
  ↓ Submit-to-Approve
作品上架
  ↓ First-Sale (≤ 30d)
首个销售
  ↓ Active-Designer (≥ 1 sale/月)
活跃设计师
```

| 指标 | Phase 1 基线 | Phase 2 目标 |
|---|---|---|
| Sign-to-Submit[7d] | 40% | 60% |
| Submit-to-Approve | 70% | 85% |
| First-Sale[30d] | 30% | 50% |
| Active-Designer 占比 | 20% | 35% |

### 商业指标

- **MRR**（月度经常性收入）
- **ARPU**（人均收入，按月活付费用户算）
- **LTV/CAC**（目标 > 4，第 18 月达成）
- **Churn rate**（订阅月流失率，目标 < 7%）
- **Net Revenue Retention**（订阅，目标 > 100% 含 upgrade）
- **Designer Take-rate**（平台抽成实际比例，应稳定 30%）

### 健康指标

- **D1 / D7 / D30 留存**（按表盘安装事件 cohort）
- **每用户月活表盘数**（多样性指标，> 1.5 健康）
- **NPS**（季度调研，目标 > 40）
- **设计师 NPS**（季度调研，目标 > 50，更高因为他们更敏感）

### 平台健康指标

- **可用性**（目标 99.9% / 月）
- **P95 API 延迟**（< 300ms）
- **编译矩阵成功率**（Garmin SDK Agent KPI，> 95%）
- **客服首次响应时间**（< 4h 工作日）
- **退款率**（< 3%）

---

## 三、护栏指标（Guardrails）

任何实验/新功能上线，**这些指标不许劣化**：

- 用户隐私事故（任何 = 0）
- 设计师投诉率（< 0.5%）
- 退款率
- 平台可用性
- D1 留存

实验若导致护栏指标超阈 → 自动回滚（不依赖人工判断）。

---

## 四、看板设计

### 创始人日报看板（每天早上 8 点自动生成）

```
- 昨日 NSM 数 vs. 7 日均值（趋势箭头）
- 昨日新增注册用户 / 新增设计师
- 昨日 GMV / MRR 变化
- 异常告警（任一输入指标偏离基线 > 20%）
- 今日 PM 推荐关注的 3 件事
```

### 周报看板（PM 周一例行）

按 WEEKLY_RITUAL 输出。

### 月报看板（月初例行）

完整 funnel + 实验回顾 + roadmap 进展。

---

## 五、实验框架

### 实验启动 checklist

- [ ] 假设清晰（不止"试试看"）
- [ ] 至少 1 个主指标 + 阈值
- [ ] 护栏指标列出
- [ ] 流量分配方案（A/B 比例）
- [ ] 最小样本量（用标准统计公式估算）
- [ ] 实验时长（≥ 7 天，覆盖 1 个完整周）
- [ ] 决策规则（达到阈值 → ship；未达 → kill / 迭代）

### 实验结果文档（必须存档于 `experiments/`）

模板：

```yaml
---
experiment_id: exp-2026-04-NN
hypothesis: <一句话>
variants: [control, variant_A, variant_B]
allocation: [33%, 33%, 34%]
start: YYYY-MM-DD
end: YYYY-MM-DD
primary_metric: <name>
guardrails: [...]
result: ship | kill | iterate | inconclusive
---
```

---

## 六、指标的伦理边界

呼应 PRINCIPLES P10 / P11：

- 不追"工程化的成瘾"指标（每日打开次数、推送点击率）
- 不优化"焦虑驱动"的转化（"剩 1 小时"虚假倒计时等）
- 任何指标的提升若以损害用户为代价 → 主动拒绝该指标作为目标

---

**版本**：0.1.0
**最后更新**：2026-04-26
