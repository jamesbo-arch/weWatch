# 如何在第一周把 AI Pipeline Agent 跑起来

> 与其他 Agent 不同：本 Agent 真正"跑起来"前，**先确保下游能消费它的输出**——也就是 Garmin SDK Agent + IR Schema 包必须已经能跑。这本来就是顺序的根本逻辑。

---

## 前置条件（不满足就不要开工）

- [ ] `packages/ir-schema` 测试全过、`pnpm tsx examples/demo.ts` 可跑
- [ ] Garmin SDK Agent 能从给定 IR JSON 编译出 .prg
- [ ] Backend Agent 已搭起 `apps/api` 骨架（或至少有个 `_internal/credits` 模拟）
- [ ] 你已开 Anthropic API key + Replicate（或 fal） API key
- [ ] 设月度预算告警：Anthropic $300、Replicate $200

未达到 → 先回去做这些（详见各 Agent 的 HOW_TO_BOOTSTRAP）。

---

## Day 1：脚手架与配置

```
workers/ai-pipeline/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  ← worker 入口
│   ├── pipeline/
│   │   ├── step-01-cost.ts
│   │   ├── step-02-prompt-safety.ts
│   │   ├── step-03-style-brief.ts
│   │   ├── step-04-ir-generate.ts
│   │   ├── step-05-validate.ts
│   │   ├── step-06-asset-generate.ts
│   │   └── step-07-finalize.ts
│   ├── tools/
│   │   ├── call-llm.ts
│   │   ├── generate-image.ts
│   │   ├── post-process-image.ts
│   │   └── moderation.ts
│   ├── prompts/                  ← 与 agents/ai-pipeline-agent/prompts/ 同源（或 import）
│   ├── cost/
│   │   └── cost-guard.ts
│   ├── cache/
│   │   └── cache-key.ts
│   └── types.ts
├── tests/
└── tools-python/                 ← 图像后处理脚本
    └── post_process.py
```

依赖：

```bash
pnpm add @wewatch/ir-schema zod bullmq @anthropic-ai/sdk replicate sharp
pnpm add -D vitest tsx
```

## Day 2：实现 `call_llm` + Anthropic 集成

最小可工作版：

```ts
import Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callLlm<T extends z.ZodTypeAny>(opts: {
  model: 'claude-sonnet-4-6' | 'claude-haiku-4-5';
  prompt: string;
  schema?: T;
  seed?: number;
  maxTokens?: number;
}): Promise<z.infer<T>> {
  const resp = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4000,
    messages: [{ role: 'user', content: opts.prompt }],
  });
  const text = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('');

  if (opts.schema) {
    const json = extractJson(text);
    return opts.schema.parse(json);
  }
  return text as z.infer<T>;
}
```

跑一个 hello-world：手写 prompt + 强制 JSON 输出，schema 校验通过。

## Day 3：实现 Step 3-5（不生成图）

按 `PROMPT_TO_IR_PIPELINE.md` 实现：
- Step 3: style brief extraction
- Step 4: IR generation
- Step 5: validate + auto-fix

输入：硬编码一个测试 prompt（"赛博朋克风格，显示心率"）
输出：合法 IR JSON

不接 Backend、不接 queue，命令行跑通即可：

```bash
pnpm tsx workers/ai-pipeline/src/index.ts \
  --prompt "赛博朋克风格，显示心率" \
  --targets fr265,venu3 \
  --out tmp/test-job-001
```

成功标准：
- IR 通过 `WatchFaceIRSchema.parse`
- `validateForTargets` 至少 1 个 device accept
- 总成本 < $0.05

## Day 4：把输出接到 Garmin SDK Agent

把 Day 3 的 generated_ir.json 喂给 Garmin SDK Agent：

```bash
# 模拟调用 Garmin SDK Agent
cp tmp/test-job-001/generated_ir.json garmin-projects/test-001/ir.json
# 触发 Garmin SDK Agent 的 build pipeline
```

第一次 end-to-end：从中文 prompt → IR → .prg → 模拟器渲染。

如果模拟器渲染出来的表盘"看着像那么回事"——核心管线打通。

## Day 5：实现 Step 6（图像生成 + 后处理）

加图像背景：
1. 在 Step 4 让 LLM 决定 background.type = 'image'
2. 在 Step 6 调用 Replicate flux-schnell
3. Python 脚本做量化 + dither
4. 把生成的 PNG 路径注入 IR 的 image element / canvas.background

跑一次"暗色山林剪影"风格 prompt，端到端跑通。

## Day 6：Moderation 集成

接 OpenAI Moderation：
- Step 2 prompt 检查
- Step 7 输出聚合检查

跑一组测试 prompts：
- 5 个合法（应通过）
- 5 个明显违规（应被拦：含"米奇老鼠"、"打 Apple Logo" 等）

校准。

## Day 7：把 Agent 接到 Claude Agent SDK

1. 创建 `ai-pipeline-agent` subagent
2. system prompt = `agents/ai-pipeline-agent/SYSTEM_PROMPT.md`
3. 知识库挂载 + 工具白名单按 SYSTEM_PROMPT
4. 给 Agent 派一个真实任务：

```json
{
  "job_id": "ai-bootstrap-001",
  "type": "generate_from_prompt",
  "actor": { "user_id": "usr_test", "tier": "plus" },
  "input": {
    "prompt": "极简黑底，金色数字时间，只显示心率",
    "constraints": { "shape": "round", "targets": ["fr265","venu3"] }
  }
}
```

观察 Agent：
- 是否调用 `call_llm` / `generate_image` 而非自己"想象" IR
- 是否每步都校验
- 是否报告 cost
- 是否在失败时按 ERROR_PLAYBOOK 升级

---

## 第一周末成功标准

- ✅ 端到端 ≥ 3 个不同 prompt 跑通到 .prg
- ✅ 单任务平均成本 < $0.10
- ✅ IR schema 校验通过率 ≥ 80%
- ✅ Moderation 5/5 测试用例正确（合法 pass、违规 block）
- ✅ ERROR_PLAYBOOK 至少新增 2 条

如果某项未达 → **不要进入 Phase 3 的 AI 上线节奏**，回头补强。

---

## 第一周必须决定的事

- [ ] 主 LLM：Claude Sonnet 4.6（推荐）vs GPT-4o
- [ ] 图像主模型：Flux-schnell（推荐，快+便宜）vs SDXL
- [ ] Moderation：OpenAI（全球版）+ 阿里云盾（中国）双引擎
- [ ] Cache 介质：Upstash Redis（推荐）vs 自建
- [ ] 中国版策略：是否启用 AI 生成（建议 Phase 3+ 待 Qwen 自部署稳定再开）

---

**版本**：0.1.0
**最后更新**：2026-04-26
