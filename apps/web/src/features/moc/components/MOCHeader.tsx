'use client';

import { ArrowLeft, Copy, Download, Edit3, FileUp, PlayCircle, Printer, RotateCcw, Send, ShieldCheck, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { mocService } from '../services/moc.service';
import { Badge, riskTone, statusTone } from './moc-detail-ui';
import { useMOCMutation } from '../hooks/useMOCMutations';

export function MOCHeader({ moc, onEdit, onUpload }: { moc: any; onEdit: () => void; onUpload: () => void }) {
  const mutations = useMOCMutation(moc.id);
  const run = (name: keyof ReturnType<typeof useMOCMutation>, comment?: string) => {
    const mutation = mutations[name] as any;
    mutation?.mutate(comment);
  };

  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition-colors">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <Link
            href="/moc"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <ArrowLeft size={14} /> Back to MOC Register
          </Link>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <h1 className="font-mono text-2xl font-black tracking-tight text-[var(--psm-fg)] sm:text-3xl">
              {moc.moc_number}
            </h1>
            <Badge tone="blue">{moc.change_type}</Badge>
            <Badge tone={statusTone(moc.status)}>{moc.status}</Badge>
            <Badge tone={riskTone(moc.risk_level)}>{moc.risk_level} Risk</Badge>
          </div>
          <p className="max-w-4xl text-sm font-medium text-[var(--psm-fg)] sm:text-base">
            {moc.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--psm-muted)]">
            <span>Site: <strong className="text-[var(--psm-fg)]">{moc.site?.name ?? moc.site_id}</strong></span>
            <span>Unit/Area: <strong className="text-[var(--psm-fg)]">{moc.unit?.name ?? 'No unit'} / {moc.area?.name ?? 'No area'}</strong></span>
            <span>Originator: <strong className="text-[var(--psm-fg)]">{moc.originator?.displayName ?? moc.originator_id ?? '-'}</strong></span>
            <span>Target: <strong className="text-[var(--psm-fg)]">{moc.target_implementation_date ?? '-'}</strong></span>
            {moc.summary?.temporaryDaysRemaining !== null && moc.summary?.temporaryDaysRemaining !== undefined ? (
              <span className={moc.summary.temporaryDaysRemaining < 8 ? 'font-bold text-rose-500' : 'font-bold text-amber-500'}>
                Temporary expiry: {moc.summary.temporaryDaysRemaining} days
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <HeaderButton onClick={onEdit} icon={<Edit3 size={14} />} label="Edit MOC" />
          {moc.status === 'Draft' ? (
            <HeaderButton onClick={() => run('submit')} icon={<Send size={14} />} label="Submit" tone="blue" />
          ) : null}
          {['Submitted', 'Under Review'].includes(moc.status) ? (
            <>
              <HeaderButton onClick={() => run('approve', 'Approved from detail page')} icon={<ShieldCheck size={14} />} label="Approve" tone="green" />
              <HeaderButton onClick={() => run('reject', 'Rejected from detail page')} icon={<XCircle size={14} />} label="Reject" tone="red" />
              <HeaderButton onClick={() => run('returnForRevision', 'Returned for revision')} icon={<RotateCcw size={14} />} label="Return" />
            </>
          ) : null}
          {moc.status === 'Approved' ? (
            <HeaderButton onClick={() => run('startImplementation')} icon={<PlayCircle size={14} />} label="Start Implementation" tone="amber" />
          ) : null}
          {moc.status === 'Implementation' ? (
            <HeaderButton onClick={() => run('markImplementationComplete')} icon={<ShieldCheck size={14} />} label="Implementation Complete" tone="green" />
          ) : null}
          {['Implementation', 'Pending PSSR'].includes(moc.status) ? (
            <HeaderButton onClick={() => run('readyForStartup')} icon={<ShieldCheck size={14} />} label="Ready For Startup" tone="green" />
          ) : null}
          {moc.status === 'Ready For Startup' ? (
            <HeaderButton onClick={() => run('close', 'Closed from detail page')} icon={<ShieldCheck size={14} />} label="Close MOC" tone="green" />
          ) : null}
          {!['Closed', 'Cancelled'].includes(moc.status) ? (
            <HeaderButton onClick={() => run('cancel', 'Cancelled from detail page')} icon={<XCircle size={14} />} label="Cancel" tone="red" />
          ) : null}
          <HeaderButton onClick={onUpload} icon={<FileUp size={14} />} label="Upload Document" />
          <HeaderButton onClick={() => (mutations.duplicate.mutate as any)()} icon={<Copy size={14} />} label="Duplicate" />
          <HeaderButton onClick={() => window.print()} icon={<Printer size={14} />} label="Print" />
          <HeaderButton
            onClick={() =>
              mocService.report(moc.id).then((report) => {
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = report.fileName ?? `${moc.moc_number}.json`;
                anchor.click();
                URL.revokeObjectURL(url);
              })
            }
            icon={<Download size={14} />}
            label="Report"
          />
        </div>
      </div>
    </header>
  );
}

function HeaderButton({
  label,
  icon,
  onClick,
  tone = 'slate'
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: 'slate' | 'blue' | 'green' | 'amber' | 'red';
}) {
  const tones = {
    slate: 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)]',
    blue: 'border-blue-500/30 bg-blue-600 text-white hover:bg-blue-700',
    green: 'border-emerald-500/30 bg-emerald-600 text-white hover:bg-emerald-700',
    amber: 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25',
    red: 'border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-500/25'
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-all focus:outline-none ${tones[tone]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
