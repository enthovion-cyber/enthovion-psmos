import { ArrowLeft, Ban, Edit3, FileDown, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { LopaOverview } from '../../types/lopa-overview.types';
import { LopaSilBadge, LopaSourceBadge, LopaStatusBadge } from '../shared/LopaBadges';
import { TonePill } from '../overview/LopaOverviewShared';

export function LopaDetailHeader({
  overview,
  onRefresh,
  onEditTitle,
  onCancel,
  onReopen,
  onStartReview,
  isBusy
}: {
  overview: LopaOverview;
  onRefresh: () => void;
  onEditTitle: () => void;
  onCancel: () => void;
  onReopen: () => void;
  onStartReview: () => void;
  isBusy?: boolean;
}) {
  const study = overview.header;
  return (
    <header className="rounded-xl border border-cyan-300/10 bg-[#071525] shadow-xl shadow-black/10">
      <div className="flex flex-col gap-4 border-b border-cyan-300/10 p-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link href="/lopa" className="lopa-button-secondary"><ArrowLeft size={14} /> Register</Link>
            <LopaStatusBadge value={study.status} />
            <LopaSourceBadge value={study.source} />
            <TonePill tone={study.priority === 'High' ? 'danger' : 'warning'}>{study.priority ?? 'Medium'}</TonePill>
            <TonePill tone={study.calculationStatus === 'Complete' ? 'success' : 'warning'}>{study.calculationStatus}</TonePill>
            <TonePill tone={study.iplValidationStatus === 'Validated' ? 'success' : 'warning'}>{study.iplValidationStatus}</TonePill>
            <LopaSilBadge required={study.silRequired} target={study.targetSil} gap={study.silGapStatus} />
            {study.overdue ? <TonePill tone="danger">Overdue</TonePill> : null}
            {study.readOnly ? <TonePill tone="neutral">Read-only</TonePill> : null}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">{study.lopaNumber}</h1>
            <div className="pb-0.5 text-lg font-semibold text-slate-200">{study.title}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-400 md:grid-cols-4 xl:grid-cols-8">
            <Meta label="Site" value={study.siteId} />
            <Meta label="Unit" value={study.unitId} />
            <Meta label="Area" value={study.areaId} />
            <Meta label="Equipment" value={study.equipmentTag} />
            <Meta label="Owner" value={study.ownerProfile?.displayName ?? study.ownerId} />
            <Meta label="Facilitator" value={study.facilitatorId} />
            <Meta label="Due date" value={study.dueDate} />
            <Meta label="Revalidation" value={study.revalidationDueDate} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {overview.permissions.canEdit ? <button onClick={onEditTitle} disabled={isBusy} className="lopa-button-secondary"><Edit3 size={14} /> Edit</button> : null}
          <button onClick={() => window.print()} className="lopa-button-secondary"><FileDown size={14} /> Export Summary</button>
          {!study.readOnly ? <button onClick={onStartReview} className="lopa-button-primary">Start Review</button> : null}
          {overview.permissions.canCancel ? <button onClick={onCancel} disabled={isBusy} className="lopa-button-secondary text-red-100"><XCircle size={14} /> Cancel</button> : null}
          {overview.permissions.canReopen ? <button onClick={onReopen} disabled={isBusy} className="lopa-button-secondary"><RotateCcw size={14} /> Reopen</button> : null}
          <button onClick={onRefresh} disabled={isBusy} className="lopa-button-secondary"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="Source" value={study.sourceRecordId ?? study.hazopScenarioId ?? 'Manual'} />
        <Metric label="Consequence" value={study.consequenceSeverity ?? 'Incomplete'} />
        <Metric label="IE Frequency" value={study.initiatingEventFrequency ?? 'Missing'} />
        <Metric label="IPLs" value={`${study.creditedIplCount ?? 0}/${study.iplCount ?? 0}`} />
        <Metric label="Mitigated Freq." value={study.mitigatedEventFrequency ?? 'Not calculated'} />
        <Metric label="Tolerable Freq." value={study.tolerableFrequency ?? 'Not set'} />
        <Metric label="Open Actions" value={study.openActions ?? 0} />
        <Metric label="Updated" value={study.updatedAt ? new Date(study.updatedAt).toLocaleDateString() : '-'} />
      </div>
    </header>
  );
}

function Meta({ label, value }: { label: string; value?: string | number | null | undefined }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-slate-600">{label}</div><div className="mt-1 font-semibold text-slate-200">{value ?? '-'}</div></div>;
}

function Metric({ label, value }: { label: string; value?: string | number | null | undefined }) {
  return <div className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3"><div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 truncate text-sm font-bold text-white">{value ?? '-'}</div></div>;
}
