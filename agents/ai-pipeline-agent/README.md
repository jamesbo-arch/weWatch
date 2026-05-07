# AI Pipeline Agent · 知识库与 Prompt 套件

> 本目录是 weWatch 平台 **AI Pipeline Agent** 的"大脑"。
>
> AI Pipeline Agent 是一个 **meta-agent**——它自己用 LLM 和图像生成模型把"用户/设计师的自然语言输入"翻译为合法的 IR JSON，并协调 Garmin SDK Agent 把 IR 编译为 `.prg`。
>
> 它是 weWatch 的核心差异化武器（PRINCIPLES P3："AI 是表盘的原生介质，不是营销噱头"）。同时也是**最容易把成本烧穿、最容易踩 IP 红线、最容易输出垃圾**的 Agent——所以它的约束设计比其他任何 Agent 都严格。

---

## 它解决两类问题

```
1. 「Generate from prompt」
   消费者侧：用户 prompt → 完整 IR + 可选图片资源 → 编译 → 安装
   订阅会员配额限制（Phase 3+）

2. 「Designer assist」
   设计师侧：设计师有半成品 IR，AI 提升某一部分
     - 配色建议
     - 布局变体
     - 多设备适配建议
     - 自动生成背景/装饰资源
     - 翻译并本地化命名
```

## 目录结构

```
agents/ai-pipeline-agent/
├── README.md
├── SYSTEM_PROMPT.md
├── ARCHITECTURE.md             ← 管线总览 + 三阶段 + 反馈环
├── PROMPT_TO_IR_PIPELINE.md    ← 用户 prompt → IR 的完整逐步流程
├── IMAGE_GENERATION_RULES.md   ← 图像生成 + Garmin 调色板/dithering 后处理
├── MODEL_CATALOG.md            ← 任务到模型的映射，含成本对比
├── COST_BUDGET.md              ← 用户/设计师/平台三层预算与配额
├── QUALITY_RUBRIC.md           ← IR 与图像的质量评分标准（自评 + 用户反馈）
├── IP_AND_SAFETY.md            ← 不可生成的内容清单 + 防御策略
├── ERROR_PLAYBOOK.md           ← 已知失败模式与对策
├── HOW_TO_BOOTSTRAP.md         ← 第一周上手
└── prompts/                    ← 内部 sub-prompt 模板（喂给底层 LLM）
    ├── ir_generation.md
    ├── ir_iteration.md
    ├── style_extraction.md
    ├── image_postprocess.md
    └── moderation_self_check.md
```

## 与其他 Agent 的握手

| 对方 Agent | 接口 | 何时握手 |
|---|---|---|
| Backend Agent | `POST /api/v1/ai/generate` 入口 + 任务队列 | 每个生成请求 |
| `@wewatch/ir-schema` | `WatchFaceIRSchema.parse()` + `validators.*` | 每次输出 IR 后必校验 |
| Garmin SDK Agent | 同 Garmin Agent 的输入契约（`task.json` + `ir.json`）| IR 校验通过后 |
| Content Moderation Agent | 生成前 prompt 检查 + 生成后内容检查 | 每次任务 |
| Data Analyst Agent | 上报每次任务的 quality / cost / latency | 异步 |
| Legal Agent | IP 边界规则的合规审议 | 季度 review |
| PM Agent | 模型升级、配额调整的 PRD | 升级时 |

## 使用方式

### 在 Cowork / Claude Agent SDK 中调用

1. system prompt = `SYSTEM_PROMPT.md` 全文
2. 知识库挂载：本目录 + `packages/ir-schema/` + `agents/garmin-sdk-agent/IR_SCHEMA.md` + `agents/garmin-sdk-agent/DEVICE_MATRIX.md`
3. 工具白名单：
   - `Read` / `Write` / `Edit`（仅限 `ai-jobs/<job_id>/`）
   - `WebFetch`（白名单：模型 API、developer.garmin.com、内容审核 API）
   - `Bash`（仅 `python3` `node` `imagemagick` 用于图像后处理）
   - 自定义工具：`generate_image(prompt, params)`、`call_llm(model, prompt, schema)`、`post_process_image(file, target_device)`
4. **不给**：直接 push、修改 schema、长期网络访问

### 输入契约

```json
{
  "job_id": "ai-job-2026-04-26-001",
  "type": "generate_from_prompt | iterate_on_ir | designer_assist",
  "actor": { "user_id": "usr_xxx" | "ds_xxx", "tier": "free|plus|pro|signed" },
  "input": {
    "prompt": "string",
    "base_ir": { ... 可选，iterate/assist 时给 ... },
    "style_refs": ["asset_id" | "url"],
    "constraints": {
      "shape": "round|square",
      "targets": ["fr255", "venu3", ...],
      "budget_credits": 5
    }
  },
  "moderation": { "prompt_passed": true, "details": "..." }
}
```

### 输出契约

```
ai-jobs/<job_id>/
├── generated_ir.json           ← 唯一最终交付
├── intermediate/
│   ├── style_brief.md          ← LLM 提取的风格简报
│   ├── ir_draft_v1.json        ← 初稿
│   ├── ir_draft_v2.json        ← 自检后修订
│   └── image_assets/           ← 生成图像
├── post_process_log.json
├── moderation_log.json
└── job_report.json             ← cost / latency / quality / next_actions
```

## 维护责任

- **Owner**：Founder + AI Pipeline Agent 自身
- **Reviewer**：PM Agent（PRD 同步）、Backend Agent（API 契约）、Content Moderation（IP_AND_SAFETY）
- **更新频率**：MODEL_CATALOG / COST_BUDGET 每月 review；其他季度

---

**版本**：0.1.0
**最后更新**：2026-04-26
