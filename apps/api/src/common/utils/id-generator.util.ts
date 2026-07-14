export function generateBusinessId(prefix: string, sequence: number, date = new Date()): string {
  const year = date.getUTCFullYear();
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}
