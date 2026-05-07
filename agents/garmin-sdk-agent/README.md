# Garmin SDK Agent · 知识库与 Prompt 套件

> 本目录是 weWatch 平台 **Garmin SDK Agent** 的"大脑"。任何 LLM/Subagent 在被赋予 Garmin SDK Agent 角色时，必须以本目录为知识起点。

## 目录结构（强约束）

```
agents/garmin-sdk-agent/
├── README.md                ← 你正在看的这个文件（入口与索引）
├── SYSTEM_PROMPT.md         ← 唯一权威的 system prompt（喂给 Claude/LLM）
├── IR_SCHEMA.md             ← Watch Face 中间表示（IR）的 JSON Schema 与字段定义
├── CODE_GEN_RULES.md        ← IR → Monkey C 的翻译规则（决定性能与一致性）
├── DEVICE_MATRIX.md         ← Top 30 主流 Garmin 设备的 capability 矩阵
├── CODING_STYLE.md          ← Monkey C 编码规范（命名、注释、性能）
├── BUILD_PIPELINE.md        ← 编译/打包/上架流水线（CI 实现细节）
├── ERROR_PLAYBOOK.md        ← 常见编译错误、运行时崩溃、模拟器诡异行为的修复手册
├── PERFORMANCE_BUDGET.md    ← 内存、刷新率、电池预算（每个设备一份）
├── ADR/                     ← Garmin SDK 相关的架构决策记录
└── templates/               ← 参考模板（Agent 生成代码时的"种子"）
    ├── manifest.xml
    ├── monkey.jungle
    ├── source/
    │   ├── WatchFaceApp.mc
    │   ├── WatchFaceView.mc
    │   └── ComplicationHelpers.mc
    └── resources/
        ├── strings/
        ├── drawables/
        ├── fonts/
        └── layouts/
```

## 使用方式

### 在 Cowork / Claude Code / Claude Agent SDK 中调用

1. 把 `SYSTEM_PROMPT.md` 的全部内容作为该 subagent 的 system prompt。
2. 把整个 `agents/garmin-sdk-agent/` 目录设为该 subagent 的 read-only 知识根。
3. 给该 subagent 以下工具权限：
   - `Read` / `Write` / `Edit`（仅限 `garmin-projects/<project-id>/` 子目录）
   - `Bash`（仅限白名单：`monkeyc`、`monkeydo`、`zip`、`git`）
   - `Git`（提交 PR，不可直接 push 到 main）
   - `WebFetch`（白名单域名：`developer.garmin.com`、`forums.garmin.com`、`stackoverflow.com`）

### 输入契约（任务请求格式）

每次给 Garmin SDK Agent 派任务，使用如下 JSON：

```json
{
  "task_id": "wf-2026-04-26-001",
  "type": "build_watchface",
  "ir": { ... 见 IR_SCHEMA.md ... },
  "targets": ["fr255", "venu3", "fenix7", "instinct2"],
  "designer_id": "ds_abc123",
  "constraints": {
    "max_memory_kb": 64,
    "min_fps_amoled": 1,
    "support_aod": true
  },
  "deliverables": ["prg", "screenshots", "build_report"]
}
```

### 输出契约

```
garmin-projects/<project-id>/
├── source/                  ← 生成的 Monkey C 源码
├── resources/               ← 生成的资源
├── monkey.jungle
├── manifest.xml
├── build/
│   ├── fr255.prg
│   ├── venu3.prg
│   └── ...
├── screenshots/
│   ├── fr255.png
│   └── ...
└── build_report.json        ← 见 BUILD_PIPELINE.md
```

## 维护责任

- **Owner**：Founder（你）
- **Reviewer**：Backend Agent（确保 IR Schema 与后端契约一致）、QA Agent（确保 ERROR_PLAYBOOK 与实测同步）
- **更新频率**：每次 Garmin 发布新 SDK 版本（约 2-3 个月一次）必须 review 一次
- **版本控制**：本目录所有 .md 文件头必须含 `version: x.y.z` 与 `last_updated: YYYY-MM-DD`

## 与其他 Agent 的握手点

| 对方 Agent | 接口 | 说明 |
|---|---|---|
| Backend Agent | IR Schema (本目录 `IR_SCHEMA.md`) | 后端 API 接收/返回的 IR 格式必须与此一致 |
| AI Pipeline Agent | IR JSON | AI 生成器的输出必须是合法 IR |
| QA Agent | `build_report.json` | QA 据此挑选需要真机验证的设备 |
| DevOps Agent | `BUILD_PIPELINE.md` | DevOps 据此搭建 CI 矩阵 |
| PM Agent | 性能基线（`PERFORMANCE_BUDGET.md`）| 决定可承诺的功能上限 |

## 版本历史

| 版本 | 日期 | 修改 | 修改者 |
|---|---|---|---|
| 0.1.0 | 2026-04-26 | 初版骨架 | Founder + Cowork 协作 |
