# Build Pipeline · v0.1.0

> Garmin SDK Agent 编译/打包/上架的标准流水线。本文件用于：
> 1. Agent 自己执行（一次性 / 本地）
> 2. DevOps Agent 据此搭建 GitHub Actions 矩阵 CI

---

## 流水线阶段

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ 0.接收IR  │→│ 1.校验    │→│ 2.生成    │→│ 3.编译矩阵│→│ 4.模拟器  │→│ 5.报告/PR │
│           │ │ IR+target │ │ 项目结构  │ │ monkeyc   │ │ 截图/性能 │ │           │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

每个阶段失败立即停，并按 `ERROR_PLAYBOOK.md` 寻求修复或上报。

---

## 0. 环境前置（DevOps Agent 一次性配置）

### 工具链镜像

构建 Docker 镜像 `wewatch/garmin-sdk:7.4.2`：

```dockerfile
FROM eclipse-temurin:17-jdk-jammy

ENV CIQ_SDK_VERSION=7.4.2
ENV CIQ_HOME=/opt/connectiq

RUN apt-get update && apt-get install -y \
    wget unzip ca-certificates xvfb libgl1 libfreetype6 \
    && rm -rf /var/lib/apt/lists/*

# Download Connect IQ SDK (URL pattern; use official link in production)
RUN mkdir -p $CIQ_HOME && cd /tmp \
    && wget -q https://developer.garmin.com/downloads/connect-iq/sdks/connectiq-sdk-lin-${CIQ_SDK_VERSION}.zip \
    && unzip -q connectiq-sdk-lin-${CIQ_SDK_VERSION}.zip -d $CIQ_HOME \
    && rm connectiq-sdk-lin-${CIQ_SDK_VERSION}.zip

ENV PATH="$CIQ_HOME/bin:$PATH"

# Developer key (must be mounted at runtime, not baked into image)
ENV CIQ_DEV_KEY=/secrets/developer_key

WORKDIR /workspace
ENTRYPOINT ["bash", "-lc"]
```

> ⚠️ **开发者私钥（`developer_key`）绝不进镜像**，每次容器启动通过 secret mount 注入。Garmin 的开发者 key 用 `monkeyc --output-private-key` 生成，需妥善保管，丢失意味着已上架表盘无法升级。

### Secret 管理

| Secret | 来源 | 用途 |
|---|---|---|
| `garmin_developer_key` | Garmin 开发者后台生成 | 编译签名 |
| `connect_iq_uploader_token` | OAuth | Phase 2 起：自动上架到 Connect IQ Store（如官方提供 API） |

存储：1Password / AWS Secrets Manager。本地开发用 `.env.local`（git ignore）。

---

## 1. IR 校验阶段

输入：`task.json` + `ir.json`

```bash
node scripts/validate_ir.js --schema agents/garmin-sdk-agent/ir.schema.json --ir ir.json
```

校验规则见 `IR_SCHEMA.md` §校验规则速查 + `DEVICE_MATRIX.md` §校验逻辑。

**输出**：`validation_report.json`。任一 error 级问题 → 终止，返回 `status: rejected`。

---

## 2. 项目生成阶段

```bash
node scripts/generate_project.js \
  --ir ir.json \
  --templates agents/garmin-sdk-agent/templates \
  --rules agents/garmin-sdk-agent/CODE_GEN_RULES.md \
  --out garmin-projects/<task_id>
```

> 实际生成器是一组 TypeScript 函数，每个 IR 节点类型一个 generator。建议路径：`tools/garmin-codegen/src/generators/*.ts`。

生成后立即跑静态自检：

```bash
node scripts/lint_generated.js --project garmin-projects/<task_id>
```

---

## 3. 编译矩阵阶段

对每个 target 设备并行编译：

```bash
docker run --rm \
  -v $PWD/garmin-projects/<task_id>:/workspace \
  -v /secrets:/secrets:ro \
  wewatch/garmin-sdk:7.4.2 \
  "monkeyc \
    --jungles monkey.jungle \
    --device <device_id> \
    --output build/<device_id>.prg \
    --private-key /secrets/developer_key \
    --warn"
```

并行度建议：CPU 核数 / 2（编译相对吃内存）。

**任何 device 编译失败 → 收集 stderr → 查 `ERROR_PLAYBOOK.md` → 自动修复或终止。**

成功后立即收集产物大小：

```bash
ls -l build/*.prg | awk '{print $9, $5}' > build/sizes.txt
```

---

## 4. 模拟器验证阶段

对每个 device，启动模拟器并截图：

```bash
docker run --rm \
  -v $PWD/garmin-projects/<task_id>:/workspace \
  -e DISPLAY=:99 \
  wewatch/garmin-sdk:7.4.2 \
  "Xvfb :99 -screen 0 1024x768x24 & \
   sleep 2 && \
   connectiq simulator --device <device_id> --watchface build/<device_id>.prg --duration 10 --screenshot screenshots/<device_id>.png"
```

可选：用 SDK 自带 `monkeydo` + 模拟器 CLI 控制时间，截 4 个状态：
- 默认时间（10:09 经典展示时刻）
- AOD 模式
- 低电量（如表盘有低电态变化）
- 数据加载完成（含心率等动态值）

> 模拟器在容器中 headless 运行需要 Xvfb；某些 SDK 版本要求图形界面 init，注意调试。

---

## 5. 报告 + PR 阶段

生成 `build_report.json`（schema 见 `SYSTEM_PROMPT.md`）+ 截图归档。

提交 PR：

```bash
git checkout -b agent/wf-<task_id>
git add garmin-projects/<task_id>
git commit -m "build(garmin): wf-<task_id> - <designer_id> - <device_count> devices"
git push origin agent/wf-<task_id>
gh pr create \
  --title "Garmin Build: <task_id>" \
  --body-file build/pr_description.md \
  --label "agent:garmin-sdk" \
  --label "review:qa"
```

PR 自动触发 QA Agent 审核，QA Agent 决定是否合并 / 是否需要真机验证。

---

## CI 矩阵示例（GitHub Actions）

```yaml
name: garmin-build

on:
  workflow_dispatch:
    inputs:
      task_id:
        required: true

jobs:
  validate:
    runs-on: ubuntu-latest
    outputs:
      ir_path: ${{ steps.fetch.outputs.path }}
    steps:
      - uses: actions/checkout@v4
      - id: fetch
        run: node scripts/fetch_task.js --task ${{ inputs.task_id }}
      - run: node scripts/validate_ir.js --ir ${{ steps.fetch.outputs.path }}

  generate:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/generate_project.js --ir tasks/${{ inputs.task_id }}/ir.json
      - uses: actions/upload-artifact@v4
        with:
          name: project-source
          path: garmin-projects/${{ inputs.task_id }}

  build:
    needs: generate
    strategy:
      fail-fast: false
      matrix:
        device: [fr255, fr265, venu3, fenix7pro, instinct2, ...]
    runs-on: ubuntu-latest
    container:
      image: wewatch/garmin-sdk:7.4.2
    steps:
      - uses: actions/download-artifact@v4
        with: { name: project-source, path: . }
      - run: |
          monkeyc --jungles monkey.jungle \
            --device ${{ matrix.device }} \
            --output build/${{ matrix.device }}.prg \
            --private-key ${{ secrets.GARMIN_DEV_KEY }} --warn
      - uses: actions/upload-artifact@v4
        with:
          name: prg-${{ matrix.device }}
          path: build/${{ matrix.device }}.prg

  simulate:
    needs: build
    strategy:
      matrix:
        device: [fr255, fr265, venu3, fenix7pro, instinct2, ...]
    runs-on: ubuntu-latest
    container:
      image: wewatch/garmin-sdk:7.4.2
    steps:
      - uses: actions/download-artifact@v4
        with: { name: prg-${{ matrix.device }} }
      - run: ./scripts/simulate_and_screenshot.sh ${{ matrix.device }}
      - uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: screenshots/

  report:
    needs: [build, simulate]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - run: node scripts/build_report.js --task ${{ inputs.task_id }}
      - run: gh pr create ...
```

---

## 上架到 Connect IQ Store（Phase 1 半自动）

Garmin 当前**不开放**完全自动化的 Store 上架 API（截至本文件撰写时）。流程：

1. Agent 产出 `.iq` 包：`monkeyc --package` 同 IQ 格式打包。
2. Agent 把 `.iq` 文件上传至我们的 S3 / R2 私有桶。
3. Designer Relations Agent 通过 Garmin 开发者后台手动上传（或半自动 puppeteer 脚本，需注意条款）。
4. 同步把 `.prg` 推送到 weWatch 自有分发渠道（订阅会员走我们的渠道）。

> 一旦 Garmin 开放官方上架 API，Agent 升级为全自动。每次 Garmin 开发者通讯都需关注此项变化。

---

## 性能优化矩阵（CI 加速）

- **缓存 SDK 镜像**：基础镜像 ~600MB，每次拉取慢。GitHub Actions 用 `docker/setup-buildx-action` + GHCR 缓存。
- **缓存项目模板**：模板基本不变，每次 `actions/cache` 缓存 `templates/` 目录。
- **增量编译**：同一表盘多次构建，若 IR diff 仅是颜色/文案 → 跳过重新生成代码，仅替换 resources 后重链接。
- **设备并行**：30 个 target 跑 30 个 matrix job，每 job ~30s 编译 + ~30s 模拟 → 总耗时 ~2 分钟。

---

## 监控指标（DevOps Agent 接入）

| 指标 | 报警阈值 |
|---|---|
| 平均编译时间 | > 4 分钟 → P3 告警 |
| 编译成功率 | < 95% → P2 告警 |
| 模拟器超时率 | > 5% → P3 告警 |
| Agent 任务总成本 | > 月预算 80% → P2 告警 |
| 镜像构建失败 | 任一次 → P1 告警 |

---

**版本**：0.1.0
**最后更新**：2026-04-26
**Owner**：DevOps Agent + Garmin SDK Agent 联合维护
