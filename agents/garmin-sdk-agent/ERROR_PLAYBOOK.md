# Error Playbook · v0.1.0

> 这是 Garmin SDK Agent 的"急诊手册"。每解决一个新问题必须沉淀到本文件，下次同样问题必须在 5 秒内识别。
>
> **格式**：每条记录用 `## ERR-NNN: 简述` 作为锚点（便于在 build_report 中引用）。

---

## ERR-001: `monkeyc: error: Cannot resolve symbol Graphics.FONT_NUMBER_HOT`

**症状**：编译时找不到字体常量。
**根因**：目标设备的 SDK 版本低于该字体常量被引入的版本，或 family 在该设备类型上不可用。
**对策**：
1. 检查 `DEVICE_MATRIX.md` 中目标设备 `min_sdk`。
2. 在 `CODE_GEN_RULES.md` 字体映射表确认 fallback 字体。
3. 在 View.mc 中按设备生成条件代码，或在 jungle 中按设备特化。
**预防**：在生成阶段对每个 element 检查字体可用性。

---

## ERR-002: 模拟器启动超时 / 黑屏

**症状**：`connectiq simulator` 启动后不渲染，或 5 秒后退出。
**根因**：
- Xvfb 未启动或缺少图形库
- SDK 与镜像 Java 版本不兼容
- 项目中包含未授权字体 / 资源文件
**对策**：
1. 容器 entrypoint 加 `Xvfb :99 -screen 0 1024x768x24 +extension GLX & sleep 2`。
2. 确认 `eclipse-temurin:17-jdk` 与 SDK 匹配。
3. 临时跑 `monkeyc --warn` 看是否有 silent warning。
**预防**：CI 加 smoke test：每个新镜像构建后用 hello-world 项目跑通模拟器。

---

## ERR-003: 内存溢出 `out of memory` / Watch Face 无法启动

**症状**：真机或模拟器加载表盘时崩溃，日志显示 `OOM`。
**根因**：资源 + 代码 + 运行时分配超过设备 mem_kb。
**对策**：
1. 拒绝任务，返回 `rejection_reason_code: PERFORMANCE_BUDGET`。
2. 在 build_report 中给出"建议的简化方向"：
   - 降低位图分辨率（2× → 1×）
   - 减少颜色深度（24bit → 8bit）
   - 移除装饰性元素
   - 缓存策略改为按需加载
3. 在生成器中加预算估算 step（编译前），把 OOM 风险尽量左移。
**预防**：`PERFORMANCE_BUDGET.md` 的预算表必须每月校准一次实测值。

---

## ERR-004: Connect IQ Store 审核被拒：图标尺寸不符

**症状**：上架后 Garmin 审核拒绝，理由 "Launcher icon does not meet specifications"。
**根因**：每个设备分辨率类别要求不同尺寸的图标，jungle 未正确按 device 提供。
**对策**：
1. 检查 `resources-<device>/drawables/launcher_icon.png` 是否存在且符合规格表（见 Garmin 官方）。
2. 默认提供 4 种尺寸（40, 60, 80, 100）作为基线。
**预防**：生成阶段强制为每个 target 校验 launcher icon 存在。

---

## ERR-005: AOD 渲染撕裂 / 部分元素消失

**症状**：AMOLED 设备进入 AOD 后部分文字看不见或闪烁。
**根因**：
- `onPartialUpdate` 中绘制超出 `dc.setClip` 区域
- AOD 路径调用了 `WatchUi.requestUpdate()` 触发递归
**对策**：
1. AOD 元素必须严格 `dc.setClip(x, y, w, h)` 限定区域。
2. AOD 路径绝不允许调用 `requestUpdate`。
3. 对应元素的 visibility.aod_visible 必须显式设置（不要依赖默认）。
**预防**：CODE_GEN_RULES.md 已约束；生成器静态检查必跑。

---

## ERR-006: heart_rate 总是返回 null

**症状**：心率 complication 显示 "--" 即使设备戴在手腕上。
**根因**：
- 缺少 `Sensor` 权限（manifest 未声明）
- 调用 `Activity.getActivityInfo().currentHeartRate` 但设备未启用心率监测后台
- 测试时设备未戴手腕
**对策**：
1. 检查 manifest 包含 `<iq:uses-permission id="Sensor"/>`（heart rate complication 自动派生）。
2. 在 fallback 显示 "--" 而非崩溃。
3. 真机测试时确保手腕检测开启。
**预防**：生成器对每个传感器型 complication 自动添加权限。

---

## ERR-007: 中文日期显示乱码

**症状**：locale=zh-CN 时日期显示为 `???月??日` 或纯英文。
**根因**：
- 字体不支持中文字符
- 字符串资源未提供 zh 翻译
**对策**：
1. 系统字体在大多数 Garmin 设备上对中文支持有限，仅 Venu 系列等较新 AMOLED 完整支持。
2. 在 DEVICE_MATRIX.md 增加 `cjk_support` 字段（待补）。
3. 不支持 CJK 的设备：
   - 数字优先表盘（仅显示 04-26 而非 04月26日）
   - 在生成阶段把 zh-CN 元素降级为通用格式
**预防**：IR 校验阶段：当 locale=zh-CN 且元素含中文文案时，校验 target 设备 `cjk_support`。

---

## ERR-008: jungle 中 `excludeAnnotations` 误剔除

**症状**：编译某 device 时报"找不到符号 X"，但其他 device 正常。
**根因**：jungle 配置写错，把当前 device 需要的代码用 `excludeAnnotations` 排除了。
**对策**：
1. 仔细对照 `monkey.jungle` 与代码中 `(:device_id)` 注解。
2. 推荐用工具 `monkeyc --output excludes.json --dump-jungle` 查看实际排除清单。
**预防**：生成器对 jungle 输出做单元测试（每个 device 至少能找到一个 entry function）。

---

## ERR-009: PR 提交后 QA Agent 标记 "screenshot empty"

**症状**：构建通过但模拟器截图为黑屏。
**根因**：模拟器渲染时 watch face 还未首次 onUpdate，或时间窗口太短。
**对策**：
1. 截图前 sleep 至少 3 秒。
2. 检查 onUpdate 是否抛出异常（log 在容器内但未上报）。
3. 模拟器命令加 `--debug` 收集更多日志。
**预防**：BUILD_PIPELINE 中的 simulate 步骤已要求 `--duration 10`，但应在截图前显式等待。

---

## ERR-010: Developer Key 不匹配 → 已上架表盘无法升级

**症状**：上传新版本到 Connect IQ Store 时报 "Application ID does not match developer key"。
**根因**：本次编译使用的私钥与首次上架使用的私钥不一致。
**对策**：
1. **不可修复**：必须用原私钥重新构建上传。
2. 若私钥永久丢失，只能下架重发（用户重新购买）—— **重大事故**。
**预防**：
- 私钥多副本备份（1Password + 离线 USB + 至少一位合伙人/律师代管）。
- 每个项目记录使用的私钥指纹到 build_report 中。
- 严禁本地开发用生产私钥（用单独的 dev 私钥）。

---

## ERR-XXX 模板（添加新条目时复制）

```
## ERR-NNN: 简短症状描述

**症状**：用户/自动化看到的现象。
**根因**：本质原因（最多 3 行）。
**对策**：
1. 立即操作
2. 如果对策 1 无效……
**预防**：在哪一层（IR Schema / 生成器 / CI / Playbook）加规则避免重犯。
**首次发现**：YYYY-MM-DD by <agent_id or person>
**关联 PR / Issue**：链接
```

---

**版本**：0.1.0
**最后更新**：2026-04-26
**条目数**：10（基线，预期 6 个月内增长到 50+）
