# Phase 1 Loop 1 — 组件清单

版本：1.0.0 | 最后更新：2026-05-07

命名约定：遵循 shadcn/ui 风格（PascalCase 组件名）。所有组件移动端优先，基准宽度 375px。

---

## 消费者列表页（`/`）

### 页面级组件

| 组件名 | 类型 | 说明 | Props 关键字段 |
|--------|------|------|----------------|
| `WatchfaceListPage` | Page | 页面根容器，负责数据加载和状态管理 | — |
| `PageHeader` | Layout | 顶部导航栏：Logo、站点名称、登录入口 | `logoSrc: string` |
| `PageFooter` | Layout | 底部版权信息（可选，Phase 1 可简化） | `year: number` |

### 数据区域组件

| 组件名 | 类型 | 说明 | Props 关键字段 |
|--------|------|------|----------------|
| `WatchfaceGrid` | Container | 表盘卡片网格容器；1 列（移动端）/ 2 列（平板）/ 3 列（桌面） | `items: WatchfaceListItem[]` |
| `WatchfaceCard` | Card | 单个表盘卡片：封面图、标题、价格标签、设计师名 | `id: string`; `title: string`; `coverUrl: string`; `price: number`（美分，0=免费）; `designerName: string`; `onClick: () => void` |
| `PriceBadge` | Badge | 价格标签：显示"免费"或格式化金额 | `price: number` |

### 状态组件（空态 / 加载态 / 错误态）

| 组件名 | 类型 | 说明 | Props 关键字段 |
|--------|------|------|----------------|
| `WatchfaceCardSkeleton` | Skeleton | 单张卡片骨架屏，与 `WatchfaceCard` 等尺寸 | — |
| `WatchfaceGridSkeleton` | Skeleton | 渲染 6 个 `WatchfaceCardSkeleton`，用于初次加载 | `count?: number`（默认 6） |
| `EmptyState` | Feedback | 空态：插图 + 主文案 + 副文案（无操作按钮） | `title: string`; `description: string`; `illustrationSrc?: string` |
| `ErrorState` | Feedback | 错误态：错误图标 + 文案 + 重试按钮 | `message: string`; `onRetry: () => void` |

### 空态、加载态、错误态处理方式

```
WatchfaceListPage 内部渲染逻辑：

isLoading  → <WatchfaceGridSkeleton count={6} />
isError    → <ErrorState message="加载失败，请检查网络" onRetry={refetch} />
data.length === 0  → <EmptyState
                        title="暂无表盘"
                        description="期待设计师上传第一款表盘"
                      />
data.length > 0    → <WatchfaceGrid items={data} />
```

---

## 设计师上传页（`/designer/upload`）

### 页面级组件

| 组件名 | 类型 | 说明 | Props 关键字段 |
|--------|------|------|----------------|
| `UploadPage` | Page | 页面根容器；包含鉴权守卫逻辑 | — |
| `AuthGuard` | HOC / Wrapper | 检查登录态；未登录则重定向至 `/auth/login?redirect=/designer/upload` | `redirectTo: string` |
| `PageHeader` | Layout | 同消费者页，复用 | `logoSrc: string`; `showUserMenu?: boolean` |

### 上传表单组件

| 组件名 | 类型 | 说明 | Props 关键字段 |
|--------|------|------|----------------|
| `UploadForm` | Form | 整体表单容器，使用 `react-hook-form` + Zod 校验 | `onSubmit: (data: UploadFormData) => Promise<void>` |
| `FormField` | Field | shadcn/ui `FormField` 封装，含 label + input + 错误文案 | `name: string`; `label: string`; `required?: boolean` |
| `TitleField` | Field | 标题输入（必填），`<Input>` | `maxLength?: number`（建议 80） |
| `DescriptionField` | Field | 描述输入（选填），`<Textarea>` | `maxLength?: number`（建议 500） |
| `PrgFileField` | FileInput | .prg 文件上传（必填）；限制 10MB，仅 `.prg` 后缀 | `maxSizeBytes: number`（= 10_485_760）; `accept: string`（= `.prg`） |
| `CoverImageField` | FileInput | 封面图上传（必填）；限制 2MB，jpg/png；含图片预览 | `maxSizeBytes: number`（= 2_097_152）; `accept: string`（= `image/jpeg,image/png`）; `previewSize?: number` |
| `DeviceSelectField` | MultiSelect | 目标设备多选（选填）；选项来自 `@wewatch/ir-schema` devices | `options: DeviceOption[]`; `placeholder?: string` |
| `PriceField` | Field | 价格输入（数字，单位：美分，0=免费）；含"免费"快捷切换 Toggle | `min: number`（= 0）; `step: number`（= 1） |
| `SubmitButton` | Button | 提交按钮；加载中显示 Spinner + "上传中…"文字；禁用重复点击 | `isLoading: boolean`; `disabled?: boolean` |
| `UploadProgressBar` | Progress | 文件上传进度条（仅文件传输阶段显示） | `progress: number`（0–100） |

### 文件上传子组件（PrgFileField / CoverImageField 内部）

| 组件名 | 类型 | 说明 | Props 关键字段 |
|--------|------|------|----------------|
| `FileDropzone` | Dropzone | 拖拽 + 点击上传区域；含文件图标和提示文字 | `accept: string`; `maxSize: number`; `onFileSelect: (file: File) => void` |
| `FilePreview` | Preview | 已选文件名 + 大小 + 删除按钮 | `fileName: string`; `fileSize: number`; `onRemove: () => void` |
| `ImagePreview` | Preview | 封面图预览缩略图（仅 CoverImageField 使用） | `src: string`; `alt: string` |

### 反馈组件

| 组件名 | 类型 | 说明 | Props 关键字段 |
|--------|------|------|----------------|
| `Toast` | Toast | shadcn/ui `<Toaster>` + `toast()` 调用；用于成功/失败提示 | 通过 `useToast()` hook 触发；`variant: "default" \| "destructive"` |
| `UploadSuccessCard` | Feedback | 上传成功后展示的内联成功卡片（替换表单），含两个 CTA | `watchfaceTitle: string`; `onUploadAnother: () => void`; `onGoHome: () => void` |
| `FieldError` | Inline | 字段级错误文案，红色小字，位于字段下方 | `message: string` |

### 认证页组件（`/auth/login` + `/auth/register`）

| 组件名 | 类型 | 说明 | Props 关键字段 |
|--------|------|------|----------------|
| `AuthPage` | Page | 登录/注册页容器，居中卡片布局 | — |
| `AuthTabs` | Tabs | shadcn/ui `<Tabs>`：切换"登录"和"注册" | `defaultTab: "login" \| "register"` |
| `LoginForm` | Form | 邮箱 + 密码 + 登录按钮；含行内错误提示 | `onSuccess: () => void`; `redirectTo?: string` |
| `RegisterForm` | Form | 邮箱 + 密码 + 确认密码 + 注册按钮；含行内错误提示 | `onSuccess: () => void`; `redirectTo?: string` |

### 空态、加载态、错误态处理方式（上传页）

```
UploadPage 内部状态机：

idle        → 渲染 <UploadForm>
submitting  → <UploadForm> 中 <SubmitButton isLoading={true}>
              + <UploadProgressBar progress={uploadProgress}>
success     → 隐藏表单，渲染 <UploadSuccessCard>
error       → 表单保持可见（数据不丢失）
              + toast({ variant: "destructive", title: "上传失败", description: errorMessage })
              + 具体字段错误通过 react-hook-form setError() 设置到对应字段下方

AuthPage 加载态：
authenticating → <LoginForm> / <RegisterForm> 中提交按钮显示 Spinner
auth error     → 表单下方行内 <Alert variant="destructive"> 显示具体错误信息
```

---

## 共用基础组件（来自 shadcn/ui，直接使用）

| 组件名 | 来源 | 用途 |
|--------|------|------|
| `Button` | shadcn/ui | 通用按钮 |
| `Input` | shadcn/ui | 文本输入框 |
| `Textarea` | shadcn/ui | 多行文本 |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | shadcn/ui | 登录/注册切换 |
| `Alert` | shadcn/ui | 行内错误提示块 |
| `Badge` | shadcn/ui | 价格标签、设备标签 |
| `Progress` | shadcn/ui | 上传进度条 |
| `Skeleton` | shadcn/ui | 骨架屏基础元件 |
| `Toaster` / `useToast` | shadcn/ui | 全局 Toast 通知 |
| `Form` / `FormItem` / `FormLabel` / `FormMessage` | shadcn/ui | 表单基础结构 |
