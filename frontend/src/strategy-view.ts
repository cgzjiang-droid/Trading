export type Signal = 'BUY CANDIDATE' | 'WATCH' | 'AVOID' | 'INSUFFICIENT DATA';
export function signalTone(signal: Signal) { return signal === 'BUY CANDIDATE' ? 'positive' : signal === 'WATCH' ? 'caution' : signal === 'AVOID' ? 'negative' : 'muted'; }
