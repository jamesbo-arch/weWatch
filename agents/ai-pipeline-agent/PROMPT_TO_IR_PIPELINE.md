# Prompt → IR 管线 · v0.1.0

> 给 ai-pipeline-agent 的"算法手册"。任何"用户 prompt → 完整 IR"任务都按这个顺序走。

---

## 总览：7 步管线

```
[1] cost estimate
[2] prompt safety check
[3] style brief extraction
[4] IR generation (schema-constrained)
[5] IR self-validation + auto-fix
[6] asset generation (only if needed)
[7] final moderation + handoff
```

---

## Step 1: Cost Estimate

**目标**：在第一行 LLM 调用前，知道这个任务大概要花多少 credits，避免烧穿。

输入：用户 prompt + 任务类型 + 目标设备数 + 用户 tier

估算逻辑（伪代码）：

```
base = 1 credit
if has_image: base += 5 credits
if multi_layered_bg: base += 3
if # devices > 5: base += 1 per extra 5
if tier == 'free': max_budget = 3 credits
if tier == 'plus': max_budget = 10 credits
if tier == 'pro': max_budget = 30 credits
if tier == 'signed': max_budget = 100 credits

if estimate > max_budget:
  return {
    status: 'budget_required_confirmation',
    estimate: <n>,
    available: <m>,
    suggestion: '降级方案：去掉自定义背景图，使用纯色或渐变。预计 2 credits。'
  }
```

如果用户 confirm OR 在预算内 → 进 Step 2。

---

## Step 2: Prompt Safety Check

调 `moderation_check('text_input', { prompt, locale })`。

**严格政策**：
- 任何 IP_AND_SAFETY.md 一级红线（真人肖像、商标、儿童不当内容、暴力、政治极端）→ 直接拒绝，且**不**告诉用户具体哪条触发（避免被反向工程）
- 二级警告（"军队风" "宗教元素"）→ 进入但加严格 IP_AND_SAFETY 监督

输出：`{ passed: bool, level: 'ok' | 'warn' | 'block' }`。

block 直接终止任务，写 moderation_log.json。

---

## Step 3: Style Brief Extraction

把"用户的口语化 prompt"翻译为"结构化的设计 brief"。这是关键的"歧义压缩"步骤。

调 `call_llm` 用 `prompts/style_extraction.md`，schema:

```ts
const StyleBriefSchema = z.object({
  mood: z.enum(['minimal', 'cyberpunk', 'retro', 'sport', 'business',
                'outdoor', 'elegant', 'playful', 'dark', 'vibrant']).array().min(1).max(3),
  palette_intent: z.object({
    primary_hue: z.string(),     // "warm orange", "icy blue"
    contrast: z.enum(['low', 'medium', 'high']),
    background_type: z.enum(['solid', 'gradient', 'image', 'auto']),
  }),
  must_have_elements: z.array(z.enum([
    'time', 'date', 'heart_rate', 'steps', 'battery',
    'weather', 'second_hand', 'progress_arc'
  ])),
  forbidden_elements: z.array(z.string()),  // 用户明确不要的
  style_notes: z.string().max(400),
  cjk_required: z.boolean(),
});
```

模型选择：**Claude Sonnet 4.6**（推理质量稳；Haiku 偶尔遗漏 must-have）。

失败 → 重试 1 次（更明确 prompt） → 再失败给用户友好"我没理解你的意思，能否说明一下"。

---

## Step 4: IR Generation (Schema-Constrained)

最重要也最容易翻车的一步。

输入：
- StyleBrief（来自 Step 3）
- targets 列表（每个 device 的 capabilities，从 `packages/ir-schema/devices` 注入）
- 一个 IR 骨架模板（按 mood + canvas.shape 选取，避免每次从零生成）

调 `call_llm`：
- model = `claude-sonnet-4-6`（Phase 3+ 评估自部署 Qwen-Coder 替代）
- prompt = `prompts/ir_generation.md` 渲染过
- schema = `WatchFaceIRSchema`（直接传给 LLM API 做 schema-constrained generation）
- seed 必填

期望：返回的 JSON 直接 `WatchFaceIRSchema.parse()` 通过。

**性能要求**：单次成本预算 ≤ 1 credit；超时 30s。

---

## Step 5: IR Self-Validation + Auto-Fix

```
[5.1] structural validation
   ir = WatchFaceIRSchema.safeParse(rawJson)
   not success → call_llm with same prompt + 错误细节，重试 1 次
                 仍失败 → 任务失败

[5.2] business validation
   report = validateForTargets(ir, targets)
   if all rejected → 任务失败（"none of the targets is achievable"）
   if some rejected:
       - automatically drop those from targets
       - record in job_report.decisions
       - 继续

[5.3] production readiness
   gate = validateProductionReadiness(ir)
   if gate.blockers includes 'ip_review_status':
       set ir.meta.ip_review_status = 'pending'   // 由人工或自动审核管线后续设置
       继续（不自动设为 approved！）

[5.4] memory budget per accepted device
   for each accepted device:
       est = estimateMemoryUsage(ir, device)
       if est > 0.7 * device.memKb:
           drop device from targets
           record decision
   if no devices left → 任务失败
```

**禁止**：在 step 5 用 LLM "聪明地"修复——仅做规则化的剔除/降级。LLM 自由修复风险太高（可能改坏其他东西）。

---

## Step 6: Asset Generation（仅需要图像背景或图标时）

判定：`ir.canvas.background.type === 'image'` 或 任一 `image` element。

每个 image asset 走子管线：

```
[6.1] derive image prompt
      用 prompts/image_postprocess.md（其实是"prompt"模板）从 IR + StyleBrief 派生
      明示 "minimalist, no text in image, no humans, no logos"
      自动加 negative prompt（unsafe / IP / 复杂细节）

[6.2] generate_image (model selection per MODEL_CATALOG)
      seed = stable hash(job_id + asset_index)
      尺寸：max(target devices' resolution) × 1.2（留余地）
      返回原始 PNG

[6.3] image moderation
      moderation_check('image', { url })
      block → 重新生成（不同 seed）× 1 → 仍 block 任务失败

[6.4] post_process_image per device variant
      为每个 target device 生成一个特化版本：
        - resolution match
        - palette quantize（MIP 设备）
        - dithering（MIP 设备）
        - PNG 压缩
        - 大小检查（不能超过 device 资源预算）
      产出：assets/<asset_id>/<device_id>.png

[6.5] update IR
      把 asset_id 写回对应 background / image element
```

详细规则见 `IMAGE_GENERATION_RULES.md`。

---

## Step 7: Final Moderation + Handoff

最终一道闸门：

```
[7.1] aggregated content moderation
      把 IR.meta.name + meta.description + 所有 text element.props.content
      + 所有图像（已后处理的）
      一起送 moderation_check
      block → 任务失败

[7.2] write final IR
      ai-jobs/<job_id>/generated_ir.json

[7.3] write job_report.json
      含：cost、latency、quality_self_score、targets accepted/rejected、
          decisions made、moderation log、cache hits、playbook hits

[7.4] enqueue garmin-sdk-agent build job
      task = {
        task_id: 'wf-<job_id>',
        type: 'build_watchface',
        ir: <generated_ir>,
        targets: <accepted targets>,
        designer_id: <user_id>,
        constraints: { ... }
      }
      → BullMQ → garmin-build queue

[7.5] return to caller
      Backend API 回复 user：
      {
        status: 'queued',
        job_id: '...',
        estimated_compile_time_sec: 120,
        eta: '...',
        preview_thumbnail_url: '...'  // 用 generated image 做缩略图
      }
```

---

## 反例（这些不要做）

- ❌ 一次 LLM 调用搞定 prompt → IR + 图像 prompt + 后处理参数（容易整体崩）
- ❌ 在 Step 4 失败后改用更便宜模型重试（容易让低质模型试图理解失败原因）
- ❌ 把用户原始 prompt 直接塞进 image gen（容易触发 IP 边界）
- ❌ 在 IR 里硬编码图像 URL（应用 asset_id 走 R2）
- ❌ 跳过 Step 7 的最终聚合 moderation（图像单独 OK 不代表整体 OK）

---

**版本**：0.1.0
**最后更新**：2026-04-26
