'use client';

import { Plus } from 'lucide-react';
import { HazopAvatar } from './HazopAvatarGroup';

function badge(status?: string) {
  const value = status ?? 'Open';
  const tone = ['High', 'Critical', 'Safety Critical', 'Overdue'].includes(value) ? 'border-red-500/30 bg-red-500/10 text-red-300' : ['Medium', 'Open', 'In Progress'].includes(value) ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  return <span className={`rounded px-2 py-1 text-[11px] font-semibold ${tone}`}>{value}</span>;
}

export function HazopRecommendationsPreview({ preview, canCreate, onNavigate }: { preview: any; canCreate?: boolean; onNavigate: (tab?: string) => void }) {
  if (preview.restricted) return <Restricted title="5. Recommendations Preview" />;
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">5. Recommendations Preview</h3>
        <div className="flex gap-2">
          {canCreate ? <button onClick={() => onNavigate('Recommendations / Actions')} className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold"><Plus size={13} className="mr-1 inline" />Create</button> : null}
          <button onClick={() => onNavigate('Recommendations / Actions')} className="text-xs font-semibold text-primary">View all ({preview.total ?? 0})</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="text-xs uppercase text-[var(--psm-muted)]"><tr>{['Rec. No.', 'Title', 'Priority', 'Owner', 'Due Date', 'Status', 'Action'].map((head) => <th key={head} className="border-b border-[var(--psm-line)] px-2 py-2 text-left">{head}</th>)}</tr></thead>
          <tbody>
            {(preview.rows ?? []).map((row: any) => (
              <tr key={row.id} className="border-b border-[var(--psm-line)]">
                <td className="px-2 py-3 text-primary">{row.recommendation_number}</td>
                <td className="px-2 py-3">{row.title ?? row.recommendation_text}</td>
                <td className="px-2 py-3">{badge(row.priority)}</td>
                <td className="px-2 py-3"><HazopAvatar profile={row.owner} /></td>
                <td className="px-2 py-3 text-[var(--psm-muted)]">{row.due_date ?? '-'}</td>
                <td className="px-2 py-3">{badge(row.status)}</td>
                <td className="px-2 py-3 text-[var(--psm-muted)]">{row.action?.status ?? (row.linked_action_id ? 'Linked' : 'Not linked')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!(preview.rows ?? []).length ? <Empty text="No recommendations are available." /> : null}
    </section>
  );
}

function Restricted({ title }: { title: string }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h3 className="mb-3 text-sm font-semibold uppercase">{title}</h3><Empty text="Restricted by permission." /></section>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}
