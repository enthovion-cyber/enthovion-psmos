'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Download,
  FilePlus2,
  PauseCircle,
  PlayCircle,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
  XCircle,
  ArrowLeft,
  Activity
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { Permit } from '@/services/ptw.service';
import { ptwService } from '@/services/ptw.service';
import { usePermitMutations } from '../hooks/usePtw';
import { OfflineSyncStatus } from './OfflineSyncStatus';
import { PermitStatusBadge, PermitTypeBadge, RiskBadge } from './PermitBadges';
import { PermitLifecycleStepper } from './PermitLifecycleStepper';

export function PermitHeader({ permit }: { permit: Permit }) {
  const mutations = usePermitMutations(permit.id);
  const toast = useMutationToast();
  const expiryMs = new Date(permit.planned_end_at).getTime() - Date.now();
  const hours = Math.max(Math.floor(expiryMs / 3600000), 0);
  const minutes = Math.max(Math.floor((expiryMs % 3600000) / 60000), 0);
  const closed = ['Closed', 'Cancelled'].includes(permit.status);
  const signedTypes = new Set((permit.signatures ?? []).filter((signature) => signature.status === 'Signed' || signature.signed_by).map((signature) => signature.signature_role ?? signature.signature_type));
  const hasSignatures = (required: string[]) => required.every((signature) => signedTypes.has(signature));
  const isolationReady = (permit.isolations ?? []).every((isolation) => ['Confirmed', 'De-Isolated'].includes(isolation.status));
  const workforceReady = (permit.workforce ?? []).every((worker) => worker.signed_briefing);
  const gasReady = !['HOT_WORK', 'CONFINED_SPACE', 'LINE_BREAKING'].includes(permit.permit_type) || permit.gasTests?.[0]?.result === 'Pass';
  const conflictsClear = !(permit.conflicts ?? []).some((conflict) => conflict.status === 'Open');
  const closeReady = hasSignatures(['Closure Authority']);
  const extensionExpiryAt = () => {
    const currentExpiry = new Date(permit.planned_end_at).getTime();
    const baseExpiry = Number.isFinite(currentExpiry) ? currentExpiry : Date.now();
    return new Date(baseExpiry + 4 * 60 * 60 * 1000).toISOString();
  };

  async function run(work: () => Promise<unknown>, success: string) {
    try {
      await work();
      toast.success(success);
    } catch (error) {
      toast.error('PTW action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function downloadPermit() {
    try {
      const blob = await ptwService.downloadCertificate(permit.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${permit.permit_number}-permit-certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Permit downloaded');
    } catch (error) {
      toast.error('Download failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] shadow-xs dark:shadow-xl text-slate-900 dark:text-slate-100 transition-all duration-200">
      {/* Top Banner Control Board */}
      <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0c1829] p-3 sm:p-4">
        {/* Global Return Navigation Bar */}
        <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/40">
          <Link
            href="/ptw"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-400 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-950 active:scale-98 shadow-xs group"
          >
            <ArrowLeft size={12} className="text-slate-400 group-hover:text-primary dark:group-hover:text-sky-400 transition-colors" />
            <span>Return to Permit Registry</span>
          </Link>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase font-mono bg-white dark:bg-slate-950/40 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800/40 shadow-xs">
            <Activity size={9} className="text-emerald-500 animate-pulse" />
            Live Authorization Console
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5 items-center">
              <PermitTypeBadge type={permit.permit_type} />
              <PermitStatusBadge status={permit.status} />
              <RiskBadge risk={permit.risk_level} />
            </div>

            <h1 className="truncate text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-900 dark:text-slate-100 font-mono">
              {permit.permit_number}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {permit.title}
            </p>

            <div className="mt-2.5 grid gap-2 grid-cols-2 lg:grid-cols-4">
              <Metric label="Equipment" value={permit.equipment_tag ? `${permit.equipment_tag} ${permit.equipment_name ?? ''}` : '-'} />
              <Metric label="Operational Area" value={permit.area?.name ?? permit.job_area ?? '-'} />
              <Metric label="Permit Holder" value={permit.holder?.displayName ?? '-'} />
              <Metric
                label="Expires In"
                value={expiryMs > 0 ? `${hours}h ${minutes}m` : 'Expired'}
                tone={expiryMs > 0 ? 'text-amber-700 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-500/5' : 'text-rose-700 dark:text-rose-400 font-mono bg-rose-50 dark:bg-rose-500/5'}
              />
            </div>
          </div>

          {/* Action Module Grid Layout Area */}
          <div className="w-full xl:max-w-[580px] shrink-0">
            <OfflineSyncStatus />

            <div className="mt-2 grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <ActionButton label="Submit" icon={<Send size={12} />} disabled={permit.status !== 'Draft'} onClick={() => run(() => mutations.submit.mutateAsync(), 'Permit submitted')} />
              <ActionButton label="Approve" icon={<CheckCircle2 size={12} />} disabled={permit.status !== 'Submitted' || !hasSignatures(['Permit Holder', 'Permit Issuer'])} onClick={() => run(() => mutations.approve.mutateAsync(), 'Permit approved')} />
              <ActionButton label="Issue" icon={<ShieldCheck size={12} />} disabled={permit.status !== 'Approved' || !hasSignatures(['Permit Holder', 'Permit Issuer', 'Area Authority'])} onClick={() => run(() => mutations.issue.mutateAsync(), 'Permit issued')} />
              <ActionButton label="Activate" icon={<PlayCircle size={12} />} variant="primary" disabled={!['Issued', 'Extended'].includes(permit.status) || !hasSignatures(['Permit Holder', 'Permit Issuer', 'Area Authority']) || !isolationReady || !workforceReady || !gasReady || !conflictsClear} onClick={() => run(() => mutations.activate.mutateAsync(), 'Permit activated')} />
              <ActionButton label="Suspend" icon={<PauseCircle size={12} />} variant="danger" disabled={!['Issued', 'Active', 'Extended'].includes(permit.status)} onClick={() => run(() => mutations.suspend.mutateAsync('Suspended from PTW detail page'), 'Permit suspended')} />
              <ActionButton label="Extend" icon={<RotateCcw size={12} />} disabled={!['Issued', 'Active', 'Extended'].includes(permit.status)} onClick={() => run(() => mutations.extend.mutateAsync({ newExpiryAt: extensionExpiryAt(), reason: 'Operational extension requested from PTW detail page' }), 'Permit extended')} />
              <ActionButton label="Close" icon={<CheckCircle2 size={12} />} variant="primary" disabled={!['Active', 'Suspended', 'Extended'].includes(permit.status) || !closeReady} onClick={() => run(() => mutations.close.mutateAsync('Work completed and area verified safe.'), 'Permit closed')} />
              <ActionButton label="Cancel" icon={<XCircle size={12} />} variant="danger" disabled={closed} onClick={() => run(() => mutations.cancel.mutateAsync('Cancelled from PTW detail page'), 'Permit cancelled')} />

              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 active:scale-98 shadow-xs"
                onClick={downloadPermit}
              >
                <Download size={12} className="text-primary dark:text-sky-400" />
                <span>Download</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 active:scale-98 shadow-xs"
                onClick={() => window.print()}
              >
                <Printer size={12} className="text-slate-400" />
                <span>Print</span>
              </button>

              <ActionButton label="Duplicate" icon={<Copy size={12} />} onClick={() => run(() => mutations.clone.mutateAsync(), 'Permit duplicated')} />
              <ActionButton label="Create MOC" icon={<FilePlus2 size={12} />} disabled={closed} onClick={() => run(() => mutations.createMocAction.mutateAsync(), 'MOC action created')} />
            </div>
          </div>
        </div>

        {/* Live System Gate Condition Diagnostics Trace Log */}
        <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 px-3 py-1.5 font-mono text-[10px] text-slate-600 dark:text-slate-400 flex items-center flex-wrap gap-x-3.5 gap-y-1 shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800 pr-2.5 select-none">Action gates</span>
          <div>signatures: <span className="font-bold text-slate-800 dark:text-slate-200">{signedTypes.size} Verified</span></div>
          <div>isolation: <span className={`font-bold ${isolationReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-500'}`}>{isolationReady ? 'ready' : 'open'}</span></div>
          <div>workforce: <span className={`font-bold ${workforceReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-500'}`}>{workforceReady ? 'briefed' : 'pending'}</span></div>
          <div>gas test: <span className={`font-bold ${gasReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-500'}`}>{gasReady ? 'ready' : 'required'}</span></div>
          <div>conflicts: <span className={`font-bold ${conflictsClear ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{conflictsClear ? 'clear' : 'open'}</span></div>
        </div>
      </div>

      {/* Structural Stepper Dynamic Section */}
      <div className="p-3 bg-slate-50/60 dark:bg-slate-950/20">
        <PermitLifecycleStepper status={permit.status} />
      </div>
    </section>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled = false,
  variant = 'secondary'
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const baseStyle = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all shadow-xs select-none w-full border text-center";

  const variantStyles = {
    primary: "bg-primary border-primary text-white hover:bg-action-primary-hover active:scale-98",
    danger: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-98",
    secondary: "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 active:scale-98"
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variantStyles[variant]} disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:border-slate-200 dark:disabled:border-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:scale-100 disabled:shadow-none`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function Metric({
  label,
  value,
  tone = ''
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950/50 p-2.5 flex flex-col gap-1 w-full shadow-xs">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none truncate">
        {label}
      </div>
      <div className={`truncate text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide ${tone}`}>
        {value}
      </div>
    </div>
  );
}
