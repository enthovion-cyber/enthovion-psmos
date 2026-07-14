'use client';

import { FileText } from 'lucide-react';
import { SafeguardPanel } from './HazopIplStatusBadge';

export function HazopSafeguardDocumentPanel({ rows }: { rows: any[] }) {
  return (
    <SafeguardPanel title="Document / P&ID Links">
      <div className="space-y-2">
        {rows.slice(0, 6).map((row) => <div key={`${row.id}-${row.document_id}`} className="flex gap-3 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><FileText size={15} /><div><div className="font-semibold">{row.document?.document_number ?? row.document_id ?? 'Document'}</div><div className="text-xs text-[var(--psm-muted)]">{row.safeguard_name ?? row.document_type ?? 'Evidence'}</div></div></div>)}
        {!rows.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">No document or P&ID links captured.</div> : null}
      </div>
    </SafeguardPanel>
  );
}
