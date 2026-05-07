# 如何在第一周把 Garmin SDK Agent 跑起来

> 这份文档是给你（创始人）的"上手清单"。按顺序做完，第一周末你就有一个**真的能干活**的 Garmin SDK Agent，能从 IR JSON 编译出可运行的 .prg。

---

## Day 1：环境（半天）

1. 装 Docker Desktop（或 OrbStack / Colima）。
2. 克隆 weWatch monorepo（你还没建 → 用 `gh repo create wewatch/wewatch --private` 起）。
3. 把本目录 `agents/garmin-sdk-agent/` 全部复制进去，提交 PR `feat: bootstrap garmin-sdk-agent`。
4. 注册 [Garmin Developer 账号](https://developer.garmin.com/)（免费）。
5. 下载 Connect IQ SDK 7.x 到本机（用于本地调试，CI 用 Docker）。
6. 在 VS Code 装 Monkey C 官方扩展。

## Day 2：本地跑通 Hello World（半天）

1. 用 SDK 自带 `monkeyc-eclipse-create-project` 或本目录 `templates/` 起一个最小项目。
2. `monkeyc --device fr255 --output build/fr255.prg --private-key dev_key`
3. `monkeydo build/fr255.prg fr255` 启模拟器，应能看到表盘。
4. 截图保存到 `notes/day2-screenshot.png`。

## Day 3：构建 SDK Docker 镜像

1. 按 `BUILD_PIPELINE.md` §0 写 Dockerfile。
2. `docker build -t wewatch/garmin-sdk:7.4.2 .`（首次 ~10 分钟）。
3. `docker run --rm -v $PWD:/workspace wewatch/garmin-sdk:7.4.2 "monkeyc --version"` 验证。

## Day 4：codegen 脚手架

新建 `tools/garmin-codegen/`：

```
tools/garmin-codegen/
├── package.json
├── src/
│   ├── index.ts            # CLI 入口
│   ├── validate.ts         # IR Schema 校验
│   ├── generators/
│   │   ├── manifest.ts
│   │   ├── jungle.ts
│   │   ├── colors.ts
│   │   ├── view.ts
│   │   └── elements/
│   │       ├── time.ts
│   │       ├── date.ts
│   │       ├── text.ts
│   │       ├── image.ts
│   │       ├── shape.ts
│   │       ├── complication.ts
│   │       └── progress_arc.ts
│   └── lint.ts             # 生成后静态检查
└── tests/
```

**第一版只需实现 5 个 generator**：manifest / jungle / colors / view（time + date + complication）。
完成后跑 `examples/sample_task.json`，应能产出可编译的项目。

## Day 5：把 Agent 接到 Claude Agent SDK

1. 在 Claude Agent SDK / Cowork subagent 配置中创建 `garmin-sdk-agent`。
2. system prompt = `agents/garmin-sdk-agent/SYSTEM_PROMPT.md` 全文。
3. 工具白名单：`Read` / `Write` / `Edit` / `Bash`（限 `monkeyc` `monkeydo` `docker`）/ `Git`。
4. knowledge base = 整个 `agents/garmin-sdk-agent/` 目录（read-only）。
5. 跑一次：把 `examples/sample_task.json` 传给 Agent，看它能否：
   - 校验通过
   - 调用 codegen
   - 调用 monkeyc 编译
   - 提交 PR
6. 第一次大概率不顺。把每个失败点变成 ERROR_PLAYBOOK 新条目。

## Day 6-7：CI 化 + 第二个表盘

1. 把 Day 4-5 流程搬到 GitHub Actions（按 `BUILD_PIPELINE.md` §CI 矩阵）。
2. 让 Agent 处理第二个 IR（不同元素组合，比如加上 progress_arc + image background）。
3. 校准 `PERFORMANCE_BUDGET.md` 实测数字。
4. 周五晚回顾：列出本周遇到的 5 个最坑的问题，每个一条 Playbook。

---

## 你需要在第一周决定的事

- [ ] 是用 **Claude Sonnet 4.6 / Opus 4.6** 跑这个 Agent（推荐 Sonnet，性价比高 + 工具调用稳）
- [ ] Agent 失败时是 **静默重试** 还是 **直接升级给你**（推荐：重试 1 次后升级）
- [ ] CI 触发方式：**每个 IR 提交触发** 还是 **批量定时**（Phase 1 推荐前者，Phase 3 加批量优化）
- [ ] 私钥管理：**1Password** 还是 **AWS Secrets Manager**（推荐 1Password 起步，规模化后切 ASM）

---

## 第一周末的成功标准

- ✅ 一个真实 `.prg` 在你手腕上的 Garmin 上跑起来
- ✅ Agent 能独立完成"sample_task.json → PR"全流程，无需你写代码
- ✅ 第二个不同形状的表盘（4 个 element 起步）也能跑通
- ✅ ERROR_PLAYBOOK 累积 ≥ 3 条新条目
- ✅ 你已经能用一句话说出"为什么 weWatch 比 Facer 强"——并且这句话是真的

如果未达成 ✅，**不要进入 Phase 1，回头补 Phase 0**。

---

**版本**：0.1.0
**最后更新**：2026-04-26
