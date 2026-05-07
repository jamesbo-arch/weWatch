# Quality Rubric · v0.1.0

> 怎么判断"AI 生成的表盘是好的"？这份文件给出可操作的评分标准 + 反馈采集方式。

---

## 1. 三个观测层

```
[1] Self-score（Agent 在生成后用 LLM 自评）
[2] Compile feedback（Garmin SDK Agent 编译报告反推）
[3] User feedback（用户事后 1-5 星 + 文字）
```

最终该任务的 quality 综合分是三者加权（self 0.2 + compile 0.3 + user 0.5）。

## 2. Self-Score Schema

每个任务跑完 Step 7 后，调一次 Haiku 自评，schema:

```ts
const SelfScoreSchema = z.object({
  ir_completeness: z.number().min(1).max(5),       // 元素是否齐全、有意义
  visual_coherence: z.number().min(1).max(5),      // 配色字体布局是否协调
  prompt_fidelity: z.number().min(1).max(5),       // 是否反映了用户 prompt 的意图
  device_coverage: z.number().min(1).max(5),       // accepted target 比例
  notes: z.string().max(400),
});
```

低分（任意一项 < 3）→ 日志中 mark `needs_review`，每周 PM 抽样。

### Self-Score Rubric（喂给 Haiku 的判分指南）

```
ir_completeness:
  5 - 含 time + 至少 2 个其他元素 + 一致风格
  4 - 含 time + 1 个其他元素
  3 - 仅 time，但风格鲜明
  2 - 仅 time，风格平庸
  1 - 缺少基础元素

visual_coherence:
  5 - 配色严格遵守 StyleBrief，字体/布局比例舒适
  4 - 整体协调，1-2 个小瑕疵
  3 - 有可见冲突（如 4+ 不同字号、不协调配色）
  2 - 多处冲突
  1 - 视觉混乱

prompt_fidelity:
  5 - 完全捕捉用户意图（mood + 元素 + 颜色）
  4 - 主要意图捕捉，丢失一处
  3 - 部分捕捉
  2 - 仅边缘相关
  1 - 几乎无关

device_coverage:
  5 - >= 90% 目标设备 accepted
  4 - 70-90%
  3 - 50-70%
  2 - 30-50%
  1 - < 30%
```

## 3. Compile Feedback

Garmin SDK Agent 的 `build_report.json` 中 `decisions[]` 与 `targets` 状态直接反映 IR 质量：

| Garmin Agent 报告 | 推断 |
|---|---|
| 多 device skipped (lacks capability) | AI Pipeline 没充分考虑设备能力 → 罚分 |
| 内存超预算 | AI Pipeline 估算不准 → 罚分 |
| 编译警告（lint） | 生成的 IR 间接产生差代码 → 罚分 |
| 全部 success + 0 warning | 满分 |

## 4. User Feedback

任务完成 + 用户安装表盘后 7 天内：

- 推送 1 次评分弹窗（不可强制；不评分的不再问）
- 评分 1-5 + 可选文字 "为什么"
- 评分 ≤ 2 → 自动询问"想再生成一个吗？"（免费重试 1 次，平台承担）
- 评分聚合到设计师 / 用户档案

## 5. Aggregate Quality Score

```
score = 0.2 * self_score_avg + 0.3 * compile_score + 0.5 * user_rating(if any)
```

无 user_rating 时：`score = 0.4 * self_score_avg + 0.6 * compile_score`。

## 6. Quality 报警

- 日均 score < 3.5 → P3
- 周均 score < 3.5 → P2 + 强制 model review
- 月均 score < 3.5 连续 2 月 → P1 + 暂停 AI 生成 + 大改进 PRD

## 7. 模型 / Prompt A/B

每次 prompt 改版必跑 A/B：

- 用同一组 prompts × 50 个真实用户 prompt
- A=旧 prompt，B=新 prompt
- 比较 self_score、compile_score（user_rating 等待 ≥ 7 天）
- B 显著更好（+5% 综合分）→ ship
- 否则 → kill 或继续迭代

## 8. 数据沉淀

所有 quality 信号 → ClickHouse → Data Analyst Agent 做：
- 哪类 prompt 质量最低 → 改 prompt 模板
- 哪个设备类 quality 最低 → 改 ir_generation rules
- 哪个时段 quality 抖动 → DevOps 排查模型 API

---

**版本**：0.1.0
**最后更新**：2026-04-26
