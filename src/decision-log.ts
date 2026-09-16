import { randomUUID } from 'node:crypto';
import { getDatabase } from './db.js';
import { getQuote } from './market-data.js';

type DecisionInput = { symbol: string; side: 'buy' | 'sell'; quantity: number; price: number; reason: string };

export function initDecisionLogSchema() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS decision_logs (
      id TEXT PRIMARY KEY, symbol TEXT NOT NULL, side TEXT NOT NULL,
      quantity INTEGER NOT NULL, price REAL NOT NULL, reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function createDecisionLog(input: DecisionInput) {
  const symbol = input.symbol.trim().toUpperCase();
  if (!getQuote(symbol)) return undefined;
  if (!Number.isInteger(input.quantity) || input.quantity <= 0 || !Number.isFinite(input.price) || input.price <= 0 || !input.reason.trim()) return null;
  const log = { id: randomUUID(), symbol, side: input.side, quantity: input.quantity, price: input.price, reason: input.reason.trim(), createdAt: new Date().toISOString() };
  getDatabase().prepare('INSERT INTO decision_logs (id, symbol, side, quantity, price, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(log.id, log.symbol, log.side, log.quantity, log.price, log.reason, log.createdAt);
  return log;
}

export function listDecisionLogs() {
  return (getDatabase().prepare('SELECT id, symbol, side, quantity, price, reason, created_at AS createdAt FROM decision_logs ORDER BY rowid DESC').all() as Array<{ id: string; symbol: string; side: 'buy' | 'sell'; quantity: number; price: number; reason: string; createdAt: string }>).map((log) => {
    const currentPrice = getQuote(log.symbol)?.price ?? log.price;
    const priceChange = (log.side === 'buy' ? currentPrice - log.price : log.price - currentPrice);
    return { ...log, currentPrice, priceChange: Number(priceChange.toFixed(2)), outcome: priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral' };
  });
}
