# IP & Safety · v0.1.0

> 这是 AI Pipeline Agent 的"红线清单"。任意一条违规 = 平台法律风险。
>
> **绝对原则**（呼应 PRINCIPLES P6 / P9 / P10）：宁可拒绝 100 个合法 prompt，也不放过 1 个违规生成。

---

## 1. 一级红线（绝不生成，无例外）

### 知识产权

- 任何商标 / Logo（Apple、Nike、Adidas、苹果、奔驰、Disney、米奇、Pokémon、皮卡丘、奥运五环、各国国旗党徽 等等）
- 任何商业角色（任天堂、暴雪、米哈游、漫威、DC、各种动漫主角）
- 任何注册商标的字体设计（Coca-Cola、可口可乐字体）
- 任何运动队标志（NBA / 中超 / 英超 / NFL）
- 任何公司或个人的注册角色

### 真人形象

- 已识别的真人脸（明星、政治人物、网红、所有真实人）
- 即使匿名"看起来像真人"的精细脸 → 拒绝
- 例外：完全风格化的人形剪影（无面孔细节）允许

### 政治 / 宗教

- 政治领导人（任何国家）
- 政治标语 / 旗帜
- 极端主义符号
- 宗教神像（佛像、十字架、新月、大卫之星等具像）—— 抽象符号若用户明示要可放（视市场）

### 暴力 / 不当

- 武器（枪、刀、爆炸物）
- 血腥
- 任何性暗示
- **儿童形象**（这是绝对零容忍：即使"不当含义"也不行）

### 欺诈 / 危险

- 仿冒已上架表盘的"高度相似"作品
- 看起来是 OS 系统提醒的（防钓鱼）
- 假心率 / 假数据（误导健康判断）

## 2. 二级警告（需要二次审核）

- "军队风" / "战术风"：允许，但不允许具体国家军徽 / 实际军装
- 宗教抽象元素（曼陀罗、阿拉伯纹饰）：允许，但不允许特定教派标识
- 复古 logo 风（不直接复制商标，但模仿"老式徽章"风格）：允许，但 ip-review 必须人工
- 地名 / 城市建筑：允许，但避免可识别的著名 landmarks（自由女神、东京塔、紫禁城建筑细节）
- "奥运" / "世界杯" 等赛事字眼：拒绝（IOC / FIFA 商标）

## 3. 实现：三层防御

```
[L1] Prompt-time moderation
  - 用户 prompt 经 OpenAI Moderation + 自有黑名单
  - block → 任务终止

[L2] Generation-time guardrails
  - 强制 prefix + negative prompt（见 IMAGE_GENERATION_RULES.md）
  - LLM 输出 IR 前必须经 prompts/moderation_self_check.md 自检（询问 LLM 是否违规）

[L3] Output-time moderation
  - 生成的图片：CLIP-based NSFW classifier + 自训练 IP classifier
  - 生成的 IR 文本字段：聚合 moderation
  - block → 任务失败
```

## 4. 黑名单维护

`packages/ai-safety-blacklist/`（与 ai-pipeline-agent 配套）：

```
data/
├── trademarks/         ← 自动从公开商标库爬取 + 人工筛选
├── characters/         ← 知名 IP 角色名
├── celebrities/        ← 知名真人名
├── religious_symbols/  
├── geopolitical/       
└── slang/              ← 各语种 NSFW 俚语
```

由 Legal Agent 季度更新；任何"漏过"事件强制更新对应词表。

## 5. 用户提示语（被拒时怎么说）

不告诉用户具体哪条 trigger（避免反向工程）。

通用模板（按 locale）：

```
中文：
"很抱歉，我们的 AI 助手无法基于这个描述生成表盘。可能是其中包含了
我们暂不支持的元素（例如品牌、人物、特定符号等）。你可以试试调整
描述（去掉具体名称、转用风格关键词），或者我们可以帮你从相似风格
中挑选其他设计。"

English:
"Sorry — we couldn't generate a watch face from this description. It
may contain elements we don't support (such as brand names, real
people, or specific symbols). Try adjusting the description (e.g. use
style keywords instead of specific names), or browse similar styles
in our gallery."
```

## 6. 用户申诉

如果用户认为误杀：
- 一键申诉按钮
- 进 Designer Relations / Customer Support 工单
- 人工审核 24h 内回复
- 误杀确认 → 加 prompt allow-list（按 hash） + 调整 moderation 阈值

## 7. 设计师上传作品的 IP 审核（与 AI 生成共享审核管线）

设计师手工上传的表盘也会经过 L3 防御。增加：

- 反向图像搜索（TinEye-like）查重 → 高 confidence 已存在 → 拒绝
- 商标 OCR 检测 → 含商标文字 → 拒绝
- "看起来像 X" 自动比对（perceptual hash）

由 Content Moderation Agent 维护。

## 8. 法律 escalation

任何"似乎合法但用户用法可疑"的边缘案例 → 立即升级 Legal Agent + Founder：

- 被注册商标方 takedown 通知
- 涉及肖像权 / 名誉权投诉
- 跨境合规边界（如某国/地区禁止某符号）

事件响应：
- 收到通知 → 24h 内人工 review
- 验证有效 → 立即下架 + 通知设计师 + 退款
- 7 天内 post-mortem

## 9. 记录

- 每个 block 决策都写 `moderation_log.json`，含 layer / category / confidence
- 每月统计：拦截率、误杀率（人工抽查）、漏过率（用户举报或主动审计）

---

**版本**：0.1.0
**最后更新**：2026-04-26
**下一次必须 review**：每季度 + Legal Agent 提议时
