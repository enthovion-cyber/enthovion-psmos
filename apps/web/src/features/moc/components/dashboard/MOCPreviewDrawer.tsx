'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Badge, ErrorState, LoadingState, riskTone, statusTone } from '../moc-detail-ui';
import { useMOCPreview } from '../../hooks/useMOCPreview';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

export function MOCPreviewDrawer() {
  const selectedMocId = useMOCDashboardStore((state) => state.selectedMocId);
  const setSelectedMocId = useMOCDashboardStore((state) => state.setSelectedMocId);
  const query = useMOCPreview(selectedMocId);
  if (!selectedMocId) return null;
  const moc = query.data ?? {};
  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl text-[var(--psm-fg)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">MOC Preview</p>
          <h2 className="text-xl font-black text-[var(--psm-fg)]">{moc.moc_number ?? moc.mocNumber ?? selectedMocId}</h2>
        </div>
        <button onClick={() => setSelectedMocId(undefined)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-[var(--psm-fg)] hover:bg-[var(--psm-surface)]"><X size={18} /></button>
      </div>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message="Unable to load MOC preview." /> : null}
      {query.data ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
            <p className="text-lg font-black text-[var(--psm-fg)]">{moc.title}</p>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">{moc.description ?? 'No description'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={statusTone(moc.status)}>{moc.status}</Badge>
              <Badge tone={riskTone(moc.risk_level ?? moc.riskLevel)}>{moc.risk_level ?? moc.riskLevel}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Change Type" value={moc.change_type ?? moc.changeType} />
            <Info label="Workflow" value={moc.workflow_status ?? moc.workflowStatus} />
            <Info label="Site" value={moc.site_name ?? moc.site?.name ?? moc.site_id} />
            <Info label="Target Date" value={moc.target_implementation_date ?? moc.targetImplementationDate} />
          </div>
          <Link href={`/moc/${selectedMocId}`} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow hover:opacity-90 transition-all">
            Open Full MOC Record
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

function Info({ label, value }: { label: string; value?: any }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--psm-fg)]">{value ?? '-'}</p>
    </div>
  );
}
