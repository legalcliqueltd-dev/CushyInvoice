const baseFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatAmount = (value: number | string): string => {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0.00";
  return baseFormatter.format(n);
};

export const formatMoney = (symbol: string, value: number | string): string => {
  return `${symbol}${formatAmount(value)}`;
};

export const formatMoneyCompact = (symbol: string, value: number | string): string => {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return `${symbol}0`;
  if (Math.abs(n) >= 1_000_000) {
    return `${symbol}${compactFormatter.format(n)}`;
  }
  return `${symbol}${baseFormatter.format(n)}`;
};
