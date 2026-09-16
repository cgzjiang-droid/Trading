import { describe, expect, it } from 'vitest';
import { formatChange, formatCurrency } from '../src/view-model';

describe('portfolio display formatting', () => {
  it('formats currency and signed percentage changes', () => {
    expect(formatCurrency(100000)).toBe('$100,000.00');
    expect(formatChange(1.25)).toBe('+1.25%');
    expect(formatChange(-0.5)).toBe('-0.50%');
  });
});
