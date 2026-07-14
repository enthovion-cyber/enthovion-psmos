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
    <header className="border-b border-cyan-300/10 bg-[#04101f]/95 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link href="/moc" className="inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white"><ArrowLeft size={16} /> Back to MOC Register</Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-white">{moc.moc_number}</h1>
            <Badge tone="blue">{moc.change_type}</Badge>
            <Badge tone={statusTone(moc.status)}>{moc.status}</Badge>
            <Badge tone={riskTone(moc.risk_level)}>{moc.risk_level} Risk</Badge>
          </div>
          <p className="mt-2 max-w-4xl text-lg text-slate-200">{moc.title}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
            <span>{moc.site?.name ?? moc.site_id}</span>
            <span>{moc.unit?.name ?? 'No unit'} / {moc.area?.name ?? 'No area'}</span>
            <span>Originator: {moc.originator?.displayName ?? moc.originator_id ?? '-'}</span>
            <span>Target: {moc.target_implementation_date ?? '-'}</span>
            {moc.summary?.temporaryDaysRemaining !== null && moc.summary?.temporaryDaysRemaining !== undefined ? <span className={moc.summary.temporaryDaysRemaining < 8 ? 'font-bold text-red-300' : 'font-bold text-amber-300'}>Temporary expiry: {moc.summary.temporaryDaysRemaining} days</span> : null}
          </div>
        </div>
        <div className="flex max-w-4xl flex-wrap justify-start gap-2 xl:justify-end">
          <HeaderButton onClick={onEdit} icon={<Edit3 size={15} />} label="Edit MOC" />
          {moc.status === 'Draft' ? <HeaderButton onClick={() => run('submit')} icon={<Send size={15} />} label="Submit" tone="blue" /> : null}
          {['Submitted', 'Under Review'].includes(moc.status) ? <HeaderButton onClick={() => run('approve', 'Approved from detail page')} icon={<ShieldCheck size={15} />} label="Approve" tone="green" /> : null}
          {['Submitted', 'Under Review'].includes(moc.status) ? <HeaderButton onClick={() => run('reject', 'Rejected from detail page')} icon={<XCircle size={15} />} label="Reject" tone="red" /> : null}
          {['Submitted', 'Under Review'].includes(moc.status) ? <HeaderButton onClick={() => run('returnForRevision', 'Returned for revision')} icon={<RotateCcw size={15} />} label="Return" /> : null}
          {moc.status === 'Approved' ? <HeaderButton onClick={() => run('startImplementation')} icon={<PlayCircle size={15} />} label="Start Implementation" tone="amber" /> : null}
          {moc.status === 'Implementation' ? <HeaderButton onClick={() => run('markImplementationComplete')} icon={<ShieldCheck size={15} />} label="Implementation Complete" tone="green" /> : null}
          {['Implementation', 'Pending PSSR'].includes(moc.status) ? <HeaderButton onClick={() => run('readyForStartup')} icon={<ShieldCheck size={15} />} label="Ready For Startup" tone="green" /> : null}
          {moc.status === 'Ready For Startup' ? <HeaderButton onClick={() => run('close', 'Closed from detail page')} icon={<ShieldCheck size={15} />} label="Close MOC" tone="green" /> : null}
          {!['Closed', 'Cancelled'].includes(moc.status) ? <HeaderButton onClick={() => run('cancel', 'Cancelled from detail page')} icon={<XCircle size={15} />} label="Cancel" tone="red" /> : null}
          <HeaderButton onClick={onUpload} icon={<FileUp size={15} />} label="Upload Document" />
          <HeaderButton onClick={() => mutations.duplicate.mutate()} icon={<Copy size={15} />} label="Duplicate" />
          <HeaderButton onClick={() => window.print()} icon={<Printer size={15} />} label="Print" />
          <HeaderButton onClick={() => mocService.report(moc.id).then((report) => {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = report.fileName ?? `${moc.moc_number}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
          })} icon={<Download size={15} />} label="Download Report" />
        </div>
      </div>
    </header>
  );
}

function HeaderButton({ label, icon, onClick, tone = 'slate' }: { label: string; icon: ReactNode; onClick: () => void; tone?: 'slate' | 'blue' | 'green' | 'amber' | 'red' }) {
  const tones = { slate: 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-blue-300/50', blue: 'border-blue-300/30 bg-blue-600 text-white', green: 'border-emerald-300/30 bg-emerald-600 text-white', amber: 'border-amber-300/30 bg-amber-500/20 text-amber-100', red: 'border-red-300/30 bg-red-500/15 text-red-100' };
  return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-black ${tones[tone]}`}>{icon}{label}</button>;
}
