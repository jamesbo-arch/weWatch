# Model Catalog · v0.1.0

> 任务 → 模型的映射，含成本与质量权衡。每月由 Founder + AI Pipeline Agent + Data Analyst 联合 review 一次。
>
> 价格为 2026-04 估值，会变；以代码 `models.config.ts` 为准。

---

## 1. 文本类（LLM）

| 任务 | 主选 | 备选 | 单次约成本 | 备注 |
|---|---|---|---|---|
| Style brief extraction | `claude-sonnet-4-6` | `claude-haiku-4-5` | $0.005 | Sonnet 推理稳；Haiku 偶遗漏 must-have |
| IR generation (schema-constrained) | `claude-sonnet-4-6` | `claude-opus-4-6`（复杂 prompt）| $0.02 | Opus 在复杂多元素 IR 上质量更高，但成本 4× |
| IR iteration（小改） | `claude-haiku-4-5` | `claude-sonnet-4-6` | $0.002 | 任务受限，Haiku 足够 |
| Localization (meta.name 翻译) | `claude-haiku-4-5` | DeepL API | $0.001 | 短文本，Haiku 性价比最高 |
| Quality self-score | `claude-haiku-4-5` | `gpt-4o-mini` | $0.001 | 仅评分 |
| 中国境内 | `qwen2.5-72b-instruct`（自部署）| `glm-4`（智谱）| 按 GPU 摊销 | 数据不出境 |

**默认策略**：
- 80% 任务用 Sonnet
- 简单/重复任务用 Haiku
- 复杂或失败重试 → 升级 Opus（一次性，记入 cost）
- 中国 region 全部走 Qwen 自部署

## 2. 图像生成

| 用途 | 主选 | 备选 | 单图约成本 | 备注 |
|---|---|---|---|---|
| MIP 极简背景 | `flux-schnell` | `sdxl-v1` | $0.002 | 4-step Flux，速度快 |
| AMOLED 高保真背景 | `flux-dev` | `sdxl-v1` | $0.025 | 50-step Flux 或 SDXL refiner |
| 小图标 | `flux-schnell` | `sdxl-turbo` | $0.002 | 256×256 即可 |
| 中国境内 | 自部署 `sdxl-turbo` 或 `Stable Diffusion 3.5` | `通义万相` | GPU 摊销 | 数据不出境 |

**Pinned versions**：所有模型都 pin 具体 version hash，禁止 "latest"——避免上游静默更新破坏可重复性。

## 3. Moderation 模型

| 任务 | 主 | 备 | 备注 |
|---|---|---|---|
| Text moderation | OpenAI Moderation API | 阿里云盾文本 | 全球版用 OpenAI；中国版只走阿里 |
| Image NSFW | CLIP-based safety classifier（自部署） | 阿里云盾图像 | 自部署避免每张图付费 |
| IP / 商标识别 | 自训练 CNN + Reverse image search 抽样 | 人工兜底 | 高 confidence 直接 block，低 confidence 进人工 |

## 4. 选择规则（决策表）

### 任务对模型的快速规则

```
def pick_llm(task_type, complexity, cost_sensitive):
    if region == 'cn':
        return 'qwen2.5-72b'
    if task_type in ('localization', 'iteration_small', 'self_score'):
        return 'haiku-4-5'
    if task_type == 'ir_generation':
        if complexity == 'high' and not cost_sensitive:
            return 'opus-4-6'
        return 'sonnet-4-6'
    if task_type == 'style_brief':
        return 'sonnet-4-6'
    return 'sonnet-4-6'  # safe default
```

### 任务对图像模型的规则

```
def pick_image(target_max_resolution, display_kind, mood):
    if region == 'cn':
        return 'self-sdxl-turbo'
    if 'minimal' in mood and target_max_resolution <= 280:
        return 'flux-schnell'
    if display_kind == 'amoled' and target_max_resolution >= 390:
        return 'flux-dev'
    return 'flux-schnell'  # default
```

## 5. 成本上限保护

每次模型调用前 cost guard：

```
plan_cost = estimate(model, prompt_tokens, max_output_tokens)
if remaining_budget < plan_cost:
    if can_downgrade(model): use cheaper variant
    else: raise BudgetExceededError
```

每月平台总预算见 `COST_BUDGET.md`。

## 6. 升级流程

加新模型 / 替换模型必须：

1. 在 staging 跑回归测试集（10 fixed prompts × 3 seeds）
2. 自动 + 人工 review 质量分（与上一代对比）
3. 走 PRD（PM Agent）+ DECISION_LOG
4. 灰度（5% 流量 → 25% → 100%，每档 3 天）
5. 失败回滚条件：质量分下降 ≥ 5%，或 moderation 漏过率 ≥ 0.5pp

## 7. 当前 pinning

```yaml
# config/models.yaml （样例，实际由 DevOps 维护）
llm:
  claude-sonnet:
    provider: anthropic
    name: claude-sonnet-4-6
    version: '20260301'
  claude-haiku:
    provider: anthropic
    name: claude-haiku-4-5
    version: '20251001'
  qwen-cn:
    provider: self-hosted
    name: qwen2.5-72b-instruct
    weights_hash: 'sha256:abc...'

image:
  flux-schnell:
    provider: replicate
    model: 'black-forest-labs/flux-schnell'
    version: 'bf412f6...'
  flux-dev:
    provider: replicate
    model: 'black-forest-labs/flux-dev'
    version: '843b6e5...'

moderation:
  openai-text:
    provider: openai
    name: text-moderation-latest
```

---

**版本**：0.1.0
**最后更新**：2026-04-26
**下一次必须 review**：每月第一周
