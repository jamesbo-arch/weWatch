# 图像生成规则 · v0.1.0

> Garmin 设备的"图像"和你直觉上的"图像"差别很大：MIP 屏幕只有 8/16 色调色板、AMOLED 担心烧屏、内存预算很小。直接 SDXL → 当背景几乎一定崩。这份文件是**让 AI 生成图像在 Garmin 上能用**的规则集。

---

## 1. 三个普适铁律

1. **图像里禁止有文字**（设备字体渲染时间 > 系统字体；且翻译困难）
2. **图像里禁止有真人脸 / 真实标志 / 复杂动物**（IP + 量化后糊成一团）
3. **图像必须是"低频信息"**（大色块 + 简单形状）—— 量化 + dithering 后才能保留视觉效果

---

## 2. 模型选择

详见 `MODEL_CATALOG.md`。当前默认：

| 用途 | 模型 | 单图成本（约） |
|---|---|---|
| MIP 设备背景（极简） | `flux-schnell` 或 `sdxl-v1`（精简风预设） | $0.002-$0.005 |
| AMOLED 设备背景（高保真） | `flux-dev` 或 `sdxl-v1` | $0.01-$0.03 |
| 装饰小图标（complication 自定义图标） | `flux-schnell` 微缩 | $0.002 |
| 中国版（无境外 API） | 自部署 SDXL Turbo（国内 GPU 集群） | 自有 GPU 摊销 |

## 3. Prompt 工程

### 强制前缀（每次必加）

```
"flat illustration style, minimalist, simplified shapes, large solid color
areas, no people, no faces, no text, no readable letters, no logos,
no brand names, no copyrighted characters, smartwatch face background,
suitable for low color depth display"
```

### 强制 negative prompt（每次必加）

```
"text, letters, numbers, words, watermark, signature, low quality,
blurry, jpeg artifacts, complex details, photorealistic faces, real people,
celebrity, brand logo, sports team logo, anime character, cartoon character,
weapon, blood, gore, child, sexual"
```

### 用户 prompt 包装方式

不直接拼接用户 prompt——必须经 LLM 提取的 StyleBrief：

```
{强制前缀}, {style_brief.mood join("+")} mood,
{style_brief.palette_intent.primary_hue} dominant color,
{style_brief.palette_intent.contrast} contrast,
inspired by: {style_brief.style_notes (rewritten by LLM to be IP-safe)}
```

**永远不要**把 raw user prompt 直接传给 image model。

### 尺寸

- MIP 设备：生成 768×768，再 downsample
- AMOLED 设备：生成 1024×1024，再 downsample（保留更多细节用于不同设备）

为什么"先大后小"：
- 直接生成 240×240 等小尺寸，模型质量大幅下降
- 大图 → 多设备各自 downsample 一次，效果一致

### Seed

- 必填：`seed = sha256(job_id + asset_index) mod 2^32`
- 同一表盘内多张图共享一个"主题 seed family"（让风格一致）：
  - 主图：seed
  - 装饰图标：seed + 1
  - 备用：seed + 100, +200 ...

---

## 4. 后处理流水线（关键差异点）

每张原始图按"目标设备"做特化处理：

```
generated_raw.png (1024x1024 sRGB 24bpp)
    │
    ├─→ for each target device:
    │       │
    │       ├─→ [4.1] resize to device.resolution (Lanczos)
    │       ├─→ [4.2] crop / pad based on canvas.shape
    │       ├─→ [4.3] tone mapping (压低高光，避免 OLED 烧屏)
    │       ├─→ [4.4] palette quantization (MIP only)
    │       ├─→ [4.5] dithering (MIP only)
    │       ├─→ [4.6] PNG optimization (pngquant + oxipng)
    │       └─→ assets/<asset_id>/<device_id>.png
    │
    └─→ keep original at assets/<asset_id>/_master.png
```

### 4.4 Palette Quantization（MIP 设备）

每个 MIP 设备有官方调色板（Garmin SDK 文档；通常 16 / 64 色固定）。
不能用动态调色板——会和系统 UI 冲突。

实现：

```python
from PIL import Image

device_palette = load_palette('palettes/fr255.act')  # Adobe color table
img = Image.open('raw.png').convert('RGB')
quantized = img.quantize(palette=device_palette, dither=Image.NONE)
```

> ⚠️ Phase 0 必须实测每个 MIP 设备的真实调色板。`palettes/` 目录由 Garmin SDK Agent + AI Pipeline Agent 共同维护。

### 4.5 Dithering

Floyd-Steinberg error diffusion：

```python
quantized = img.convert('RGB').quantize(
    palette=device_palette, dither=Image.FLOYDSTEINBERG
)
```

不要用纯量化（会出现明显色块）；不要用 ordered dither（会出网格状 artifacts）。

### 4.6 PNG 优化

```bash
pngquant --speed 1 --strip --quality=80-95 input.png -o pq.png
oxipng -o 4 --strip safe pq.png
```

最终大小检查：超 device 单图预算（见 `PERFORMANCE_BUDGET.md`）→ 重新更激进 quantize 或拒绝该 device。

---

## 5. AMOLED 烧屏防御

AMOLED 像素长期亮 = 烧屏。表盘背景是高风险场景。

规则：
- 整图最大平均亮度 ≤ 30%（按 luminance 计算）
- 大面积纯白 / 纯亮黄 / 纯亮红 → 自动 tone-down
- 如果 IR 启用 `aod_visible: true` 元素 + 图像背景 → 强制让背景在 AOD 模式纯黑（在 IR 中加 layered background）

实现：在 4.3 tone mapping 中加 luminance cap。

---

## 6. 何时**不**生成图像

主动节省成本与避免风险：

- 用户 prompt 没明确要求"图片背景"→ 用纯色 / 渐变背景
- 极简风（mood 包含 'minimal'）→ 默认渐变
- MIP 32KB 设备 → 默认禁用图像背景（剩余预算几乎全部资源都用不下）
- 用户预算不足 → 降级到无图

判定逻辑写在 `prompts/ir_generation.md`，让 LLM 在 Step 4 决定。

---

## 7. 缓存

key = sha256(packaged_prompt + model + seed + size)
hit → 直接返回 R2 URL
miss → 生成 + 上传

注意：post_process 后的设备特化版本**不缓存原图 key**——它们用 sha256(asset_id + device_id) 作为单独 key。

---

## 8. 测试 & 校准

每个新模型 / palette 上线前必跑：

- 10 个固定测试 prompt（"赛博朋克城市夜景" "晨跑山林" 等）
- 每个生成 3 张图（不同 seed）
- 跑全后处理流程
- 在真机模拟器渲染 5 个设备
- 人工 review 通过率 ≥ 80% 才上线

校准结果归档到 `tests/image-gen/<model_version>/`。

---

## 9. 失败模式

| 症状 | 根因 | 对策 |
|---|---|---|
| 量化后出现"色块墙" | dither 关闭或 palette 不匹配 | 启用 FS dither，重新校准 palette |
| 真机看图全黑 | tone mapping 太激进 | 调整 luminance cap |
| 图像里出现文字 | model 没遵守 negative prompt | 加权 negative + 上 OCR 后处理检测 |
| 单设备图 > 预算 | 量化级别不够 | 降到 8 色 + 更激进 pngquant |
| 出现真人脸 | model 漂移 | 加 SafetyChecker（CLIP-based）+ moderation |

---

**版本**：0.1.0
**最后更新**：2026-04-26
