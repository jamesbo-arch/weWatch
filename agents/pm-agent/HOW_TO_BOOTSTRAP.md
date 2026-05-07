# 如何在第一周把 PM Agent 跑起来

> 给创始人的上手清单。和 Garmin SDK Agent 不同，PM Agent 没有 "Hello World" 编译可看——它的"跑起来"标志是 **它开始替你做正确的判断**。所以本周的目标是：建立信任 + 校准默契。

---

## Day 1：装载与首次对话（1 小时）

1. 在 Cowork / Claude Agent SDK 中创建 subagent `pm-agent`。
2. system prompt = `agents/pm-agent/SYSTEM_PROMPT.md` 全文。
3. 知识库挂载：整个 `agents/pm-agent/` + `weWatch_战略与研发蓝图_v1.md`。
4. 工具：`Read`, `Write`(限 docs/prds/reports/decisions), `Edit`(同), `WebFetch`(白名单), `Grep`, `Glob`, `TaskCreate`, `TaskUpdate`, `TaskList`。
5. 第一次对话：粘贴本指令——

   > "请阅读 `weWatch_战略与研发蓝图_v1.md` + `agents/pm-agent/PRODUCT_PRINCIPLES.md`，给我 5 条你认为本战略中最容易被违反的原则，并说出在我接下来 30 天最可能犯的错误。"

   PM Agent 应给出**犀利、具体、引用文档**的回答。如果它泛泛而谈 → prompt 没生效，回去 debug。

## Day 2：跑一次 [type=ideation]

故意扔一个**不该做的想法**，看 PM Agent 是否会说"不"。

例：
> "我觉得我们应该立刻支持 Apple Watch 表盘。"

期望反应：
- 引用 PRINCIPLES P2（跨厂商）和主战略 §1.2（Apple Watch 表盘封闭）
- 拒绝（KILL_NICELY）
- 给 1-2 个替代方案（"如果想触达 Apple 用户，可做'灵感模式 + 壁纸导出'"）

如果 PM Agent 兴高采烈帮你写 PRD —— **prompt 失败**，需要强化"默认说不"的措辞。

## Day 3：跑一次 [type=writing]

挑一个**应该做**的小功能，让 PM Agent 写 PRD。

例：
> "为 Phase 0 写一份 PRD：'让创始人能在 30 分钟内手工上传 1 个 .prg 表盘并接受第一笔付款'"

期望产出：
- 严格按 `PRD_TEMPLATE.md`
- DoD 是可量化 Given/When/Then
- 有 Out of Scope 段
- 标注了哪些信息缺失（"TBD by xxx-agent"）

读完后给 PM Agent 反馈（"AC-3 的阈值不够具体"），它应该立即修订。**这是建立默契的关键互动**——前 3 个 PRD 你的反馈密度直接决定它今后的产出质量。

## Day 4：第一次 weekly ritual 排练

按 `WEEKLY_RITUAL.md` 模拟一次（即使你这周没什么数据）。
让 PM Agent 用 mock 数据走一遍周报模板，体会节奏。

之后调整：
- 周报字段太多 / 太少？
- Daily Brief 200 字够不够？
- 你能不能 5 分钟扫完？

## Day 5：拆任务给 garmin-sdk-agent

让 PM Agent 把"上传一个 demo 表盘"这件事拆成 task 清单，TaskCreate 出来：
- backend-agent (mock：你来执行)：建 .prg 上传 endpoint
- garmin-sdk-agent：跑 sample_task.json
- support-agent (mock)：写一份"如何安装"用户文档

观察 PM 是否：
- 按 `AGENT_DISPATCH_RULES` 派对了 Agent
- 设定了正确的依赖
- 每个 task 描述自包含

## Day 6：模拟一个 P0

故意制造一个紧急情况：

> "支付通道挂了，5 分钟内 3 个用户投诉无法购买。"

观察 PM Agent：
- 是否给出 P0
- 是否暂停其他 task 优先派 backend-agent + support-agent
- 是否 1 句话告诉你"你需要做 X"

之后让 PM Agent 写一份 post-mortem 进 DECISION_LOG。

## Day 7：第一次 KILL

让 PM Agent 主动 review 你过去几天扔出来的所有 idea，选 1-3 个 KILL，用 `templates/feature_kill_decision.md` 模板。

读完 KILL 文档后，问自己：
- 我看完是觉得"被骂了"还是觉得"被帮到了"？
- 措辞是否做到"善意 KILL"？
- 触发重新评估的条件是否清晰？

如果你觉得被骂 → PM Agent 的"措辞"调子需要调整。

---

## 第一周末成功标准

- ✅ PM Agent 至少拒绝过 1 个你的想法（且理由合理）
- ✅ PM Agent 至少完成 1 份高质量 PRD
- ✅ 你看 Daily Brief 平均 < 5 分钟
- ✅ 至少有 1 条 DECISION_LOG 条目
- ✅ 至少有 3 个 task 已派给（mock 或真实）执行 Agent

---

## 你需要在第一周决定的事

- [ ] PM Agent 用哪个模型（推荐 **Claude Opus 4.6** —— 它的判断质量比 Sonnet 高 15-20%，PM 角色这个差值很关键）
- [ ] 你接受被 PM 拒绝的"克制阈值"——它每周拒你 5 次还是 1 次你都接受？
- [ ] 与你的实际工作节奏校准：早 08:30 / 晚 18:00 这两个 ritual 时间是否匹配你的作息？
- [ ] 决定主战略文档存放路径，所有 Agent 引用必须一致

---

## 常见失败模式

| 症状 | 根因 | 对策 |
|---|---|---|
| PM Agent 总是 "yes-and"，从不拒绝 | 模型太迁就 / system prompt 中"默认说不"措辞太弱 | 加强 P3 原则，并加上"上次 7 天你拒绝了几次？少于 3 次 → 你太软" |
| PRD 含糊 | 创始人输入太短 → PM 编 | 在输入时加"如有不清楚必须问我" |
| Daily Brief 信息过载 | 没限字数 | system prompt 里硬限 200 字 |
| PM Agent 越权写代码 | system prompt 工具白名单宽 | 真的不要给 Bash 权限 |

---

**版本**：0.1.0
**最后更新**：2026-04-26
