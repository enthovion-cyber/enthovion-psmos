export function ReliefDeviceStatusBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Not linked';
  const tone = /failed|overdue|not linked|impaired|bypass/i.test(text) ? 'text-danger bg-danger/10 border-danger/30' : /active|in service|linked/i.test(text) ? 'text-success bg-success/10 border-success/30' : 'text-warning bg-warning/10 border-warning/30';
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}
