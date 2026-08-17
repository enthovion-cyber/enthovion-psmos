export function scoreInRange(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 5;
}
