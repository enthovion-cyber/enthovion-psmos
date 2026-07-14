export function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export function daysBetween(start: Date | string, end: Date | string): number {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000);
}
