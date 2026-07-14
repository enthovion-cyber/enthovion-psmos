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
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-cyan-300/15 bg-[#061525] p-5 shadow-2xl shadow-black/40">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">MOC Preview</p><h2 className="text-xl font-black text-white">{moc.moc_number ?? moc.mocNumber ?? selectedMocId}</h2></div>
        <button onClick={() => setSelectedMocId(undefined)} className="rounded-md border border-white/10 p-2 text-slate-300 hover:text-white"><X size={18} /></button>
      </div>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message="Unable to load MOC preview." /> : null}
      {query.data ? <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="text-lg font-black text-white">{moc.title}</p><p className="mt-2 text-sm text-slate-400">{moc.description ?? 'No description'}</p><div className="mt-3 flex flex-wrap gap-2"><Badge tone={statusTone(moc.status)}>{moc.status}</Badge><Badge tone={riskTone(moc.risk_level ?? moc.riskLevel)}>{moc.risk_level ?? moc.riskLevel}</Badge></div></div>
        <div className="grid grid-cols-2 gap-3 text-sm"><Info label="Change Type" value={moc.change_type ?? moc.changeType} /><Info label="Workflow" value={moc.workflow_status ?? moc.workflowStatus} /><Info label="Site" value={moc.site_name ?? moc.site?.name ?? moc.site_id} /><Info label="Target Date" value={moc.target_implementation_date ?? moc.targetImplementationDate} /></div>
        <Link href={`/moc/${selectedMocId}`} className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 text-sm font-black text-white">Open Full MOC Record</Link>
      </div> : null}
    </aside>
  );
}

function Info({ label, value }: { label: string; value?: any }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-bold text-white">{value ?? '-'}</p></div>;
}
