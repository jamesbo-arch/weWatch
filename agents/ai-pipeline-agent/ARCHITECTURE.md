# AI Pipeline Architecture · v0.1.0

> 把"自然语言意图"转换为"可在 Garmin 真机运行的 .prg"——这是个 5-7 步的有状态管线，不是一次 LLM 调用。

---

## 1. 三阶段总览

```
┌──────────────────────────────────────────────────────────────────┐
│  Phase A · 理解与规划（cheap, fast）                              │
│   - cost estimate                                                 │
│   - prompt safety check                                           │
│   - style brief（LLM 文本，Sonnet/小模型）                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  Phase B · 结构化生成（balanced）                                 │
│   - IR 主体生成（schema-constrained LLM）                         │
│   - IR 自校验 + 修复（Zod + validators）                          │
│   - 元素层规划（哪些需要图像资源？）                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  Phase C · 资源生成与打包（expensive）                            │
│   - 图像生成（仅必要时）                                          │
│   - Garmin 调色板量化 + dithering 后处理                          │
│   - 最终 moderation                                               │
│   - 打包给 Garmin SDK Agent                                       │
└──────────────────────────────────────────────────────────────────┘
```

每一阶段都可独立失败 / 重试 / 缓存，不污染下游。

---

## 2. 完整数据流

```
                          ┌──────────────────────────┐
                          │  Backend API             │
                          │  POST /api/v1/ai/generate │
                          └────────────┬─────────────┘
                                       │ enqueue (BullMQ)
                                       ▼
                              ┌─────────────────┐
                              │ ai-pipeline     │
                              │  worker         │
                              └────────┬────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
                ▼                      ▼                      ▼
        ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
        │ Cost Guard   │      │ Moderation   │      │ Cache Lookup  │
        │  (in-process)│      │  Service     │      │  (R2 / Redis) │
        └──────────────┘      └──────────────┘      └──────────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │  call_llm( ... )        │
                          │  (model router below)   │
                          └────────────┬───────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │  IR Validator           │
                          │  WatchFaceIRSchema      │
                          │  validateForTargets     │
                          └────────────┬───────────┘
                                       │
                          ┌────────────┴───────────┐
                          │                        │
                          ▼                        ▼
              ┌────────────────────┐    ┌────────────────────┐
              │ generate_image     │    │ skip image gen     │
              │  (if IR uses image)│    │ (icons-only IR)    │
              └─────────┬──────────┘    └────────────────────┘
                        │
                        ▼
              ┌────────────────────┐
              │ post_process_image │
              │  per-device variant│
              └─────────┬──────────┘
                        ▼
              ┌────────────────────┐
              │ moderation_self    │
              │  _check (output)   │
              └─────────┬──────────┘
                        ▼
              ┌────────────────────┐
              │ Hand off to        │
              │ garmin-sdk-agent   │
              │ via build queue    │
              └────────────────────┘
```

---

## 3. 内部"工具"（自定义函数）

AI Pipeline Agent 不直接调用 OpenAI / Anthropic / Replicate API。所有调用走如下封装函数（实现于 `workers/ai-pipeline/src/tools/`）：

### `call_llm(model, prompt, schema?, options)`

```ts
export interface CallLlmOptions {
  model: 'claude-sonnet-4-6' | 'claude-haiku-4-5' | 'gpt-4o-mini' | 'self-hosted-qwen';
  prompt: string;
  schema?: z.ZodTypeAny;     // if set, retry until structured output validates
  seed?: number;
  maxTokens?: number;
  budget_credits: number;
}
```

实现细节：
- 自动 budget 预扣
- 失败重试（指数退避，最多 3 次）
- 结构化输出失败 → 回滚 budget + 抛 `LlmStructuredOutputError`
- 全部调用写 `ai-jobs/<job_id>/intermediate/llm_calls.jsonl`

### `generate_image(model, prompt, params)`

```ts
export interface GenerateImageOptions {
  model: 'sdxl-v1' | 'flux-schnell' | 'flux-dev' | 'self-hosted-sdxl';
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
  seed: number;             // required, no random
  steps?: number;
  cfg_scale?: number;
  budget_credits: number;
}
```

返回原始图（PNG，不缩放、不量化）。

### `post_process_image(file, target_device)`

调本地 Python 脚本（`tools/image-postprocess/`）：

```
1. resize/crop 到 device.resolution
2. （MIP）按设备调色板量化
3. （MIP）error-diffusion dithering（Floyd-Steinberg）
4. PNG 优化（pngquant / oxipng）
5. 输出 .png + 检查文件大小是否在预算内
```

### `validate_ir(ir, targets)`

直接调 `@wewatch/ir-schema`：
- `WatchFaceIRSchema.safeParse(ir)`
- `validateForTargets(ir, targets)`
- `validateProductionReadiness(ir)`

任一失败返回结构化错误。

### `moderation_check(content_type, payload)`

调 `Content Moderation Agent` 的 service：
- text → OpenAI Moderation + 阿里云盾（输出取严格的并集）
- image → CLIP-based safety classifier + 阿里云盾图像

输出 `{ passed: bool, categories: [...], confidence }`。

---

## 4. 缓存策略

### 缓存层

| 层 | 介质 | TTL | 命中即返 |
|---|---|---|---|
| L1 prompt → style_brief | Redis | 7d | ✅ |
| L2 style_brief → IR draft | Redis | 7d | ✅（含 seed） |
| L3 prompt → image | R2 + URL 索引 Redis | 30d | ✅（含 seed + model） |
| L4 IR → built .prg | 由 garmin-sdk-agent 管 | n/a | n/a |

cache key = `sha256(input_normalized + model + seed)`。

### 何时刷新缓存

- 模型版本升级（MODEL_CATALOG 改）
- IR Schema 升级
- 用户主动 `?force_regen=true`

---

## 5. 失败处理矩阵

| 失败位置 | 重试 | 降级 | 升级 |
|---|---|---|---|
| Prompt safety failed | ❌ | n/a | 直接告知用户 |
| Style brief LLM 失败 | ✅ × 1 | 用更小模型重试 | 升级 PM |
| IR LLM 失败 schema | ✅ × 2（明示错误给 LLM） | n/a | 升级 ERROR_PLAYBOOK |
| IR validateForTargets 全 reject | ❌ | 缩减 targets 重新提议 | 告知用户 |
| Image gen 超时 | ✅ × 1 | 降到更便宜模型 | DevOps |
| Image moderation rejected | ❌ | 重新生成（不同 seed × 1） | 告知用户 |
| post_process 异常 | ✅ × 1 | 降级到无 dithering | DevOps |
| 最终 moderation rejected | ❌ | n/a | 告知用户 + 平台审核 |

---

## 6. 反馈环（learning loop）

每个任务完成后：

1. **自评**（按 `QUALITY_RUBRIC.md`）：IR 复杂度、覆盖元素数、视觉一致性自评
2. **用户评分**（任务完成后 7 天内可对生成结果打 1-5 星）
3. **Garmin SDK 编译反馈**：编译失败 / 性能超预算 → 归因到 AI Pipeline 的输出
4. **数据流**：所有信号 → ClickHouse → 周/月 review

每月 PM Agent 发起 model review：是否需要换模型 / 调 prompt / 改 schema。

---

## 7. 多 region / 数据隔离

- 全球版：模型 API 走 Anthropic（US）+ Replicate / fal（US/EU）+ R2
- 中国版：模型 API 走 Qwen / 智谱（境内）+ 阿里云盾 + 阿里云 OSS
- **生成的 IR / 图像不跨境**——同一用户在不同 region 重复请求会跑两次（接受成本提升）
- **prompt 不跨境**——尤其 zh-CN locale 用户的 prompt 仅在境内处理

---

## 8. 监控指标（DevOps + Data Analyst Agent 接入）

| 指标 | 阈值 |
|---|---|
| 任务平均时长 | < 60s（不含编译） |
| 任务成功率 | ≥ 90% |
| 单任务成本 P95 | < $0.30 |
| moderation 调用 / 任务 | 2-3 次（输入 + 输出） |
| 缓存命中率 L1 | > 30% |
| 缓存命中率 L3 | > 15% |
| LLM 结构化输出失败率 | < 5% |

---

**版本**：0.1.0
**最后更新**：2026-04-26
