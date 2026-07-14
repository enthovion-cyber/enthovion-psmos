export type ActionAgingBucket = '0-30' | '31-60' | '61-90' | '90+';

export function ageAction(dueDate: Date | string, now = new Date()): ActionAgingBucket {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(dueDate).getTime()) / 86_400_000));
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

export function shouldEscalate(dueDate: Date | string, status: string, now = new Date()): boolean {
  return status !== 'CLOSED' && new Date(dueDate).getTime() < now.getTime();
}
