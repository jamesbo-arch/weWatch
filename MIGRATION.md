# weWatch 开发环境迁移指南

将完整的 weWatch 开发环境从一台电脑迁移到另一台。涵盖四部分：代码、数据库、环境变量、Claude Code 配置。

---

## 前提条件

旧电脑需准备以下内容：

```bash
# 1. 确认代码已推送 GitHub
git status   # 应干净
git log --oneline -3  # 确认最新提交在远程

# 2. 导出数据库（见下方步骤）
# 3. 备份 .env 文件
```

新电脑需预装：

| 工具 | 安装方式 |
|------|---------|
| Git | `winget install Git.Git` |
| Node.js 20+ | `winget install OpenJS.NodeJS.LTS` |
| pnpm | `npm install -g pnpm` |
| Docker Desktop | `winget install Docker.DockerDesktop` |
| VS Code | `winget install Microsoft.VisualStudioCode` |

> 本项目当前在 **Windows** 开发，使用 PowerShell 作为默认终端。Mac/Linux 的 SDK 路径不同，不在本文档范围内。

---

## 第一步：克隆代码

```powershell
git clone https://github.com/jamesbo-arch/weWatch.git
cd weWatch

# 切换到当前开发分支
git checkout feat/container-app-mvp

# 安装依赖并构建
pnpm bootstrap
pnpm build
```

---

## 第二步：恢复环境变量

以下三个文件需要从旧电脑手动复制到新电脑项目根目录（**不能提交 Git**，已加入 `.gitignore`）：

| 文件 | 位置 | 内容 |
|------|------|------|
| `apps/api/.env` | 项目根 | 数据库连接、JWT 密钥、HMAC 密钥、R2 凭证、AI API Key |
| `.env.local` | 项目根 | 本地覆盖配置 |
| `.env.example` | 项目根 | 新成员初始化参考模板 |

环境变量清单（参照项目 `CLAUDE.md`）：

```
# 基础设施
DATABASE_URL=postgresql://wewatch:wewatch@localhost:5432/wewatch_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d
LICENSE_HMAC_SECRET=<your-hmac-secret>

# 文件存储（Cloudflare R2）
R2_ACCOUNT_ID=<...>
R2_ACCESS_KEY_ID=<...>
R2_SECRET_ACCESS_KEY=<...>
R2_BUCKET=<...>
R2_PUBLIC_URL=<...>

# AI 流水线
ANTHROPIC_API_KEY=<...>

# Garmin SDK
GARMIN_DEVELOPER_KEY_PATH=<...>
```

> `DATABASE_URL` 在 Docker Compose 环境下不需修改；仅本地裸跑 `node` 时需要设置。

---

## 第三步：恢复数据库

### 在旧电脑上导出

```powershell
# 导出完整 PostgreSQL dump（二进制 .bak 格式，最快）
docker exec wewatch-pg pg_dump -U wewatch -d wewatch_dev -Fc > wewatch_dev_dump.bak

# 备份文件保存在项目根目录
# 文件大小约 1–5MB（取决于 seed 数据量）
```

### 在旧电脑上导出（可读 SQL 格式，可选）

```powershell
# 纯 SQL 文本，可阅读/编辑
docker exec wewatch-pg pg_dump -U wewatch -d wewatch_dev -Fp > wewatch_dev_dump.sql
```

### 把备份文件复制到新电脑

```powershell
# 方式 A：U 盘 / 移动硬盘
Copy-Item wewatch_dev_dump.bak D:\backup\

# 方式 B：局域网共享
# 在新电脑上 \\old-pc-ip\shared\wewatch_dev_dump.bak

# 方式 C：使用 scp（如果两台电脑在同一网络）
scp wewatch_dev_dump.bak new-pc-ip:~/weWatch/
```

### 在新电脑上恢复

```powershell
cd weWatch

# 启动 PostgreSQL 容器（只启动数据库，不启动全部）
docker compose up -d postgres

# 等待 pg 就绪（约 5 秒）
Start-Sleep 5

# 验证连接
docker exec wewatch-pg psql -U wewatch -d wewatch_dev -c "SELECT version();"

# 恢复数据库
Get-Content wewatch_dev_dump.bak | docker exec -i wewatch-pg pg_restore -U wewatch -d wewatch_dev --clean --if-exists

# 如果是 SQL 格式的备份
# Get-Content wewatch_dev_dump.sql | docker exec -i wewatch-pg psql -U wewatch -d wewatch_dev

# 验证恢复
docker exec wewatch-pg psql -U wewatch -d wewatch_dev -c "\dt"
docker exec wewatch-pg psql -U wewatch -d wewatch_dev -c "SELECT id, title FROM watchfaces;"
```

---

## 第四步：启动 Docker 基础服务

```powershell
# 拉取镜像（新电脑首次需要）
docker pull postgres:16-alpine
docker pull redis:7-alpine
docker pull getmeili/meilisearch:v1.10

# 启动全部基础设施
docker compose up -d

# 检查状态
docker compose ps
# 预期：postgres (healthy), redis (healthy), meilisearch (healthy)

# 查看日志
docker compose logs -f
```

> Redis 和 Meilisearch 是缓存/索引服务，**不需要从旧电脑迁移数据**，新环境从零启动即可。

---

## 第五步：验证开发环境

```powershell
# 启动 API（PowerShell，需先加载 .env）
foreach ($line in Get-Content apps/api/.env) {
    if ($line -notmatch '^\s*#' -and $line -match '=') {
        $k,$v = $line -split '=',2
        [Environment]::SetEnvironmentVariable($k.Trim(),$v.Trim(),'Process')
    }
}

# 用 dev 脚本启动
pnpm --filter api dev

# 验证端点
curl http://localhost:3001/api/v1/licenses/check?deviceSerial=TEST\&watchfaceId=24669676-c951-4dac-8c6e-052d57c0dfd3

# 启动 Web
pnpm --filter web dev
# 访问 http://localhost:3000
```

---

## 第六步：恢复 Claude Code 配置

### 目录结构

```
C:\Users\<用户名>\.claude\
├── settings.json          # 全局配置（主题、权限、模型）
├── projects\
│   └── d--workspace-weWatch\
│       └── memory\        # ⭐ 自动记忆 — 最重要
│           ├── MEMORY.md
│           ├── user_preferences.md
│           └── ...
├── keybindings.json       # 自定义快捷键
└── transcripts\           # 历史对话记录
```

### 备份与恢复

```powershell
# ── 旧电脑：打包备份 ──
Compress-Archive -Path "$env:USERPROFILE\.claude" -DestinationPath "$env:USERPROFILE\Desktop\claude-backup.zip"

# ── 新电脑：恢复 ──
# 在 VS Code 中安装 Claude Code 插件
# 登录你的账号

# 恢复 memory 目录（最关键）
Expand-Archive -Path "D:\claude-backup.zip" -DestinationPath "$env:USERPROFILE\.claude\"

# 恢复个人配置
Copy-Item "D:\backup\settings.json" "$env:USERPROFILE\.claude\settings.json"
Copy-Item "D:\backup\keybindings.json" "$env:USERPROFILE\.claude\keybindings.json"
```

### 需要手动同步的 VS Code 配置

| 配置 | 方式 |
|------|------|
| VS Code 插件列表 | 登录 GitHub/Microsoft 账号后自动同步 |
| Claude Code 插件设置 | 在插件内重新配置（或复制 `settings.json`） |
| 工作区设置 | `weWatch/.vscode/settings.json` 已提交 Git |

---

## 第七步：Garmin SDK（可选，仅编译 Monkey C 时需要）

Garmin SDK 在本地有两个相关目录：

```
# Windows SDK（由 Connect IQ SDK Manager 管理）
C:\Users\<用户名>\AppData\Roaming\Garmin\ConnectIQ\Sdks\

# 项目内的 SDK Manager 工具
weWatch\connectiq-sdk-manager-windows\
```

### 在新电脑上安装

1. 下载安装 [Garmin Connect IQ SDK Manager](https://developer.garmin.com/connect-iq/sdk/)
2. 通过 SDK Manager 下载与旧电脑相同版本的 SDK（当前：**9.1.0**）
3. 复制 developer key：
   ```powershell
   Copy-Item "D:\backup\developer_key.der" "$env:APPDATA\Garmin\ConnectIQ\Keys\"
   ```

> 正式生产环境通过 Docker 内的 SDK 编译，本地仅用于调试。

---

## 迁移检查清单

| # | 项目 | 方式 | ☐ |
|---|------|------|---|
| 1 | 代码 | `git clone` | ☐ |
| 2 | `apps/api/.env` | 手动复制 | ☐ |
| 3 | `.env.local` | 手动复制 | ☐ |
| 4 | PostgreSQL 数据 | `pg_dump` → `pg_restore` | ☐ |
| 5 | Docker 镜像 | `docker compose pull` | ☐ |
| 6 | Redis | 无需迁移（缓存） | ☐ |
| 7 | Meilisearch | 无需迁移（索引可重建） | ☐ |
| 8 | Node.js + pnpm | 重新安装 | ☐ |
| 9 | VS Code + 插件 | Settings Sync | ☐ |
| 10 | Claude Code memory | 复制 `~/.claude/` | ☐ |
| 11 | Garmin SDK | SDK Manager 重新安装 | ☐（可选） |
| 12 | `pnpm bootstrap && pnpm build` | 安装依赖 + 构建 | ☐ |
| 13 | `docker compose up -d` | 启动基础设施 | ☐ |
| 14 | API 健康检查 | `curl localhost:3001/api/v1/...` | ☐ |
| 15 | Web 健康检查 | 浏览器访问 `localhost:3000` | ☐ |

---

## 常见问题

### Q: `pnpm dev` 启动后 EADDRINUSE 端口冲突？
当前已知问题（参见 ROADMAP.md Phase 1 待完成项）。使用 `pnpm --filter api dev` + `pnpm --filter web dev` 分别启动可避免。

### Q: API 返回 500 错误？
检查 `apps/api/.env` 中 `DATABASE_URL` 是否指向 `wewatch_dev`（不是 `wewatch`）。默认 fallback 为错误库名。

### Q: 数据库恢复后表为空？
确认导出/导入使用了正确的用户名和数据库名：`-U wewatch -d wewatch_dev`。

### Q: 模拟器无法连接？
在新电脑上打开 `C:\Users\<用户名>\AppData\Roaming\Garmin\ConnectIQ\Sdks\...\bin\simulator.exe`，然后运行 `monkeydo.bat`。
