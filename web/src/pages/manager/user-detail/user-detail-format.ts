export function formatAmount(value: number): string {
  return String(Math.round(value * 100) / 100);
}
