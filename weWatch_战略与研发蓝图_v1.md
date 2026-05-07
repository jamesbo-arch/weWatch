# weWatch · 全球智能手表第三方表盘平台
## 战略与研发蓝图 v1.0

> **文档定位**：本文档是 weWatch 平台从 0 到 1 的完整作战手册，面向独立创业者（技术开发者/CTO 视角），用于指导后续每一步研发、组建 AI Subagents 团队、以及全球化上线。
>
> **首发硬件生态**：Garmin（开放体系，Connect IQ SDK）
> **首发市场**：中国大陆 + 欧美 + 东南亚同步（多语言 / 多币种）
> **当前阶段**：构想期，独立创业，资源极其有限 → 必须用 AI Subagents 团队作为核心生产力杠杆
>
> **本文档版本**：v1.0 · 2026-04-26

---

## 0. 执行摘要（TL;DR）

**做一句话定义**：weWatch 是一个跨厂商、设计师驱动的智能手表表盘交易与分发平台，先以 Garmin 为切口验证模式，后续扩展 Apple Watch / Wear OS / 华为 / 小米 / Amazfit。设计师上传作品，平台分账（建议初期 70/30，对标 App Store 当前规则）；消费者一站式发现、购买、推送到手表。

**为什么现在做**：
1. Garmin 的 Connect IQ Store 已经存在 10+ 年，但**仍是工程师审美**——发现性差、设计师变现路径不友好、内容质量参差、缺少社区与策展。这就是空白。
2. AI 生成式设计（Stable Diffusion / Flux / GPT 图像）让"参数化表盘"和"按用户偏好生成"第一次成为可能。
3. 全球穿戴设备保有量已超过 12 亿，且仍在 8-10% 年增长。表盘是这个生态里使用频率最高的"内容"——用户每天看 100+ 次。
4. AI Subagents 让单人/极小团队可以承担过去 20 人公司才能完成的工作量，这是创业方法论上的"窗口期红利"。

**为什么先做 Garmin**：
- 技术开放度最高：Connect IQ SDK 完全公开，Monkey C 语言，模拟器免费，无需"开发者协议"门槛。
- 商业开放度最高：允许第三方开发者自行收费、绑定外部账号系统、做 sideload（旁加载 .prg 文件）。
- 用户付费意愿强：Garmin 用户 ARPU 高于一般 Wear OS 用户，运动 / 户外 / 商务三大付费心智成熟。
- **竞争最弱**：Apple Watch 表盘几乎完全封闭（Apple 不开放第三方表盘 API，仅照片/拼贴），Wear OS 平台分散、Samsung 与 Google 政策摇摆。Garmin 是"既开放、又值得做"的唯一交集。

**核心可行性结论**：
| 维度 | 评分 (1-10) | 说明 |
|---|---|---|
| 技术可行性 | 9 | SDK 公开、生态成熟、零硬件依赖（先做 Web 平台 + sideload） |
| 市场可行性 | 7 | Garmin 单品类规模有限（约 2000 万年活跃用户），但作为 MVP 验证场景充分；扩展至全平台后市场天花板 5 亿+ 用户 |
| 商业可行性 | 7 | 表盘平均售价 $1-5，需要规模 + 订阅 + 设计师工具 SaaS 三轮驱动 |
| 合规可行性 | 6 | 中国 ICP 备案/内容审核 + 欧盟 GDPR + 跨境分账与税务最复杂，需提前布局 |
| 单人可执行性 | 8 | 在 AI Subagents 加持下，6-9 个月可上线 MVP |
| **综合** | **7.4** | **强烈建议推进**，但需严格按阶段验证，避免一上来全平台铺开 |

**6 个月 MVP 目标**（务实版）：
- 1500 个上架表盘（含 500 个签约设计师独家）
- 3000 名注册设计师，付费率 1-2%
- 50000 名注册用户，月活 15000，付费转化 3-5%
- 月 GMV $20K-50K（含订阅 + 单品 + 设计师订阅 SaaS）

---

## 1. 项目愿景与定位

### 1.1 三段定位

**短期（0-12 月）**：Garmin 生态最优秀的第三方表盘聚合 + 设计师变现平台。
**中期（12-24 月）**：跨平台（+ Wear OS、华为、小米、Amazfit）的设计师创作社区，类比"智能穿戴界的 Behance + Gumroad"。
**长期（24-48 月）**：AI 驱动的个性化表盘生成引擎 + 设计师 IP 经济体，每个用户拥有专属、随上下文（时间、地点、心率、日程）变化的"活表盘"。

### 1.2 三类核心用户

| 用户 | 核心需求 | 我们提供 |
|---|---|---|
| **设计师**（创作侧） | 变现、曝光、创作工具、跨平台一次发布 | 可视化编辑器、AI 辅助生成、自动多设备适配、透明分账、粉丝运营工具 |
| **消费者**（消费侧） | 美观、有趣、与个人生活强相关、安装简单 | 高质量策展、AI 推荐、一键推送到手表、订阅会员（无限换装） |
| **品牌方/IP方**（B 端） | 借表盘做品牌内容（运动品牌、电影、游戏、KOL） | 联名表盘、限量数字资产（NFT 可选）、营销分析后台 |

### 1.3 与 Garmin Connect IQ Store 的差异化（非常关键）

不能正面对抗官方商店。差异化必须立得住：

1. **策展 + 社区**：官方商店是"无序的搜索框"，我们做"有审美的瀑布流 + 设计师人设 + 主题合集"。
2. **设计师工具**：提供官方没有的可视化编辑器（拖拽生成 Monkey C 代码）、AI 辅助、批量多设备适配。
3. **会员订阅**：官方是单次买断，我们做"$3.99/月无限换装"——直接复用 Facer / Mr Time 已验证的模式。
4. **跨平台一次发布**：设计师在我们平台上传一次，自动适配 Garmin / Wear OS / 小米 / 华为（中长期）。
5. **AI 生成**：用户输入"赛博朋克 + 蓝色 + 显示心率和日历"→ 30 秒生成专属表盘。

> **风险提示**：Facer 已经做了类似事情多年，是最直接的对标与对手。我们的差异点必须是：**(a) 中国市场本土化（Facer 在中国体验差）+ (b) AI 原生（Facer 是渐进加 AI）+ (c) 跨厂商扩展速度（含国产品牌）**。

---

## 2. Garmin 生态深度分析

### 2.1 关键技术事实速查

| 项目 | 内容 |
|---|---|
| 开发 SDK | Connect IQ SDK（官方免费下载） |
| 开发语言 | Monkey C（Garmin 自研，类 Java/JS 语法，强类型） |
| IDE 支持 | VS Code 插件（官方）、模拟器内置 |
| App 类型 | Watch Face / Widget / Data Field / Watch App / Audio Content Provider / Device App |
| 分发渠道 | Connect IQ Store（官方）+ 第三方 sideload（.prg 文件，通过 USB 或 Garmin Express 推送）+ Garmin Connect Mobile App 推送 |
| 收费方式 | 免费 / 一次性付费 / 应用内购买 / 订阅（Garmin 抽成 30%，与 Apple 一致） |
| 支持设备数 | 200+ 在售型号，含 fenix / Forerunner / Venu / Vivoactive / Edge 等 |
| 屏幕规格 | MIP / AMOLED 两类，分辨率从 176×176 到 454×454 不等 → **多尺寸适配是核心工程难题** |

### 2.2 第三方平台的合法性

**Garmin 官方对第三方平台是默许甚至欢迎的**——这是与 Apple 最大的不同。证据：
- Connect IQ SDK 没有限制开发者必须通过 Connect IQ Store 分发。
- Sideload 路径完全合法、官方文档说明。
- Facer、Mr Time 等第三方平台已存在多年未被打压。

但需注意：
- 不能宣称"官方授权"——必须明确"独立第三方平台"。
- 不能逆向 Garmin 协议，只能使用公开 SDK。
- 用户的 Garmin Connect 账号关联，需通过官方 OAuth（已开放）。

### 2.3 用户画像（决定产品调性）

Garmin 用户与 Apple Watch 用户审美与需求差异巨大：
- **运动型**（占比~50%）：跑者、骑行者、铁三、户外。需要心率、配速、海拔、地图等数据字段，配色偏功能性。
- **户外/军用风**（~25%）：fenix / Tactix / Instinct 用户。喜欢复古机械、地形、战术风格。
- **商务/腕表风**（~15%）：MARQ / Venu。喜欢经典指针、奢华材质模拟。
- **科技极客**（~10%）：早期采用者，愿意尝试 AI、动态、互动表盘。

→ MVP 阶段产品调性建议：**优先服务"运动 + 户外"两大刚需人群**，后续再覆盖其他。

---

## 3. 可行性评估（深度版）

### 3.1 市场可行性

**市场规模估算**（Bottom-up）：
- Garmin 全球年活跃用户：~2000 万（基于 Garmin Connect MAU 公开估算）
- 表盘活跃用户占比：~40%（保守估计，运动用户重数据轻装饰）→ 800 万潜在用户
- 平台获客天花板（3 年内）：5-10%，即 40-80 万
- ARPU（年）：含订阅与单品，估算 $8-15 → **年 GMV 天花板 $300-1200 万**（仅 Garmin）

→ 单 Garmin 不足以支撑独角兽叙事，但足以支撑一个**年营收 $1-3M、5 人小团队的健康业务**。这是 MVP 的合理目标。

**真正的市场天花板**在跨平台扩展后：
- Wear OS：约 1.2 亿设备
- Apple Watch：3 亿+（但表盘封闭，只能做"灵感+图片导出"）
- 中国厂商（华为/小米/OPPO/Amazfit）：3 亿+ 设备，表盘生态正在快速开放

### 3.2 技术可行性

**核心技术栈不存在"做不到"的部分**，但有几个工程难点必须正视：

1. **多分辨率/多形状适配**：Garmin 200+ 设备，分辨率与形状各异。一个表盘要覆盖主流型号，需要参数化资源系统。**对策**：MVP 先支持 Top 30 设备（覆盖 80% 用户），用编译时模板生成多版本 .prg。

2. **可视化编辑器 → Monkey C 代码生成**：这是设计师工具的核心。技术路径：用 Web Canvas（Konva.js / Fabric.js）+ 自研中间表示（IR JSON）+ Monkey C 代码生成器。**类比**：Facer 的 Creator 已验证此路径。

3. **AI 生成图像 → 表盘资源**：不能直接用 Stable Diffusion 输出当背景，需要后处理（抠图、压缩到 Garmin 调色板、低色深量化）。

4. **Sideload 体验差**：Garmin 没有像 Apple 那样的"远程安装"，需要用户用手机 Garmin Connect Mobile 安装（需将 .prg 上传至 Connect IQ Store 通道，或通过 USB 拷贝）。**对策**：MVP 阶段所有付费表盘都通过官方 Connect IQ Store 上架（接受 30% 分成换取顺滑安装），免费/订阅会员表盘可走自有通道。

### 3.3 商业可行性

**收入结构建议（24 个月）**：
| 收入流 | 占比 | 说明 |
|---|---|---|
| C 端订阅（$3.99/月，无限换装） | 45% | 主力，类比 Facer Premium |
| C 端单品购买（$0.99-9.99） | 25% | 长尾，独家爆款 |
| 设计师工具 SaaS（Pro 版 $9.99/月） | 15% | 含 AI 配额、商业授权、批量适配 |
| 品牌联名 / B 端定制 | 10% | 高客单价，毛利极高 |
| 广告 / 推荐位（设计师付费推广） | 5% | 后期开放 |

**单位经济（Unit Economics）**：
- 平均付费用户 LTV：$45（订阅平均 11 个月）
- CAC（早期内容驱动 + 设计师自带流量）：目标 $5-10
- LTV/CAC 目标：>4，第 18 月达成

### 3.4 合规可行性

| 市场 | 关键合规事项 | 难度 |
|---|---|---|
| 中国大陆 | ICP 备案、网信办内容审核（生成式 AI 备案）、用户实名制、跨境数据合规、增值税发票 | 高 |
| 欧盟 | GDPR、Cookie 同意、设计师 VAT 发票、DSA（数字服务法）内容投诉机制 | 中 |
| 美国 | 各州隐私法（CCPA 等）、设计师 1099-K 税表、Sales Tax | 中 |
| 东南亚 | 印尼/越南 KYC、新加坡 GST、本地支付通道 | 中 |

→ **建议**：注册主体放新加坡（或香港），用 Stripe Connect 处理设计师全球分账，中国大陆通过单独的境内主体（北京或杭州）做 ICP+本土支付，数据隔离。详见 §8。

### 3.5 单人可执行性（最关键）

在没有 AI Subagents 时，这种平台至少需要：
- 1 PM + 2 后端 + 2 前端 + 1 移动端 + 1 嵌入式 + 1 设计 + 1 运维 + 1 增长 + 1 客服 = 11 人
- 12 个月烧钱：~ $1.5-2M

**有 AI Subagents 时**（Claude Sonnet 4.6 / Opus 4.6 + Codex 等）：
- 单人创业者 + 1 名兼职设计协作 + 5-6 个 AI subagent 长期运行
- 12 个月成本：~ $30-50K（含 LLM API、云服务、合规、工具订阅）
- 时间成本：MVP 6-9 个月

→ 这正是 weWatch 真正可行的关键。详见 §6。

---

## 4. 技术架构设计

### 4.1 系统架构总览

```
┌──────────────────────────────────────────────────────────────┐
│                  消费者端（Web + iOS/Android App）              │
│  Next.js 14 / React Native / 一键推送至 Garmin Connect Mobile  │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│                 设计师端（Web 创作器 + 设计师后台）              │
│  Konva.js 可视化编辑器 → IR(JSON) → Monkey C 代码生成器        │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│                       API Gateway 层                           │
│         Cloudflare Workers / NestJS BFF / 限流 + 鉴权          │
└──────────────────────────────────────────────────────────────┘
   │              │              │              │           │
┌──────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌────────┐
│ 用户 │    │ 表盘内容 │   │ 编译服务 │   │ 支付分账 │  │ AI 生成 │
│ 服务 │    │   服务   │   │ (Monkey C │   │ Stripe + │  │  服务   │
│      │    │          │   │ 编译矩阵) │   │  本土通道 │  │         │
└──────┘    └──────────┘   └──────────┘   └──────────┘  └────────┘
   │              │              │              │           │
┌──────────────────────────────────────────────────────────────┐
│         数据层：Postgres (主库) + Redis (缓存) + R2 (对象存储)   │
│         + Meilisearch (搜索) + ClickHouse (分析)               │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│           Garmin 集成：Connect IQ OAuth + Store 上架管道         │
│           SDK 编译矩阵：Monkey C Compiler in Docker             │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 推荐技术栈（务实优先，避免炫技）

| 层 | 选型 | 理由 |
|---|---|---|
| 前端（Web） | Next.js 14 + TypeScript + Tailwind + shadcn/ui | App Router、SSR/ISR 强、SEO 好、生态成熟 |
| 移动端 | React Native + Expo | 一套代码 iOS/Android，与 Web 共享逻辑 |
| 可视化编辑器 | Konva.js 或 Fabric.js | Canvas 性能好、社区成熟 |
| BFF / API | NestJS（Node 20）或 Hono on Cloudflare Workers | TS 全栈、AI 友好（subagent 写得溜）|
| 数据库 | PostgreSQL 16 + Drizzle ORM | 关系型 + JSONB 灵活、迁移可控 |
| 缓存 | Redis (Upstash) | 全球边缘 |
| 对象存储 | Cloudflare R2 | 零出口费用、对中国访问优化 |
| CDN / 边缘 | Cloudflare | 全球节点、Workers 强 |
| 搜索 | Meilisearch（自托管）或 Typesense | 比 Algolia 便宜，多语言友好 |
| 分析 | PostHog（自托管） + ClickHouse | 隐私友好、可控成本 |
| 鉴权 | Lucia Auth 或 Clerk | Lucia 自控 / Clerk 省事 |
| 支付 | Stripe Connect（全球） + 微信/支付宝（中国境内主体）| 双轨制 |
| 监控 | Sentry + BetterStack + Grafana Cloud | 错误 + 可用性 + 指标 |
| CI/CD | GitHub Actions + Turborepo | Monorepo 友好 |
| 部署 | Vercel（Web） + Fly.io / Railway（API） + 阿里云杭州（中国节点） | 三地多活 |
| 容器化 | Docker + Docker Compose（开发） + Cloud Run（生产） | 简单可控 |
| Garmin 编译 | Monkey C SDK in Docker，CI 矩阵编译多设备版本 | 自研编译流水线 |
| AI 生成 | Replicate / fal.ai（图像）+ Claude 4.6（文本/代码）+ 自部署 SDXL（成本控）| 混合策略 |

### 4.3 数据模型核心实体（简化）

```
User (id, email, locale, tier, garmin_oauth, ...)
Designer (user_id, brand_name, payout_method, kyc_status, share_pct, ...)
WatchFace (id, designer_id, ir_json, meta, status, price, devices[], ...)
Build (face_id, device_id, sdk_version, prg_url, status, ...)
Purchase (user_id, face_id, type [single|sub|gift], amount, currency, ...)
Subscription (user_id, plan, status, period_end, ...)
Payout (designer_id, period, gross, share, fees, net, status, ...)
Asset (id, type [bg|font|complication], owner_id, license, ...)
Review / Like / Collection / Tag / Featured / ...
```

→ 设计原则：**所有内容创作过程产物（IR JSON）都存版本化历史**，方便后续 AI 学习与回溯。

### 4.4 关键技术风险与对策

| 风险 | 对策 |
|---|---|
| Monkey C 编译耗时（200 设备 × 多版本） | CI 矩阵 + 编译产物缓存 + 仅在 IR 变更时增量编译 |
| AI 生成图像与 Garmin 调色板不匹配 | 后处理 pipeline：抠图 → 量化 → dither → 设备特定优化 |
| Sideload 用户体验差 | 强制走 Connect IQ Store 官方上架（接受 30% 分成）作为默认通道 |
| 跨境分账 + 税务 | Stripe Connect Express 账户 + Lemon Squeezy 备选（Merchant of Record 模式可省事） |
| 中国境内合规 | 单独主体 + 单独域名 + 单独数据库 + 内容审核服务（阿里云盾或网易易盾） |

---

## 5. 开发阶段路线图

> **设计原则**：每个阶段都要回答"上线后能否产生真实收入或真实留存指标"。不为做而做。

### Phase 0：调研与原型（第 1-6 周）

**目标**：把假设全部跑通，避免在错误方向上烧 6 个月。

交付物：
- Connect IQ SDK 跑通：在模拟器和一台真实 Garmin（建议 Forerunner 255 或 Venu 3，性价比高）上成功运行 Hello-World 表盘。
- 5 个手工制作的 Demo 表盘上传至自己的 Connect IQ Store 开发者账号，跑通收费 + 分成流程。
- 与 5-10 名 Garmin 现役用户做深度访谈（Reddit r/Garmin、Garmin Forums、国内 Keep / 行者圈寻找），验证付费意愿。
- 与 5-10 名现有第三方表盘设计师（Facer 上活跃设计师）访谈，理解他们的痛点。
- 完成竞品深度拆解报告（Facer / Mr Time / Watchmaker / Pujie Black）。
- 法律侧：注册新加坡公司（推荐）+ 中国境内主体的可行性预研。

成功标准：
- 70%+ 受访用户表示愿意为优质表盘付费 $2-5。
- 60%+ 受访设计师表示愿意尝试新平台。

### Phase 1：MVP（第 7-22 周，约 4 个月）

**目标**：做出能上线、能收到第一笔钱、能让设计师入驻的最小闭环。

核心功能：
- 设计师入驻：邮件注册 + KYC + Stripe Connect 绑定。
- 表盘上传：手动上传 .prg 文件 + 元数据（暂不做编辑器）。
- 浏览与购买：瀑布流 + 标签 + 简单搜索 + Stripe 单品支付。
- 安装引导：详细教程（手机+电脑两路径）+ 自动化跳转至 Connect IQ Store（同步上架）。
- 设计师后台：销售看板、提现、版本管理。
- 平台后台：内容审核、上架/下架、分账。
- 多语言：中英两语优先，日韩泰跟进。
- 多币种：基于 Stripe 自动转换。

不做：
- 可视化编辑器（Phase 2）
- AI 生成（Phase 3）
- 订阅会员（Phase 2）
- Wear OS / 华为（Phase 4）

成功标准（上线后 60 天）：
- 200+ 上架表盘 / 100+ 注册设计师 / 5000+ 注册用户 / 月 GMV $3K+

### Phase 2：设计师工具 + 订阅（第 23-36 周，约 3-4 个月）

**目标**：建立护城河——让设计师离不开、让消费者一直续订。

核心功能：
- **可视化编辑器 v1**：拖拽组件（指针、刻度、复杂功能 complication、背景图）→ 导出 IR → 后端生成 Monkey C → 编译为 .prg。
- **多设备一键适配**：上传一次，自动生成 Top 30 设备的版本。
- **订阅会员**：$3.99/月或 $29.99/年，订阅期内任意切换表盘。
- **设计师 Pro**：$9.99/月，含编辑器高级模板、商业素材授权、销售分析、批量管理。
- **社区雏形**：关注、点赞、评论、设计师主页装修。
- **审核工作流**：自动 + 人工双层审核。

成功标准：
- 月活设计师 500+ / 月新增表盘 300+ / 订阅用户 1500+ / 月 GMV $15K+

### Phase 3：AI 原生 + 国际化深化（第 37-52 周，约 3-4 个月）

核心功能：
- **AI 生成表盘 v1**：用户输入 prompt（"赛博朋克 + 显示心率"）→ 后端 SDXL/Flux + 自动构图 → 生成 IR → 编译 .prg。免费用户每月 3 次，订阅会员无限。
- **AI 辅助创作（设计师侧）**：背景生成、配色推荐、自动适配多分辨率。
- **个性化推荐**：基于用户活动数据 + 浏览行为 + 设备型号。
- **品牌联名工作流**：B 端后台、版税自动结算。
- **本地化深化**：中国大陆主体上线（ICP 备案完成），微信小程序入口，本地支付。

成功标准：
- 月活用户 50000+ / 订阅用户 6000+ / 月 GMV $80K+ / 现金流转正或接近转正

### Phase 4：跨平台扩展（第二年起）

按优先级：
1. **小米 / Amazfit**（Zepp OS 表盘 SDK 已开放，国产中坚）
2. **华为**（HarmonyOS Wearable 表盘开发已开放，需注册华为开发者）
3. **Wear OS**（Watch Face Format 已规范化，Google 推得很积极）
4. **Apple Watch**（仅做"灵感导出"——壁纸 + 拼贴照片表盘，绕过封闭限制）

---

## 6. AI Subagents 团队架构（核心创新）

> **理念**：把"一个软件公司"拆成 15-20 个职能 Agent，每个 Agent 都有清晰的角色卡、工具集、输入输出规范、性能指标。你（创始人）作为"产品总指挥 + AI 团队调度者"，每天决策方向、审核关键产出，把执行 80% 交给 Agent。

### 6.1 团队组织图

```
                    ┌──────────────────────┐
                    │  你（Founder/CEO）   │
                    │  产品方向 + 关键决策   │
                    └──────────┬────────────┘
                               │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐         ┌─────▼─────┐
   │ 产品组   │          │  研发组    │         │  运营组    │
   └─────────┘          └───────────┘         └───────────┘
   - PM Agent            - Backend Agent        - Growth Agent
   - UX Agent            - Frontend Agent       - Content Mod Agent
   - User Research       - Mobile Agent         - Designer Relations
                         - Garmin SDK Agent     - Customer Support
                         - DevOps Agent         - Localization Agent
                         - QA Agent             - Data Analyst Agent
                         - Security Agent       - Legal/Compliance
                         - AI Pipeline Agent
```

### 6.2 详细 Agent 角色卡（Top 15）

每个 Agent 都应在 Claude Agent SDK 或 Cowork Subagent 里建立独立的 system prompt + 工具集 + 知识库（项目 docs + 历史决策 + 代码片段）。

| # | Agent 名称 | 核心职责 | 输入 | 输出 | 工具/MCP | 触发频率 |
|---|---|---|---|---|---|---|
| 1 | **PM Agent** | 拆解需求为 user story、维护 Roadmap、对齐各 Agent | 你的口头/文字想法、用户反馈 | PRD、JIRA-style ticket、验收标准 | Notion/Linear MCP、文档读写 | 每周 2-3 次 |
| 2 | **UX Agent** | 信息架构、Wireframe、可用性走查 | PRD、竞品截图 | Figma/Excalidraw 草图、组件清单、可用性问题列表 | Figma MCP、截图分析 | 每个新模块 1 次 |
| 3 | **Backend Agent** | NestJS API、数据库 schema、业务逻辑 | PRD + UX 输出 | TypeScript 代码、Drizzle migration、API doc | Git、数据库、Sentry | 持续 |
| 4 | **Frontend Agent** | Next.js 页面、组件、状态管理 | UX 输出 + API 契约 | React 组件、E2E 测试 | Git、Storybook、Playwright | 持续 |
| 5 | **Mobile Agent** | RN/Expo App、与手表的 BLE/USB 交互辅助 | 同上 | RN 代码、原生模块封装 | Git、EAS Build | Phase 1 中后期 |
| 6 | **Garmin SDK Agent**（核心专家）| Monkey C 代码生成、IR→Code 编译器、SDK 升级追踪 | 设计 IR、设备目标列表 | .mc 文件、jungle 配置、.prg 产物 | Monkey C SDK in Docker、Garmin 模拟器 | 每次表盘构建 |
| 7 | **DevOps Agent** | CI/CD、基础设施 IaC、监控告警 | 系统架构 | Terraform / GitHub Actions / Helm | AWS/GCP/CF MCP、Grafana | 持续 |
| 8 | **QA Agent** | 单元测试 + E2E + 回归 + 在真机验证（远程） | 代码 PR | 测试报告、bug ticket | Playwright、Vitest、TestFlight | 每个 PR |
| 9 | **Security Agent** | 代码审计、依赖漏洞、合规自检 | 代码、架构、合规清单 | 安全报告、修复 PR | Snyk、Semgrep、CodeQL | 每周 + 每次发版 |
| 10 | **AI Pipeline Agent** | 生成式管线（图像→IR→Monkey C）、模型选型 | 用户 prompt、设计师参数 | 图像、IR、构建产物 | Replicate/fal、SDXL 自部署 | Phase 3 起 |
| 11 | **Growth Agent** | SEO、内容营销、Reddit/小红书内容、ASO | 产品现状、竞品情报 | 内容日历、邮件序列、广告创意 | Twitter/X MCP、Reddit、Buffer | 持续 |
| 12 | **Content Moderation Agent** | 表盘内容审核（版权、暴力、敏感）| 待审表盘 | 审核结论 + 理由 | OpenAI Moderation、阿里云盾、人工兜底队列 | 实时 |
| 13 | **Designer Relations Agent** | 设计师入驻引导、答疑、活动策划 | 设计师反馈、申请 | 入驻流程、问答、激励方案 | Slack/Discord MCP、邮件 | 每日 |
| 14 | **Customer Support Agent** | 用户工单、退款、安装故障排查 | 用户工单 | 答复、升级、知识库新增 | Zendesk/Crisp MCP | 实时 |
| 15 | **Legal/Compliance Agent** | 多市场合规追踪、ToS/Privacy 维护、税务问答 | 法规更新、用户/设计师所在地 | 合规清单、文书更新 | 法规数据库、网络搜索 | 每月 + 触发式 |
| 16 | **Data Analyst Agent** | 看板、北极星指标追踪、A/B 实验设计与分析 | 事件流、销售数据 | 周报、实验报告、洞察 | PostHog、ClickHouse、Metabase | 每周 |
| 17 | **Localization Agent** | 多语言翻译 + 文化适配（不只是字面翻译） | 待翻译文案 | 多语言 JSON、文化注解 | DeepL、Lokalise | 持续 |
| 18 | **User Research Agent** | 访谈脚本、问卷设计、定性分析 | 访谈录音/文字 | 用户画像更新、JTBD 报告 | 录音转录、Dovetail | 每月 |

### 6.3 协作机制（必须落地）

仅有角色定义还不够，必须解决**Agent 之间的握手**：

1. **共享知识库**：所有 Agent 共享一个 Markdown 仓库（建议 GitHub 私有仓库），包含：
   - `/docs/prd/`（PM Agent 写）
   - `/docs/architecture/`（Backend + DevOps 维护）
   - `/docs/decisions/`（ADR 架构决策记录）
   - `/docs/playbooks/`（每个 Agent 的操作手册）
   - `/docs/learnings/`（你每周回顾后沉淀的"教训"——下次同样错误不再犯）

2. **任务编排**：用 TaskCreate / TaskList（Cowork 内置）或 Linear MCP 做"工单墙"，所有 Agent 从同一个池子领任务。

3. **Definition of Done**：每类任务都有明确 DoD。例如 Backend Agent 的"API 完成" = (a) 通过 QA Agent 单测 (b) 通过 Security Agent 扫描 (c) PM Agent 验收 (d) 文档同步 (e) 监控告警接好。

4. **每日"晨会"**（你触发）：让 PM Agent 汇总昨日完成 + 今日待办 + 风险，10 分钟内你审核。

5. **关键节点强制人工卡位**：合规、定价、品牌联名、退款政策、隐私条款——必须你拍板，不允许 Agent 自动决策。

### 6.4 Subagent System Prompt 模板（举例：Garmin SDK Agent）

```
你是 weWatch 平台的 Garmin SDK 资深工程师 Agent。

【知识储备】
- Connect IQ SDK 7.x 完整 API（已索引于 /docs/garmin-sdk/）
- Monkey C 语言规范 + 性能最佳实践
- 200+ Garmin 设备的 capability matrix（已索引于 /data/devices.json）
- 公司编码规范 /docs/playbooks/garmin-coding-style.md

【工具】
- Bash（运行 monkeyc 编译器、模拟器）
- Read/Write/Edit（代码与配置）
- Git（提交 PR）
- WebFetch（查阅 Garmin Developer Forum / Stack Overflow）

【输入契约】
你接收一个 IR JSON 文件（schema 见 /docs/architecture/ir-schema.md），描述：
- 表盘布局（指针、刻度、文本、图片、complication 槽位）
- 配色与字体
- 目标设备列表

【输出契约】
你输出：
- 一个 Monkey C 项目目录（含 manifest.xml、jungle 配置、resources/、source/）
- 编译产生的多设备 .prg 文件
- 一份"适配报告"：每个目标设备的截图（来自模拟器）+ 已知限制

【DoD】
- 所有目标设备模拟器渲染通过
- 内存占用 < 设备上限的 70%
- 无 lint warning
- 提交 PR 并 @QA Agent

【禁忌】
- 不得使用未公开 API
- 不得假设设备具备未声明的 capability
- 不得直接修改主分支，必须走 PR

【升级路径】
若遇到 SDK bug，整理最小复现案例，发到 /docs/upstream-issues/ 并通知 PM Agent。
```

类似模板需为每个 Agent 撰写一份。**这是 weWatch 的真正核心资产**——团队的"大脑"。

### 6.5 你（创始人）每天的工作分布建议

| 工作 | 占比 | 说明 |
|---|---|---|
| 战略与方向 | 20% | 与用户对话、看竞品、调整路线图 |
| Agent 调度与审核 | 30% | 看每日汇总、批准关键 PR、审定关键决策 |
| 用户/设计师沟通 | 20% | 不可代理。必须自己跟头 50 个种子用户/设计师建立强关系 |
| 招商/品牌/合作 | 15% | 不可代理。商务决策 |
| 自我学习与休息 | 15% | 必须保证。否则 9 个月后崩溃 |

---

## 7. 商业模式与收益分配

### 7.1 分账规则（建议初期方案）

| 收入类型 | 设计师分成 | 平台分成 | 备注 |
|---|---|---|---|
| 单品售卖 | 70% | 30% | 对标 App Store 当前规则 |
| 订阅收入（按表盘当月被使用时长加权分配） | 50% 总池给设计师 | 50% 总池给平台 | 加权算法须透明可查 |
| 品牌联名 | 30-60%（视谈判） | 平台收 平台费 + 抽成 | 一事一议 |
| AI 生成（基于设计师素材二次生成） | 设计师 30%（IP 贡献分） + 用户付费的 70% 给平台 | | 复杂，需要 IP 认证机制 |

**透明性原则**：每个设计师后台必须能看到每一笔收入的来源、加权计算、汇率、扣费明细。**这是与 Connect IQ Store 最大的差异点**——后者对设计师不透明。

### 7.2 设计师激励层级

- **新人**（入驻 0-90 天）：第一个月平台费减半，免费提供基础编辑器与 5 张 AI 配额。
- **认证设计师**（销售额 > $500/月 或 粉丝 > 1000）：可申请独家发布、分账提升至 75%、获得策展位支持。
- **签约设计师**（年销售 > $10K）：1v1 设计师经纪、品牌联名优先权、85% 分成或保底 + 分成。

### 7.3 消费者会员

| 档位 | 价格 | 权益 |
|---|---|---|
| 免费 | $0 | 浏览、下载免费表盘、每月 1 次切换付费表盘试用 |
| Plus | $3.99/月 / $29.99/年 | 无限切换所有付费表盘、AI 生成 30 次/月 |
| Pro | $7.99/月 / $59.99/年 | + 独家表盘、抢鲜尝试新平台（华为/小米/Wear OS）、AI 生成 200 次/月 |

---

## 8. 全球部署策略

### 8.1 多主体架构（必须）

```
新加坡总部主体（weWatch Pte. Ltd.）
   ├── 全球用户（除中国大陆外）服务
   ├── Stripe Connect 全球分账
   ├── 数据存储：Cloudflare（全球） + AWS Singapore（主） + AWS US-East（备）
   ├── 域名：wewatch.app / wewatch.io
   └── 适用法律：新加坡 PDPA、欧盟 GDPR、美国各州法
   
中国大陆主体（weWatch 北京/杭州科技有限公司）
   ├── 中国大陆用户服务
   ├── 微信支付/支付宝
   ├── 数据存储：阿里云杭州/北京（境内）
   ├── 域名：wewatch.cn（必须 ICP 备案）
   ├── 内容审核：阿里云盾 + 人工
   └── 适用法律：网信办《生成式 AI 服务管理办法》、个人信息保护法
   
两主体之间：**仅同步设计师作品（经设计师授权 + 内容审核通过后）**，不同步用户行为数据。
```

### 8.2 上线节奏（务实）

| 时间 | 中国大陆 | 欧美 | 东南亚 |
|---|---|---|---|
| Phase 1 上线（M6） | 暂不上线（备案中） | ✅ 上线 wewatch.app | ✅ 共用全球版 |
| Phase 2（M10） | 开放小程序灰度 | ✅ 全功能 | ✅ 加印尼/泰/越语 |
| Phase 3（M14） | ✅ 完整上线 wewatch.cn | ✅ Apple Watch 灵感模式 | ✅ 本地支付（GoPay 等） |

### 8.3 本地化超越翻译

- **中国**：表盘审美偏向"赛博/水墨/国潮"，需要专属策展。微信生态深度集成。设计师可关联国内身份证 KYC。
- **欧美**：审美偏向"极简/复古/科技"，需要 Reddit / 小型社区运营。设计师以个人品牌驱动。
- **东南亚**：价格敏感，订阅档位需调整（区域定价 50%-70%）。本地支付通道（印尼 OVO/GoPay、泰 PromptPay 等）。

### 8.4 内容审核与法律红线

特别关注：
- 任何包含商标（Apple/Nike 标志、运动队徽、动漫角色）的表盘 → 默认拒绝，除非有授权证明。
- 政治敏感符号：分市场审核（中国与全球规则不同）。
- 成人擦边内容：全平台禁止。
- AI 生成的真人肖像 → 默认拒绝。

---

## 9. 风险评估与对策矩阵

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| Garmin 改变 SDK 政策（封禁第三方） | 低 | 致命 | 提前布局多平台；与 Garmin 开发者关系组建立联系 |
| Facer 等竞品快速跟进 AI 功能 | 高 | 中 | 我们的差异是中国市场 + 跨厂商，靠速度与本土化建壁垒 |
| 中国 ICP 备案被拒 / 周期长 | 中 | 高 | 不依赖中国市场作为 MVP；境外主体先跑，中国走小程序绕过 |
| 跨境支付与税务复杂度超预期 | 高 | 中 | 早期用 Lemon Squeezy 等 MoR 服务先跑，规模上来再切自营 |
| 设计师早期供给不足（冷启动失败） | 高 | 高 | 创始人亲自挖 100 个种子设计师；提供首批"保底分成"激励 |
| AI 生成表盘版权纠纷 | 中 | 中 | AI 训练数据来源透明披露；用户协议明确 AI 生成产物归属 |
| LLM API 成本失控 | 中 | 中 | Agent 调用做预算控制；非关键任务用 Haiku/小模型；缓存重用 |
| 单人创始人精力崩盘 | 高 | 致命 | 严格拆分"必须自己做"vs"Agent 做"；前 6 个月不招正式员工，第 7 月起招第 1 个核心合伙人 |
| 监管变化（如生成式 AI 备案收紧） | 中 | 中 | Legal Agent 持续追踪，每月给你简报 |

---

## 10. 第一个 30 天行动清单

> **原则**：不要先写一行业务代码。先把"假设验证"和"基础设施"打牢。

### Week 1：调研 + 基建
- [ ] 注册 Garmin Developer 账号，下载 Connect IQ SDK 7.x
- [ ] 购买一台 Garmin 设备（推荐 Forerunner 255 / Venu 3，¥2000-3000）
- [ ] 在 VS Code 跑通 Hello-World 表盘，模拟器 + 真机各验证一次
- [ ] 注册 Anthropic API + 设置预算告警（建议月预算上限 $300 起）
- [ ] 注册 GitHub Org（weWatch），开 6 个核心仓库的雏形（docs/web/api/sdk-bridge/admin/playbooks）
- [ ] 创建本文档配套的 Notion 工作区（或继续用 Markdown 仓库）

### Week 2：访谈 + 竞品
- [ ] 访谈 5 名 Garmin 重度用户（从 r/Garmin、小红书 Garmin 话题、即刻找）
- [ ] 访谈 5 名 Facer 设计师（从 Facer Creator 公开页面联系）
- [ ] 完成 Facer / Mr Time / Watchmaker 三家的功能拆解表
- [ ] 用上述输入更新本文档 v1.1（PM Agent 帮你做）
- [ ] 与一位创业相关律师（建议同时熟悉中港新美的）做 1 小时初步咨询，估算合规预算

### Week 3：原型 + Subagent 团队搭建
- [ ] 建立 5 个核心 Agent（PM / Backend / Frontend / Garmin SDK / DevOps）的 system prompt 与知识库
- [ ] 让 Garmin SDK Agent 用 IR JSON 自动生成 3 款不同风格的 Demo 表盘
- [ ] 把这 3 款表盘上传到 Connect IQ Store 开发者预览，跑通收费链路
- [ ] 让 PM Agent 输出 Phase 1 的 PRD v0.1
- [ ] 让 DevOps Agent 搭建 Monorepo（Turborepo + pnpm workspaces）

### Week 4：定型 + 公开发声
- [ ] 完成 Phase 1 PRD v1.0 评审（自评 + 至少 1 位行业前辈）
- [ ] 注册新加坡公司（用 Sleek / Osome 等服务，约 $400-800 + 年费）
- [ ] 申请 Stripe Atlas 或 Stripe Connect 账户
- [ ] 在 Twitter/X、即刻、小红书发起"weWatch 设计师种子计划"招募贴，目标 50 个意向设计师
- [ ] 起草 Designer Manifesto（设计师宣言）—— 你的价值观，决定了你能吸引到什么样的设计师

---

## 附录 A：Garmin Connect IQ 关键参数速查

| 参数 | 值 / 说明 |
|---|---|
| 当前 SDK 版本 | 7.x（截至 2026 年初，请实时查阅 developer.garmin.com） |
| 主流设备分辨率 | 240×240（圆，多数 Forerunner）、260×260、390×390（Venu 3）、454×454（fenix 7X Pro） |
| Watch Face 内存上限 | 一般 32-128KB（按设备） |
| 文件格式 | .prg（编译产物）、.iq（打包上架格式） |
| Monkey C 关键特性 | 类 Java 语法、强类型、有 GC、支持 Lambda |
| 调试工具 | VS Code Monkey C 插件（Garmin 官方）、Connect IQ Simulator |
| 商店审核周期 | 一般 3-7 天 |
| 开发者账号年费 | 免费 |
| Garmin 抽成 | 30% |

> ⚠️ 上述数字以 Garmin 官方文档为准，本文档撰写时已尽量准确，但实际开发前必须以 developer.garmin.com 最新版为准。

## 附录 B：推荐工具链与开源依赖（精选）

- **代码生成 IR Schema**：用 Zod 定义，TypeScript 端校验，Python 端用 Pydantic 镜像
- **Monkey C 项目模板**：自建 monorepo `garmin-templates/` 维护多设备 jungle 模板
- **AI 图像 → 8-bit/16-bit 调色板**：`pillow` + `imagemagick` + 自研 dithering 脚本
- **设计师工具底层 Canvas**：Konva.js（2D 灵活）或 Pixi.js（性能更好但复杂）
- **A/B 实验**：PostHog Feature Flags
- **国际化**：next-intl + Lokalise
- **支付 MoR 备选**：Lemon Squeezy 或 Paddle（早期省合规，规模化后切 Stripe Connect）
- **审核 AI**：OpenAI Moderation + Hive Moderation + 阿里云盾（中国）
- **客服**：Crisp.chat（性价比高，多语言）

## 附录 C：Subagent Prompt 模板库（建议持续维护于 `/docs/playbooks/agents/*.md`）

每个 Agent 的 prompt 文件结构建议：
1. 角色定义（你是谁）
2. 知识储备索引（你应该读过哪些文档）
3. 工具与权限清单
4. 输入契约（任务请求长什么样）
5. 输出契约（交付物长什么样）
6. Definition of Done（什么算完成）
7. 禁忌与红线
8. 升级路径（遇到无法决策的情况怎么办）
9. 性能指标（每月衡量自己）
10. 版本历史

---

## 附录 D：里程碑与预算（30 个月预估）

| 里程碑 | 预计时间 | 累计支出（保守，单人 + AI） |
|---|---|---|
| Phase 0 完成 | M2 | ~ $3K（设备 + 注册 + LLM） |
| Phase 1 上线 | M6 | ~ $20K（含合规、云、LLM、设计师激励首期） |
| Phase 2 上线 | M10 | ~ $50K |
| Phase 3 上线 | M14 | ~ $90K，预计开始月收入 $30K+，单月接近打平 |
| Phase 4 启动 | M18 | ~ $150K，开始招第一位核心合伙人（CTO 或 设计总监） |
| 跨平台主流上线 | M30 | 假设 Series A 已完成 / 或自有现金流支撑 5 人团队 |

---

## 文档维护

- 本文档为"活文档"，由 **PM Agent** 每两周更新一次（你审核）。
- 每个 Phase 启动前必须重读，并产出 v_N+1 版。
- 任何架构决策走 ADR（Architecture Decision Record），存档于 `/docs/decisions/`。

**下一步建议**：
1. 把这份文档变成你的"创业宪法"——打印出来贴在工作区。
2. 让我帮你立刻开始写 **第一个 Subagent 的完整 system prompt + 知识库结构**（推荐从 PM Agent 或 Garmin SDK Agent 开始）。
3. 或者，让我帮你做 **Phase 0 第一周的逐日任务清单**，颗粒度细到"今天上午 9 点干什么"。

告诉我你想先深入哪一块，我们就开始。
