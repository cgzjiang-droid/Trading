import { useEffect, useState } from 'react';
import { api } from './api';
import { formatChange, formatCurrency } from './view-model';

type Overview = { indices: any[]; watchlist: any[]; updatedAt: string };
type Noise = { groups: Record<string, any[]> };

export default function App() {
  const [overview, setOverview] = useState<Overview>();
  const [noise, setNoise] = useState<Noise>();
  const [portfolio, setPortfolio] = useState<any>();
  const [symbol, setSymbol] = useState('');
  const [order, setOrder] = useState({ symbol: 'AAPL', side: 'buy', quantity: 1, reason: '' });
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try {
      const [nextOverview, nextNoise, nextPortfolio] = await Promise.all([api.overview(), api.noise(), api.portfolio()]);
      setOverview(nextOverview); setNoise(nextNoise); setPortfolio(nextPortfolio); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : '后端未连接'); }
  };
  useEffect(() => { refresh(); }, []);

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    try { await api.createOrder({ ...order, quantity: Number(order.quantity) }); setMessage('模拟订单已成交'); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : '订单失败'); }
  };
  const addSymbol = async (event: React.FormEvent) => {
    event.preventDefault(); if (!symbol.trim()) return;
    try { await api.addWatchlist(symbol); setSymbol(''); setMessage('已加入自选股'); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : '添加失败'); }
  };

  return <main className="shell">
    <header><div><p className="eyebrow">TRADING / US EQUITIES</p><h1>美股研究台</h1><p className="muted">行情、噪音和模拟决策，放在一个页面里。</p></div><button className="ghost" onClick={refresh}>刷新数据</button></header>
    {message && <div className="notice">{message}</div>}
    <section className="hero-grid">
      <div className="panel summary"><span className="label">组合总资产</span><strong>{formatCurrency(portfolio?.totalAssets ?? 100000)}</strong><span className="muted">现金 {formatCurrency(portfolio?.cash ?? 100000)} · 持仓 {formatCurrency(portfolio?.marketValue ?? 0)}</span></div>
      <div className="panel summary"><span className="label">今日市场</span><strong>{overview?.indices?.[1] ? formatChange(overview.indices[1].changePercent) : '—'}</strong><span className="muted">纳斯达克 · 延迟演示数据</span></div>
      <div className="panel summary"><span className="label">未实现盈亏</span><strong className={(portfolio?.positions?.reduce((s: number, p: any) => s + p.unrealizedPnl, 0) ?? 0) >= 0 ? 'positive' : 'negative'}>{formatCurrency(portfolio?.positions?.reduce((s: number, p: any) => s + p.unrealizedPnl, 0) ?? 0)}</strong><span className="muted">仅用于模拟复盘</span></div>
    </section>
    <section className="layout">
      <div className="column">
        <div className="panel"><div className="panel-title"><h2>市场指数</h2><span className="muted">{overview?.updatedAt ?? '加载中'}</span></div><div className="cards">{overview?.indices?.map((q) => <div className="quote" key={q.symbol}><span>{q.name}</span><b>{q.price.toLocaleString()}</b><em className={q.changePercent >= 0 ? 'positive' : 'negative'}>{formatChange(q.changePercent)}</em></div>)}</div></div>
        <div className="panel"><div className="panel-title"><h2>自选股</h2><form onSubmit={addSymbol} className="inline-form"><input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="输入代码" /><button>添加</button></form></div><div className="watchlist">{overview?.watchlist?.map((q) => <div className="watch-row" key={q.symbol}><b>{q.symbol}</b><span>{q.name}</span><strong>{formatCurrency(q.price)}</strong><em className={q.changePercent >= 0 ? 'positive' : 'negative'}>{formatChange(q.changePercent)}</em></div>)}</div></div>
        <div className="panel"><div className="panel-title"><h2>模拟交易</h2><span className="muted">市价单</span></div><form className="trade-form" onSubmit={submitOrder}><select value={order.side} onChange={(e) => setOrder({ ...order, side: e.target.value })}><option value="buy">买入</option><option value="sell">卖出</option></select><input value={order.symbol} onChange={(e) => setOrder({ ...order, symbol: e.target.value })} placeholder="代码" /><input type="number" min="1" step="1" value={order.quantity} onChange={(e) => setOrder({ ...order, quantity: Number(e.target.value) })} /><input value={order.reason} onChange={(e) => setOrder({ ...order, reason: e.target.value })} placeholder="买卖理由（可选）" /><button type="submit">提交模拟订单</button></form></div>
      </div>
      <aside className="column"><div className="panel radar"><div className="panel-title"><h2>市场噪音雷达</h2><span className="tag">AI 分级</span></div><p className="muted">把今天的信息分成值得看、可以略过和需要留意。</p>{[['important','重要信息'],['general','一般信息'],['noise','市场噪音'],['risk','风险提示']].map(([key, label]) => <div className="noise-group" key={key}><h3>{label}<span>{noise?.groups?.[key]?.length ?? 0}</span></h3>{noise?.groups?.[key]?.map((item: any) => <div className="noise-item" key={item.id}><b>{item.title}</b><small>{item.source} · 相关性 {item.relevance}/5</small></div>)}</div>)}</div></aside>
    </section>
    <footer>演示数据 · 本项目不执行真实下单，也不构成投资建议</footer>
  </main>;
}
