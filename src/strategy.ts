export type Candle = { date: string; open: number; high: number; low: number; close: number; volume: number };
export type StrategyResult = {
  signal: 'BUY CANDIDATE' | 'WATCH' | 'AVOID' | 'INSUFFICIENT DATA';
  action: 'BUY' | 'WATCH' | 'AVOID';
  regime: 'BULL' | 'RANGE' | 'BEAR' | 'UNKNOWN';
  plan: { entry: number; stopLoss: number; takeProfit: number; riskReward: number; maxPositionUsd: number } | null;
  score: number | null;
  indicators: { close: number; sma50: number; ema20: number; ema50: number; rsi14: number; macd: number; macdSignal: number; atr14: number; volumeRatio: number };
  evidence: { supporting: string[]; opposing: string[] };
};

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const sma = (values: number[], period: number) => average(values.slice(-period));
const ema = (values: number[], period: number) => {
  const multiplier = 2 / (period + 1); let result = values[0];
  for (const value of values.slice(1)) result = (value - result) * multiplier + result;
  return result;
};
const rsi = (values: number[], period: number) => {
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const gains = changes.map((change) => Math.max(change, 0)); const losses = changes.map((change) => Math.max(-change, 0));
  const avgGain = average(gains.slice(-period)); const avgLoss = average(losses.slice(-period));
  return avgLoss === 0 ? 100 : Number((100 - (100 / (1 + avgGain / avgLoss))).toFixed(2));
};
const atr = (candles: Candle[], period: number) => {
  const ranges = candles.slice(1).map((candle, index) => Math.max(candle.high - candle.low, Math.abs(candle.high - candles[index].close), Math.abs(candle.low - candles[index].close)));
  return Number(average(ranges.slice(-period)).toFixed(2));
};

export function scoreStrategy(candles: Candle[], marketCandles?: Candle[]): StrategyResult {
  const empty = { close: 0, sma50: 0, ema20: 0, ema50: 0, rsi14: 0, macd: 0, macdSignal: 0, atr14: 0, volumeRatio: 0 };
  if (candles.length < 60) return { signal: 'INSUFFICIENT DATA', action: 'WATCH', regime: 'UNKNOWN', score: null, indicators: empty, plan: null, evidence: { supporting: [], opposing: ['至少需要 60 根日线数据'] } };
  const closes = candles.map((candle) => candle.close); const volumes = candles.map((candle) => candle.volume);
  const ema20 = ema(closes, 20); const ema50 = ema(closes, 50); const fastSeries = closes.map((_, index) => ema(closes.slice(0, index + 1), 12) - ema(closes.slice(0, index + 1), 26));
  const macd = fastSeries.at(-1) ?? 0; const macdSignal = ema(fastSeries.slice(-35), 9); const volumeRatio = volumes.at(-1)! / sma(volumes, 20);
  const indicators = { close: closes.at(-1)!, sma50: Number(sma(closes, 50).toFixed(2)), ema20: Number(ema20.toFixed(2)), ema50: Number(ema50.toFixed(2)), rsi14: rsi(closes, 14), macd: Number(macd.toFixed(4)), macdSignal: Number(macdSignal.toFixed(4)), atr14: atr(candles, 14), volumeRatio: Number(volumeRatio.toFixed(2)) };
  const marketCloses = marketCandles?.map((candle) => candle.close) ?? closes;
  const marketSma = sma(marketCloses, Math.min(50, marketCloses.length)); const marketFast = ema(marketCloses, Math.min(20, marketCloses.length));
  const regime = marketCloses.at(-1)! > marketSma && marketFast > marketSma ? 'BULL' : marketCloses.at(-1)! < marketSma && marketFast < marketSma ? 'BEAR' : 'RANGE';
  let score = 0; const supporting: string[] = []; const opposing: string[] = [];
  if (regime === 'BULL') { score += 15; supporting.push('市场环境偏多，允许趋势策略工作'); } else if (regime === 'BEAR') { opposing.push('市场环境偏空，否决做多信号'); } else opposing.push('市场环境震荡，降低追突破意愿');
  if (ema20 > ema50) { score += 30; supporting.push('EMA20 高于 EMA50，短期趋势向上'); } else opposing.push('EMA20 低于 EMA50，趋势未确认');
  if (closes.at(-1)! > indicators.sma50) { score += 10; supporting.push('价格位于 SMA50 上方'); } else opposing.push('价格低于 SMA50');
  if (macd > macdSignal) { score += 20; supporting.push('MACD 高于信号线'); } else opposing.push('MACD 尚未形成多头确认');
  if (indicators.rsi14 >= 45 && indicators.rsi14 <= 70) { score += 20; supporting.push(`RSI ${indicators.rsi14} 处于健康动量区间`); } else if (indicators.rsi14 > 70) { score += 5; opposing.push(`RSI ${indicators.rsi14} 偏高，追涨风险增加`); } else opposing.push(`RSI ${indicators.rsi14} 偏弱`);
  if (volumeRatio >= 1) { score += 15; supporting.push(`成交量为 20 日均量的 ${indicators.volumeRatio} 倍`); } else opposing.push(`成交量仅为 20 日均量的 ${indicators.volumeRatio} 倍`);
  const breakoutLevel = Math.max(...closes.slice(-21, -1));
  if (closes.at(-1)! > breakoutLevel) { score += 10; supporting.push('价格突破近 20 日高点'); } else opposing.push('尚未突破近 20 日高点');
  const vetoed = regime === 'BEAR'; const signal = vetoed ? 'AVOID' : score >= 60 ? 'BUY CANDIDATE' : score >= 35 ? 'WATCH' : 'AVOID';
  const action = signal === 'BUY CANDIDATE' ? 'BUY' : signal === 'WATCH' ? 'WATCH' : 'AVOID';
  const entry = indicators.close; const stopLoss = Number((entry - indicators.atr14 * 1.5).toFixed(2));
  return { signal, action, regime, score, indicators, plan: { entry, stopLoss, takeProfit: Number((entry + (entry - stopLoss) * 2).toFixed(2)), riskReward: 2, maxPositionUsd: 10000 }, evidence: { supporting, opposing } };
}
