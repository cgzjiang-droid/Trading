# 美股看盘与模拟交易 MVP 设计

## 目标

构建一个中文桌面 Web 应用，让用户每天查看延迟的美股市场信息，过滤新闻与 Reddit/社交讨论中的噪音，管理自选股，并用虚拟资金完成模拟买卖和投资复盘。

## 用户闭环

用户打开 Dashboard，先看到标普 500、纳斯达克、道琼斯和自选股的行情；接着阅读 AI 生成的一句话市场结论及分级信息；进入个股页查看走势和信息；用虚拟现金下市价买卖单；最后在决策日志中记录买卖理由，供之后复盘。

## MVP 范围

### 市场总览

- 指数卡片：SPX、IXIC、DJI 的价格、涨跌额和涨跌幅。
- 自选股列表：股票代码、名称、最新价、涨跌幅和更新时间。
- 市场摘要：一句话结论，展示数据更新时间。

### 个股页

- 搜索股票并加入/移出自选股。
- 显示最新延迟价格和 1D、1W、1M 简化走势图。
- 显示该股票的新闻、公司公告和 Reddit/社交讨论摘要。

### 市场噪音雷达

每条信息生成四个可解释字段：相关性、来源可信度、重复程度、价格影响。页面按以下四组展示：重要信息、一般信息、市场噪音、风险提示。开发阶段允许使用固定演示数据；行情和信息通过 adapter 接口替换。

### 模拟交易

- 初始现金：100,000 USD。
- 仅支持市价买入和卖出。
- 买入数量必须为正整数且不超过可用现金；卖出数量不得超过持仓。
- 记录订单时间、代码、方向、数量、成交价和金额。
- 根据最新价格计算现金、持仓市值、总资产、未实现盈亏和已实现盈亏。

### AI 投资决策日志

- 下单前可填写一句买入或卖出理由。
- 日志保存股票、方向、数量、成交价、理由和时间。
- 复盘时展示当时理由、后续价格变化和结果标签；第一版只做规则化结果，不判断用户对错。

## 非目标

登录、多用户、真实券商连接、真实下单、自动交易、限价单、手续费和滑点、复杂量化策略、个性化荐股、完整历史回测。

## 技术方案

- React、Vite、TypeScript。
- 浏览器 `localStorage` 保存自选股、模拟订单、持仓和决策日志。
- `MarketDataProvider` 提供指数、股票报价、历史价格和信息流；默认使用演示数据。
- `AnalysisProvider` 接收结构化行情和信息，返回摘要、分级信息和风险提示；默认实现为规则化演示实现，后续替换为模型调用。
- 页面状态保持简单，先不引入后端和状态管理框架。

## 核心数据

```ts
type Quote = { symbol: string; name: string; price: number; change: number; changePercent: number; updatedAt: string };
type Order = { id: string; symbol: string; side: 'buy' | 'sell'; quantity: number; price: number; createdAt: string; reason?: string };
type Position = { symbol: string; quantity: number; averageCost: number };
type MarketItem = { id: string; symbol?: string; title: string; source: string; category: 'news' | 'filing' | 'social'; relevance: number; credibility: number; repetition: number; priceImpact: 'positive' | 'negative' | 'neutral' };
```

## 验收标准

1. 首次打开应用能显示演示市场数据和更新时间。
2. 用户能添加自选股并在刷新后保留。
3. 用户能完成一次合法模拟买入和卖出，组合数值即时更新。
4. 非法订单会被拒绝并显示原因，不改变现金或持仓。
5. 市场信息能按四个分组显示，且每项有评分依据。
6. 用户能保存一条决策理由，并在复盘页看到价格变化结果。

## 风险与边界

演示数据不代表真实市场；延迟数据的具体时长取决于后续供应商。产品文案必须明确这是模拟交易和信息整理工具，不构成投资建议。
