# Trading：美股看盘与模拟交易

一个中文美股个人投资研究工具。目标是查看延迟行情、整理新闻与 Reddit/社交讨论、过滤市场噪音，并用虚拟资金进行模拟买卖和投资复盘。

## 当前状态

- 当前阶段：阶段 3 / 自选股与模拟账户
- 已完成：服务启动、SQLite 初始化、健康检查、统一错误响应、演示行情、个股详情、市场噪音分组、自选股、模拟买卖、持仓和盈亏
- 尚未实现：真实行情、新闻抓取、投资决策日志、前端页面
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
  paper-trading.ts  自选股、账户、订单和组合计算
test/
  health.test.ts
  db.test.ts
  errors.test.ts
  market.test.ts
  trading.test.ts
docs/
  superpowers/specs/   产品设计文档
  superpowers/plans/   分阶段实现计划
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

后续阶段会加入自选股、模拟订单、组合和决策日志 API。

## 测试结果

阶段 3 当前包含 10 个 Vitest 测试：基础服务、市场 API、自选股、买入、卖出、盈亏和非法订单。最后验证结果为 **10 passed**，TypeScript `--noEmit` 编译通过。

## 作品集说明

这是一个后端优先的阶段性作品。阶段 3 使用固定演示行情，账户初始现金为 100,000 USD，便于下载后立即完成模拟交易；真实供应商接入会通过 provider adapter 完成。所有阶段会使用独立提交并同步到 GitHub 分支，README 会持续记录实际使用的环境、工具版本、运行方式、测试结果和未完成范围。项目只提供模拟交易和信息整理能力，不执行真实下单，也不构成投资建议。
