'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Link2 } from 'lucide-react';

export function HazopLinkedRecordsPreview({ preview, onNavigate }: { preview: any; onNavigate: (tab?: string) => void }) {
  if (preview.restricted) return <Panel title="6. Linked Records Preview"><Empty text="Restricted by permission." /></Panel>;
  return (
    <Panel title="6. Linked Records Preview" action={<button onClick={() => onNavigate('Linked Records')} className="text-xs font-semibold text-primary">View all</button>}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(preview.counts ?? []).map((item: any) => (
          <button key={item.key} onClick={() => onNavigate('Linked Records')} className="rounded-lg border border-[var(--psm-line)] p-3 text-left hover:bg-[var(--psm-surface-2)]">
            <Link2 size={15} className="mb-2 text-primary" />
            <div className="text-xl font-semibold">{item.count}</div>
            <div className="text-xs text-[var(--psm-muted)]">{item.label}</div>
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Warning label="Open blockers" value={preview.openBlockers} />
        <Warning label="Outdated documents" value={preview.outdatedDocuments} />
        <Warning label="LOPA pending" value={preview.lopaPending} />
      </div>
    </Panel>
  );
}

function Warning({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm"><AlertTriangle size={14} className="mr-2 inline text-amber-300" />{label}<span className="float-right font-semibold text-amber-300">{value}</span></div>;
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>{action}</div>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}
