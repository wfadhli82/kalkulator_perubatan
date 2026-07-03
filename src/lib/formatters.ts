export const formatCurrencyMYR = (value: number): string =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

export const formatMoneyText = (value: number): string => value.toFixed(2);

export const unique = <T,>(values: T[]): T[] => Array.from(new Set(values));

export const productLabel = (name: string, spec?: string): string =>
  spec ? `${name} ${spec}`.trim() : name.trim();
