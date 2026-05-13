# weWatch 开发日志

## 2026-05-12 (周二)

**分支**: feat/animated-background

### 目标计划
- [x] 为项目搭建 `/log-dev` 自定义 slash command，实现结构化开发日志
- [x] 查看所有分支的最后提交时间，确认开发进度

### 重要完成项
- 创建 `/log-dev` skill（`.claude/skills/log-dev/SKILL.md`），支持按天归并日志条目
- 初始化 `docs/DEVELOPMENT_LOG.md`，已写入 2026-05-09 animated background 进展
- 更新 `CLAUDE.md`，新增"自定义 Slash Commands"段落
- 修正 slash command 注册路径：从 `.claude/commands/`（无效）迁移到 `.claude/skills/log-dev/SKILL.md`（正确）

### 架构变更
| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `.claude/skills/log-dev/SKILL.md` | 新增 | `/log-dev` skill 定义，含 YAML frontmatter + 执行步骤 |
| `docs/DEVELOPMENT_LOG.md` | 新增 | 开发日志文件，结构化记录每次 `/log-dev` 调用 |
| `CLAUDE.md` | 修改 | 新增"自定义 Slash Commands"段落 |

### 测试结果
- `/log-dev` 命令出现在可用 skill 列表中，当前即通过该命令触发

### 下一步计划
- ~~编译验证 Monkey C 代码~~ ✅
- ~~数据库插入 Aurora Wave 表盘记录~~ ✅
- 模拟器验证动画播放（需用户手动操作 monkeydo）

---

### 16:00 补充 — T6/T7 收尾

**分支**: feat/animated-background

#### 目标计划
- [x] T6 — 数据库插入 Aurora Wave 表盘 + Midnight Minimal renderSpec
- [x] T7 — monkeyc 编译（fr265），修复 _bgImgKey 死代码 warning
- [ ] T7 — 模拟器验证（待用户操作）

#### 重要完成项
- 更新 `seed.ts`：为 Midnight Minimal 添加显式 UUID 和 renderSpec（纯黑底 v2），新增 Aurora Wave 表盘（含 `bg_anim: "aurora_wave"` renderSpec）
- 运行 seed 成功，19 个表盘入库，Aurora Wave / Midnight Minimal 的 renderSpec 已验证
- 修复 `RenderSpecLayer.mc` 中 `_bgImgKey` 死代码：补全 bitmap 缓存逻辑（key + BitmapResource 双重缓存，setSpec 时失效）

#### 架构变更
| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/api/src/db/seed.ts` | 修改 | 支持显式 UUID + renderSpec 字段；新增 Aurora Wave 条目 |
| `tools/garmin-demo/source/RenderSpecLayer.mc` | 修改 | 新增 `_bgBmp` 缓存，`drawBgImage()` 改为先查缓存再 loadResource |

#### 测试结果
- monkeyc 编译: BUILD SUCCESSFUL（fr265，3 个已知 warning，无新增）
- 模拟器验证: 未进行（需 Windows GUI）

#### 下一步计划
- 用户运行 `monkeydo.bat` 推送 `LicenseDemo_AuroraWave.prg` 到 fr265 模拟器
- 验证动画循环播放、元素叠加、休眠切换
- 验证 Midnight Minimal 静态背景切换无回归

### 注意事项
- Claude Code 的 slash command 机制是基于 `.claude/skills/<name>/SKILL.md` + YAML frontmatter，而非 `.claude/commands/` 目录。参考文章可能基于不同版本。

## 2026-05-09 (周六)

**分支**: feat/animated-background

### 目标计划
- [x] T1 — 生成动画 GIF 源文件（`gen-animation.mjs`，416×416 Aurora Wave）
- [x] T2 — GIF → .mm 转换（monkeym, fr265, 401KB）
- [x] T3 — 注册动画资源（`animations.xml`，id: `bg_aurora_wave`）
- [x] T4 — 新建 `RenderSpecLayer.mc`（249 行，独立 Layer 绘制 renderSpec 元素）
- [x] T5 — 重构 `LicenseDemoView.mc`（AnimationLayer + overlay Layer 架构）
- [ ] T6 — 数据库插入 Aurora Wave 表盘记录
- [ ] T7 — monkeyc 编译 & 模拟器验证

### 重要完成项
- 完成 Monkey C 代码层面的 AnimationLayer 架构重构
- 生成 Aurora Wave 动画 GIF（8 帧，416×416）并转换为 .mm 二进制资源
- 将 RenderSpec 元素绘制从 `LicenseDemoView` 迁移到独立 `RenderSpecLayer`

### 架构变更
| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `tools/garmin-demo/gen-animation.mjs` | 新增 | 极光动画 PNG 帧生成器 + FFmpeg GIF 合成 |
| `tools/garmin-demo/resources/animations/animations.xml` | 新增 | 注册 `bg_aurora_wave` 动画资源 |
| `tools/garmin-demo/resources/animations/aurora_wave.mmm` | 新增 | monkeym Manifest |
| `tools/garmin-demo/resources/animations/aurora_wave_416x416_16_RGB565.mm` | 新增 | 二进制动画数据（fr265, 401KB） |
| `tools/garmin-demo/source/RenderSpecLayer.mc` | 新增 | 独立 Layer，包含所有元素绘制函数 + bg_anim 逻辑 |
| `tools/garmin-demo/source/LicenseDemoView.mc` | 重构 | 引入 AnimationLayer + overlay Layer，状态屏保持 View 直接绘制 |

### 测试结果
- 模拟器验证: 未进行（编译验证尚未执行）

### 下一步计划
- 在 `watchfaces` 表中插入 Aurora Wave 表盘（含 `bg_anim` 的 renderSpec）
- 用 `monkeyc` 编译 PRG → `monkeydo` 推入 fr265 模拟器验证
- 验证动画循环播放、元素叠加、休眠切换

### 注意事项
- `.mm` 文件较大（401KB），需注意后续真机 PRG 体积预算
- AnimationLayer 在模拟器中的行为可能与真机存在差异
