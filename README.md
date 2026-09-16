# Trading：美股看盘与模拟交易

一个中文美股个人投资研究工具。目标是查看延迟行情、整理新闻与 Reddit/社交讨论、过滤市场噪音，并用虚拟资金进行模拟买卖和投资复盘。

## 当前状态

- 当前阶段：阶段 7 / 联调与发布准备
- 已完成：后端基础、演示行情、个股详情、市场噪音分组、自选股、模拟买卖、持仓、盈亏、投资决策日志、可替换行情 provider、前端 Dashboard 和 CORS 联调配置
- 尚未实现：真实行情供应商绑定、新闻抓取、正式部署
- 开发分支：`codex/backend-foundation`

## 技术栈

- 运行时：Node.js `v26.8.2`（使用内置 `node:sqlite`）
- 包管理：npm `11.19.1`
- 语言：TypeScript `5.7+`
- Web 框架：Fastify `5.4+`
- 测试：Vitest `3.0+`
- 本地环境：macOS `26.6.2`，Apple Silicon `arm64`
- 数据库：SQLite，本阶段使用 Node 内置同步 API，不依赖 ORM 或外部数据库

## 本地运行

```bash
npm install
npm test -- --run
npx tsc --noEmit
npm run dev
```

服务默认监听 `127.0.0.1:3000`。另开终端检查：

```bash
curl http://127.0.0.1:3000/health
# {"status":"ok"}
```

可用环境变量覆盖默认配置：

```bash
PORT=3001 DATABASE_PATH=./data/trading.db npm run dev
```

## 项目结构

```text
src/
  app.ts       Fastify 应用和路由注册
  server.ts    本地服务入口
  config.ts    端口和数据库路径配置
  db.ts        SQLite 连接和 schema 初始化
  errors.ts    API 错误结构
  market-data.ts  演示指数、股票、历史价格和市场信息 provider
  market-provider.ts  行情 provider 接口和演示实现
  paper-trading.ts  自选股、账户、订单和组合计算
  decision-log.ts  决策理由保存和结果计算
test/
  health.test.ts
  db.test.ts
  errors.test.ts
  market.test.ts
  trading.test.ts
  decision-log.test.ts
  provider.test.ts
docs/
  superpowers/specs/   产品设计文档
  superpowers/plans/   分阶段实现计划

frontend/
  src/App.tsx       Dashboard、噪音雷达和模拟交易表单
  src/api.ts        后端 REST API 客户端
  src/view-model.ts 金额和涨跌显示格式化
  src/styles.css    响应式深色界面
```

## 已实现 API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/health` | 返回服务健康状态 |
| GET | `/market/overview` | 指数和演示自选股行情 |
| GET | `/stocks/:symbol` | 个股报价、简化历史价格和关联信息 |
| GET | `/market/noise` | 重要、一般、噪音、风险信息分组 |
| GET | `/watchlist` | 查询自选股 |
| POST | `/watchlist` | 添加自选股，例如 `{ "symbol": "NVDA" }` |
| DELETE | `/watchlist/:symbol` | 删除自选股 |
| GET | `/portfolio` | 查询现金、持仓市值、总资产和盈亏 |
| GET | `/orders` | 查询模拟订单 |
| POST | `/orders` | 创建市价模拟订单 |
| GET | `/decision-logs` | 查询决策日志及当前结果 |
| POST | `/decision-logs` | 保存股票、方向、价格和买卖理由 |

后端阶段 API 已实现；前端当前覆盖市场总览、自选股、组合摘要、噪音雷达和模拟下单入口。

## 前端运行

```bash
cd frontend
npm install
npm test -- --run
npm run build
npm run dev
```

前端默认请求 `http://127.0.0.1:3000`。如果后端地址不同，可设置 `VITE_API_URL`：

```bash
VITE_API_URL=http://127.0.0.1:3001 npm run dev
```

前后端联调时先启动后端，再启动前端；后端已允许开发环境跨域请求。若 3000 端口被占用，可用 `PORT=3310 npm run dev`，并让前端使用 `VITE_API_URL=http://127.0.0.1:3310`。

## 测试结果

阶段 7 后端和前端共包含 15 个 Vitest 测试；后端 TypeScript 和前端 Vite 生产构建均通过。另已用备用端口完成 `/health` 和 `/market/overview` 联调请求验证。

## 作品集说明

这是一个后端优先的阶段性作品。阶段 7 默认使用 `DemoMarketDataProvider`，账户初始现金为 100,000 USD，前端通过 REST API 调用后端；接入真实延迟行情时只需实现 `MarketDataProvider` 接口并在 `buildApp` 注入，供应商密钥不会写入仓库。所有阶段会使用独立提交并同步到 GitHub 分支，README 会持续记录实际使用的环境、工具版本、运行方式、测试结果和未完成范围。项目只提供模拟交易和信息整理能力，不执行真实下单，也不构成投资建议。
