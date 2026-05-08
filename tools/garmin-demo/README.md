# weWatch 许可证验证 MVP Demo

此项目是一个 Garmin Connect IQ 表盘，用于验证"设备序列号 → HMAC 许可证密钥 → 表盘解锁"技术链路。

## 技术架构

```
表盘启动
  └── 读取 System.getDeviceSettings().uniqueIdentifier
  └── POST /api/licenses/activate  { deviceSerial, watchfaceId }
      └── 服务端 HMAC-SHA256(secret, serial:watchfaceId) → licenseKey
      └── 返回 { activated: true, licenseKey }
  └── 视图切换到 UNLOCKED（绿色）或 LOCKED（红色）
```

## 前置条件

1. 安装 [Garmin Connect IQ SDK](https://developer.garmin.com/connect-iq/sdk/)（建议 7.x）
2. 本地 weWatch API 已启动（`pnpm dev` 或 `pnpm --filter @wewatch/api dev`）
3. 数据库已包含至少一个 watchface 记录（运行 `pnpm --filter @wewatch/api db:seed`）

## 本地网络配置（关键）

Garmin 模拟器运行在宿主机上，但它不能通过 `127.0.0.1` 访问宿主机 API（取决于平台）。

**Windows 用户**：在 PowerShell 运行 `ipconfig`，找到以太网或 Wi-Fi 的 IPv4 地址，例如 `192.168.1.100`。

在 [LicenseChecker.mc](source/LicenseChecker.mc) 中修改：
```monkeyc
private var _apiBase as String = "http://192.168.1.100:3001";
```

同时将数据库中的真实 watchface UUID 填入：
```monkeyc
private var _watchfaceId as String = "从数据库复制真实的UUID";
```

获取 watchface UUID 的方法：
```bash
docker exec wewatch-pg psql -U wewatch -d wewatch_dev -c "SELECT id, title FROM watchfaces LIMIT 5;"
```

## 在模拟器中运行

1. 打开 VS Code，安装 [Monkey C 扩展](https://marketplace.visualstudio.com/items?itemName=garmin.monkey-c)
2. 按 `Ctrl+Shift+P` → `Monkey C: Run Current Application`
3. 选择设备 `fr265`
4. 模拟器启动后应显示 `Checking license...`，随后变为 `LICENSED`（绿色）或 `LOCKED`（红色）

## 模拟器固定序列号

Connect IQ 模拟器使用固定的设备序列号用于测试：

| 模拟器版本 | uniqueIdentifier |
|-----------|-----------------|
| SDK 7.x fr265 | `SIMULATOR_UNIQUEID` |

实际值请在模拟器运行后查看 API 日志（`apps/api` 的控制台输出会打印收到的 deviceSerial）。

## Web 备用激活页

打开 `http://localhost:3000/activate`，可手动输入设备序列号和 watchfaceId 测试激活流程。

## MVP 验证标准

- [ ] `POST /api/licenses/activate` 返回 `{ activated: true, licenseKey: "..." }`
- [ ] `GET /api/licenses/check?deviceSerial=xxx&watchfaceId=yyy` 返回 `{ valid: true }`
- [ ] 模拟器中显示绿色 LICENSED 界面
- [ ] 更换 deviceSerial 后 check 返回 `{ valid: false }`
- [ ] 单元测试 49 个全部通过：`pnpm --filter @wewatch/api test`

## API 端点

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/licenses/activate` | 激活 — 创建或更新 license 记录 |
| GET  | `/api/licenses/check`    | 验证 — 检查序列号对应的许可证是否有效 |
