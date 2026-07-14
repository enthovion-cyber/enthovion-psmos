import { X } from 'lucide-react';
import type { PermitHistoryEvent } from '../../services/ptw-history.service';

export function BeforeAfterDrawer({ event, onClose }: { event: PermitHistoryEvent | null; onClose: () => void }) {
  if (!event) return null;
  const before = event.before_value ?? event.before_data ?? null;
  const after = event.after_value ?? event.after_data ?? null;
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm"><aside className="h-full w-full max-w-2xl overflow-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><div><h3 className="text-lg font-semibold">{event.event_title ?? event.title ?? event.event_type}</h3><p className="mt-1 text-sm text-[var(--psm-muted)]">{event.event_category ?? 'System'} · {new Date(event.created_at).toLocaleString()}</p></div><button onClick={onClose} className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"><X size={18} /></button></div><div className="space-y-4 p-5"><Info label="Changed By" value={event.user_name ?? event.user_id ?? '-'} /><Info label="Role" value={event.user_role ?? '-'} /><Info label="Source" value={event.related_record_type ?? event.event_category ?? '-'} /><Info label="IP Address" value={event.ip_address ?? '-'} /><div className="grid gap-4 lg:grid-cols-2"><Panel title="Before" value={before} /><Panel title="After" value={after} /></div></div></aside></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><div className="text-xs uppercase text-[var(--psm-muted)]">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

function Panel({ title, value }: { title: string; value: unknown }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="mb-3 text-sm font-semibold">{title}</div><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-black/20 p-3 text-xs">{value ? JSON.stringify(value, null, 2) : 'No value recorded.'}</pre></div>;
}
