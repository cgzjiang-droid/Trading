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
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.indicators.ema20).toBeGreaterThan(result.indicators.ema50);
    expect(result.evidence.supporting.length).toBeGreaterThan(0);
    expect(result.evidence.opposing).toEqual(expect.any(Array));
  });

  it('refuses to make a decision when history is too short', () => {
    const result = scoreStrategy(candles(30));
    expect(result.signal).toBe('INSUFFICIENT DATA');
    expect(result.score).toBeNull();
  });
});
