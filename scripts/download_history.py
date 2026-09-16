"""Download local US equity history for research/backtesting."""
from __future__ import annotations
import argparse
from pathlib import Path
import yfinance as yf

def download(symbols: list[str], period: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for raw_symbol in symbols:
        symbol = raw_symbol.strip().upper()
        if not symbol: continue
        frame = yf.download(symbol, period=period, interval="1d", auto_adjust=False, progress=False, group_by="column")
        if frame.empty: raise RuntimeError(f"No history returned for {symbol}")
        frame.columns = [str(column[0] if isinstance(column, tuple) else column).lower() for column in frame.columns]
        required = {"open", "high", "low", "close", "volume"}
        missing = required.difference(frame.columns)
        if missing: raise RuntimeError(f"{symbol} is missing columns: {', '.join(sorted(missing))}")
        frame.reset_index().to_csv(output_dir / f"{symbol}.csv", index=False)
        print(f"saved {symbol}: {len(frame)} daily bars")

def main() -> None:
    parser = argparse.ArgumentParser(description="Download Yahoo Finance daily OHLCV history")
    parser.add_argument("symbols", nargs="+", help="US tickers, e.g. AAPL MSFT SPY")
    parser.add_argument("--period", default="2y")
    parser.add_argument("--output", default="data/history")
    args = parser.parse_args()
    download(args.symbols, args.period, Path(args.output))

if __name__ == "__main__": main()
