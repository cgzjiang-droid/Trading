import { describe, expect, it } from 'vitest';
import { scoreStrategy, type Candle } from '../src/strategy.js';

function candles(count = 220): Candle[] {
  return Array.from({ length: count }, (_, index) => {
    const close = 100 + index * 0.25;
    return { date: `2025-01-${String((index % 28) + 1).padStart(2, '0')}`, open: close - 0.3, high: close + 1, low: close - 1, close, volume: 2_000_000 };
  });
}

describe('strategy scoring', () => {
  it('returns a signal with indicators and explainable evidence', () => {
    const result = scoreStrategy(candles());
    expect(result.signal).toBe('BUY CANDIDATE');
    expect(result.action).toBe('BUY');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.indicators.ema20).toBeGreaterThan(result.indicators.ema50);
    expect(result.evidence.supporting.length).toBeGreaterThan(0);
    expect(result.evidence.opposing).toEqual(expect.any(Array));
    expect(result.plan.stopLoss).toBeLessThan(result.indicators.close);
    expect(result.plan.takeProfit).toBeGreaterThan(result.indicators.close);
  });

  it('vetoes a long setup when the market regime is bearish', () => {
    const stock = candles();
    const market = candles().map((candle, index) => ({ ...candle, close: 300 - index * 0.25, open: 300 - index * 0.25, high: 301 - index * 0.25, low: 299 - index * 0.25 }));
    const result = scoreStrategy(stock, market);
    expect(result.regime).toBe('BEAR');
    expect(result.action).toBe('AVOID');
    expect(result.evidence.opposing.join(' ')).toContain('市场环境');
  });

  it('refuses to make a decision when history is too short', () => {
    const result = scoreStrategy(candles(30));
    expect(result.signal).toBe('INSUFFICIENT DATA');
    expect(result.score).toBeNull();
  });
});
