export function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatChange(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
