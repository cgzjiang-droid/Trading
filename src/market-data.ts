export type Quote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
};

export type MarketItem = {
  id: string;
  symbol?: string;
  title: string;
  source: string;
  category: 'news' | 'filing' | 'social';
  relevance: number;
  credibility: number;
  repetition: number;
  priceImpact: 'positive' | 'negative' | 'neutral';
};

const updatedAt = '2026-09-16T13:30:00Z';
const quotes: Quote[] = [
  { symbol: 'SPX', name: '标普 500', price: 5528.4, change: 18.2, changePercent: 0.33, updatedAt },
  { symbol: 'IXIC', name: '纳斯达克', price: 17625.4, change: 82.6, changePercent: 0.47, updatedAt },
  { symbol: 'DJI', name: '道琼斯', price: 40842.1, change: -35.4, changePercent: -0.09, updatedAt },
  { symbol: 'AAPL', name: 'Apple', price: 229.12, change: 2.31, changePercent: 1.02, updatedAt },
  { symbol: 'MSFT', name: 'Microsoft', price: 416.72, change: -1.18, changePercent: -0.28, updatedAt },
  { symbol: 'NVDA', name: 'NVIDIA', price: 118.46, change: 3.94, changePercent: 3.44, updatedAt },
  { symbol: 'TSLA', name: 'Tesla', price: 246.38, change: -4.12, changePercent: -1.65, updatedAt },
  { symbol: 'AMZN', name: 'Amazon', price: 188.91, change: 0.84, changePercent: 0.45, updatedAt },
];

const items: MarketItem[] = [
  { id: 'nvidia-earnings', symbol: 'NVDA', title: '芯片板块盘前走强，市场等待下一轮 AI 资本开支数据', source: 'Market Brief', category: 'news', relevance: 5, credibility: 4, repetition: 2, priceImpact: 'positive' },
  { id: 'fed-rate', title: '投资者关注本周利率会议及经济数据', source: 'Company & Macro Desk', category: 'filing', relevance: 5, credibility: 5, repetition: 3, priceImpact: 'neutral' },
  { id: 'social-meme', symbol: 'TSLA', title: '社交平台出现大量“明天翻倍”短帖', source: 'Reddit', category: 'social', relevance: 1, credibility: 1, repetition: 5, priceImpact: 'neutral' },
  { id: 'apple-services', symbol: 'AAPL', title: '服务业务增长预期被多家媒体重复引用', source: 'Market News', category: 'news', relevance: 3, credibility: 3, repetition: 4, priceImpact: 'positive' },
];

export function getQuote(symbol: string): Quote | undefined {
  return quotes.find((quote) => quote.symbol === symbol.toUpperCase());
}

export function getOverview() {
  return { updatedAt, indices: quotes.slice(0, 3), watchlist: quotes.slice(3) };
}

export function getStock(symbol: string) {
  const quote = getQuote(symbol);
  if (!quote) return undefined;
  const history = [0.96, 0.98, 0.97, 1.01, 1.0].map((factor, index) => ({ day: index + 1, price: Number((quote.price * factor).toFixed(2)) }));
  return { quote, history, items: items.filter((item) => item.symbol === quote.symbol) };
}

export function getNoiseGroups() {
  return {
    updatedAt,
    groups: {
      important: items.filter((item) => item.relevance >= 5),
      general: items.filter((item) => item.relevance >= 3 && item.relevance < 5),
      noise: items.filter((item) => item.repetition >= 5 || item.credibility <= 1),
      risk: items.filter((item) => item.priceImpact === 'negative'),
    },
  };
}
