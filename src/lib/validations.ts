export const parsePositiveInteger = (value: string): number | null => {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
};
