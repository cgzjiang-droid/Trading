import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Candle } from './strategy.js';

export async function loadHistory(symbol: string, directory = process.env.HISTORY_DIR ?? 'data/history'): Promise<Candle[]> {
  const text = await readFile(path.join(directory, `${symbol.trim().toUpperCase()}.csv`), 'utf8');
  const lines = text.trim().split(/\r?\n/); const headers = lines.shift()!.split(',').map((header) => header.trim().toLowerCase());
  const index = (name: string) => headers.indexOf(name);
  return lines.map((line) => { const values = line.split(','); return { date: values[0], open: Number(values[index('open')]), high: Number(values[index('high')]), low: Number(values[index('low')]), close: Number(values[index('close')]), volume: Number(values[index('volume')]) }; }).filter((candle) => Number.isFinite(candle.close) && candle.close > 0);
}
