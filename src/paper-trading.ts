import { randomUUID } from 'node:crypto';
import { getDatabase } from './db.js';
import { getQuote, type Quote } from './market-data.js';

type OrderInput = { symbol: string; side: 'buy' | 'sell'; quantity: number; reason?: string };

export function initTradingSchema() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS watchlist (symbol TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS account (id INTEGER PRIMARY KEY CHECK (id = 1), cash REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, symbol TEXT NOT NULL, side TEXT NOT NULL,
      quantity INTEGER NOT NULL, price REAL NOT NULL, reason TEXT,
      created_at TEXT NOT NULL
    );
  `);
  getDatabase().prepare("INSERT OR IGNORE INTO account (id, cash) VALUES (1, 100000)").run();
}

export function listWatchlist() {
  return getDatabase().prepare('SELECT symbol FROM watchlist ORDER BY rowid').all();
}

export function addWatchlist(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  if (!getQuote(normalized)) return undefined;
  getDatabase().prepare('INSERT OR IGNORE INTO watchlist (symbol) VALUES (?)').run(normalized);
  return { symbol: normalized };
}

export function removeWatchlist(symbol: string) {
  return getDatabase().prepare('DELETE FROM watchlist WHERE symbol = ?').run(symbol.trim().toUpperCase()).changes > 0;
}

function currentPosition(symbol: string) {
  const rows = getDatabase().prepare('SELECT side, quantity, price FROM orders WHERE symbol = ? ORDER BY rowid').all(symbol) as Array<{ side: string; quantity: number; price: number }>;
  let quantity = 0;
  let averageCost = 0;
  for (const row of rows) {
    if (row.side === 'buy') {
      averageCost = ((averageCost * quantity) + (row.price * row.quantity)) / (quantity + row.quantity);
      quantity += row.quantity;
    } else {
      quantity -= row.quantity;
      if (quantity === 0) averageCost = 0;
    }
  }
  return { quantity, averageCost };
}

export function createOrder(input: OrderInput) {
  const symbol = input.symbol.trim().toUpperCase();
  const quote = getQuote(symbol);
  if (!quote) return { error: { code: 'STOCK_NOT_FOUND', message: 'Stock not found' } };
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) return { error: { code: 'INVALID_QUANTITY', message: 'Quantity must be a positive integer' } };
  const account = getDatabase().prepare('SELECT cash FROM account WHERE id = 1').get() as { cash: number };
  const position = currentPosition(symbol);
  if (input.side === 'buy' && input.quantity * quote.price > account.cash) return { error: { code: 'INSUFFICIENT_CASH', message: 'Insufficient cash' } };
  if (input.side === 'sell' && input.quantity > position.quantity) return { error: { code: 'INSUFFICIENT_POSITION', message: 'Insufficient position' } };
  const amount = input.quantity * quote.price;
  const nextCash = input.side === 'buy' ? account.cash - amount : account.cash + amount;
  const database = getDatabase();
  database.exec('BEGIN');
  try {
    database.prepare('UPDATE account SET cash = ? WHERE id = 1').run(Number(nextCash.toFixed(2)));
    const order = { id: randomUUID(), symbol, side: input.side, quantity: input.quantity, price: quote.price, reason: input.reason ?? null, createdAt: new Date().toISOString() };
    database.prepare('INSERT INTO orders (id, symbol, side, quantity, price, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(order.id, order.symbol, order.side, order.quantity, order.price, order.reason, order.createdAt);
    database.exec('COMMIT');
    return order;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function listOrders() {
  return getDatabase().prepare('SELECT id, symbol, side, quantity, price, reason, created_at AS createdAt FROM orders ORDER BY rowid DESC').all();
}

export function getPortfolio() {
  const orders = getDatabase().prepare('SELECT symbol, side, quantity, price FROM orders ORDER BY rowid').all() as Array<{ symbol: string; side: string; quantity: number; price: number }>;
  const positions = new Map<string, { quantity: number; averageCost: number; realizedPnl: number }>();
  for (const order of orders) {
    const position = positions.get(order.symbol) ?? { quantity: 0, averageCost: 0, realizedPnl: 0 };
    if (order.side === 'buy') {
      position.averageCost = ((position.averageCost * position.quantity) + order.price * order.quantity) / (position.quantity + order.quantity);
      position.quantity += order.quantity;
    } else {
      position.realizedPnl += (order.price - position.averageCost) * order.quantity;
      position.quantity -= order.quantity;
      if (position.quantity === 0) position.averageCost = 0;
    }
    positions.set(order.symbol, position);
  }
  const output = [...positions.entries()].filter(([, p]) => p.quantity > 0).map(([symbol, p]) => {
    const quote = getQuote(symbol) as Quote;
    const marketValue = p.quantity * quote.price;
    return { symbol, quantity: p.quantity, averageCost: Number(p.averageCost.toFixed(2)), marketValue: Number(marketValue.toFixed(2)), unrealizedPnl: Number(((quote.price - p.averageCost) * p.quantity).toFixed(2)) };
  });
  const account = getDatabase().prepare('SELECT cash FROM account WHERE id = 1').get() as { cash: number };
  const realizedPnl = Number([...positions.values()].reduce((sum, p) => sum + p.realizedPnl, 0).toFixed(2));
  const marketValue = output.reduce((sum, p) => sum + p.marketValue, 0);
  return { cash: Number(account.cash.toFixed(2)), marketValue: Number(marketValue.toFixed(2)), totalAssets: Number((account.cash + marketValue).toFixed(2)), realizedPnl, positions: output };
}
