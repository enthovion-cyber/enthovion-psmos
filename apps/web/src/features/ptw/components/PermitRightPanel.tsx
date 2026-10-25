'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, Download, FileText, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { Permit } from '@/services/ptw.service';
import { ptwService } from '@/services/ptw.service';
import { usePTWMap } from '../hooks/usePTWMap';
import { usePermitDashboard, usePermitMutations } from '../hooks/usePtw';

export function PermitRightPanel({ permit }: { permit?: Permit }) {
  const dashboard = usePermitDashboard();
  const map = usePTWMap();
  const mutations = usePermitMutations(permit?.id);
  const toast = useMutationToast();
  
  // Real data arrays safely accessed
  const latestGas = permit?.gasTests?.[0];
  const openConflicts = (permit?.conflicts ?? []).filter((item) => item.status === 'Open');

  async function requestExtension() {
    if (!permit) return;
    try {
      await mutations.extend.mutateAsync({
        newExpiryAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        reason: 'Extension requested from PTW summary panel',
      });
      toast.success('Permit extension requested');
    } catch (error) {
      toast.error('Extension failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function downloadPermit() {
    if (!permit) return;
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
    <aside 
      className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-3 pb-4 pr-1 z-20 custom-scrollbar"
    >
      {/* Permit Map Section */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3 shadow-xs dark:shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Permit Map (Live)
          </h2>
          <Link href="/ptw/map" className="text-[11px] font-bold text-primary dark:text-sky-400 hover:underline transition-colors">
            View full map
          </Link>
        </div>
        <div className="relative h-28 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 bg-[linear-gradient(90deg,rgba(59,130,246,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(59,130,246,.08)_1px,transparent_1px)] bg-[size:14px_14px]">
          {(map.data?.permits ?? []).slice(0, 10).map((item, index) => (
            <span
              key={item.permit_id}
              className="absolute grid h-5 w-5 place-items-center rounded-full border border-primary/60 bg-primary/20 text-[9px] font-bold text-primary shadow-xs backdrop-blur-[1px]"
              style={{
                left: `${Math.min(Math.max(item.svg_x ?? 10, 6), 88)}%`,
                top: `${Math.min(Math.max(item.svg_y ?? 10, 8), 82)}%`,
              }}
            >
              {index + 1}
            </span>
          ))}
          {!map.data?.permits?.length && (
            <div className="grid h-full place-items-center text-xs font-medium text-slate-400">
              No mapped permits
            </div>
          )}
        </div>
      </section>

      {/* Gas Test Status — Fixed structural visibility check */}
      <Panel title="Gas Test Status" icon={<CheckCircle2 size={13} className="text-emerald-500" />}>
        <div className="grid grid-cols-2 gap-1.5">
          <Metric label="O₂" value={latestGas?.o2 !== undefined && latestGas?.o2 !== null ? `${latestGas.o2}%` : '-'} tone="text-emerald-600 dark:text-emerald-400" />
          <Metric label="LEL" value={latestGas?.lel !== undefined && latestGas?.lel !== null ? `${latestGas.lel}%` : '-'} tone="text-emerald-600 dark:text-emerald-400" />
          <Metric label="H₂S" value={latestGas?.h2s !== undefined && latestGas?.h2s !== null ? `${latestGas.h2s} ppm` : '-'} tone="text-slate-800 dark:text-slate-200" />
          <Metric label="CO" value={latestGas?.co !== undefined && latestGas?.co !== null ? `${latestGas.co} ppm` : '-'} tone="text-slate-800 dark:text-slate-200" />
        </div>
        <div className="mt-1.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-1.5 text-center text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          Next test: {latestGas?.next_test_due_at ? new Date(latestGas.next_test_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not scheduled'}
        </div>
      </Panel>

      {/* Permit Expiry */}
      <Panel title="Permit Expiry" icon={<Clock size={13} className="text-amber-500" />}>
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 text-center">
          <div className="text-xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400 leading-none">
            {permit ? timeUntil(permit.planned_end_at) : '-'}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
            Remaining Time
          </div>
        </div>
        <button
          disabled={!permit || !['Issued', 'Active', 'Extended', 'Suspended'].includes(permit.status)}
          onClick={requestExtension}
          className="mt-1.5 w-full justify-center text-xs font-bold py-1.5 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-xs"
        >
          Request Extension
        </button>
      </Panel>

      {/* Conflicts */}
      <Panel 
        title={`Conflicts (${openConflicts.length})`} 
        icon={<AlertTriangle size={13} className={openConflicts.length ? 'text-rose-500 animate-pulse' : 'text-slate-400'} />}
      >
        <div className="space-y-1.5">
          {openConflicts.length ? (
            openConflicts.slice(0, 3).map((conflict) => (
              <div key={conflict.id} className="rounded-md border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 p-2 space-y-0.5">
                <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  {conflict.conflict_type}
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-tight">
                  {conflict.description}
                </p>
              </div>
            ))
          ) : (
            <div className="text-xs font-medium text-slate-400 py-2 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950/20">
              No open conflicts.
            </div>
          )}
        </div>
      </Panel>

      {/* Quick Actions */}
      <Panel title="Quick Actions" icon={<FileText size={13} className="text-primary dark:text-sky-400" />} >
        <div className="space-y-1.5">
          <button
            disabled={!permit}
            onClick={downloadPermit}
            className="w-full text-xs font-bold py-1.5 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 text-slate-700 dark:text-slate-200 shadow-xs"
          >
            <Download size={12} /> Download Certificate
          </button>
          <Link
            href="/ptw/new"
            className="w-full text-xs font-bold py-1.5 px-3 rounded-md bg-primary text-white flex items-center justify-center transition-all hover:bg-action-primary-hover shadow-xs active:scale-[0.985]"
          >
            Create New Permit
          </Link>
        </div>
      </Panel>

      {/* Control Room Summary */}
      <Panel title="Control Room" icon={<Users size={13} className="text-slate-400" />} >
        <div className="space-y-1.5">
          <Metric label="Active Permits" value={String(dashboard.data?.counts?.active ?? 0)} tone="text-emerald-600 dark:text-emerald-400" />
          <Metric label="Expiring Soon" value={String(dashboard.data?.counts?.expiringSoon ?? 0)} tone="text-amber-600 dark:text-amber-400" />
          <Metric label="Unresolved Conflicts" value={String(dashboard.data?.counts?.conflicts ?? 0)} tone="text-rose-600 dark:text-rose-400" />
        </div>
      </Panel>
    </aside>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3 shadow-xs dark:shadow-xl">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {icon}
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Metric({ label, value, tone = 'text-slate-800 dark:text-slate-200' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1 text-xs font-semibold">
      <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">{label}</span>
      <span className={tone}>{value}</span>
    </div>
  );
}

function timeUntil(value: string) {
  const ms = new Date(value).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}