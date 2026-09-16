import { describe, expect, it } from 'vitest';
import { signalTone } from '../src/strategy-view';

describe('strategy view helpers', () => {
  it('maps strategy outcomes to readable tones', () => {
    expect(signalTone('BUY CANDIDATE')).toBe('positive');
    expect(signalTone('WATCH')).toBe('caution');
    expect(signalTone('AVOID')).toBe('negative');
    expect(signalTone('INSUFFICIENT DATA')).toBe('muted');
  });
});
