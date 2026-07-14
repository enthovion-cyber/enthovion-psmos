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
      className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto space-y-4 pb-6 pr-1 z-20
        [&::-webkit-scrollbar]:w-1.5 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:rounded-full 
        [&::-webkit-scrollbar-thumb]:bg-[var(--psm-line)]
        hover:[&::-webkit-scrollbar-thumb]:bg-[var(--psm-muted)]/40
        transition-all duration-200"
    >
      {/* Permit Map Section */}
      <section className="psm-card p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-1,inherit)] shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Permit Map (Live)
          </h2>
          <Link href="/ptw/map" className="text-xs font-bold text-primary hover:underline transition-colors">
            View full map
          </Link>
        </div>
        <div className="relative h-36 overflow-hidden rounded-lg border border-[var(--psm-line)] bg-[linear-gradient(90deg,rgba(59,130,246,.06)_1px,transparent_1px),linear-gradient(0deg,rgba(59,130,246,.06)_1px,transparent_1px)] bg-[size:16px_16px]">
          {(map.data?.permits ?? []).slice(0, 10).map((item, index) => (
            <span
              key={item.permit_id}
              className="absolute grid h-6 w-6 place-items-center rounded-full border border-primary/50 bg-primary/20 text-[10px] font-black text-primary shadow-sm backdrop-blur-[1px]"
              style={{
                left: `${Math.min(Math.max(item.svg_x ?? 10, 6), 88)}%`,
                top: `${Math.min(Math.max(item.svg_y ?? 10, 8), 82)}%`,
              }}
            >
              {index + 1}
            </span>
          ))}
          {!map.data?.permits?.length && (
            <div className="grid h-full place-items-center text-xs font-medium text-[var(--psm-muted)]">
              No mapped permits
            </div>
          )}
        </div>
      </section>

      {/* Gas Test Status — Fixed structural visibility check */}
      <Panel title="Gas Test Status" icon={<CheckCircle2 size={14} className="text-success" />}>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="O₂" value={latestGas?.o2 !== undefined && latestGas?.o2 !== null ? `${latestGas.o2}%` : '-'} tone="text-success" />
          <Metric label="LEL" value={latestGas?.lel !== undefined && latestGas?.lel !== null ? `${latestGas.lel}%` : '-'} tone="text-success" />
          <Metric label="H₂S" value={latestGas?.h2s !== undefined && latestGas?.h2s !== null ? `${latestGas.h2s} ppm` : '-'} tone="text-foreground" />
          <Metric label="CO" value={latestGas?.co !== undefined && latestGas?.co !== null ? `${latestGas.co} ppm` : '-'} tone="text-foreground" />
        </div>
        <div className="mt-2 rounded-lg bg-[var(--psm-surface-2)] border border-[var(--psm-line)]/60 p-2 text-center text-xs font-semibold text-warning">
          Next test: {latestGas?.next_test_due_at ? new Date(latestGas.next_test_due_at).toLocaleString() : 'Not scheduled'}
        </div>
      </Panel>

      {/* Permit Expiry */}
      <Panel title="Permit Expiry" icon={<Clock size={14} className="text-warning" />}>
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-center">
          <div className="text-2xl font-black tracking-tight text-warning">
            {permit ? timeUntil(permit.planned_end_at) : '-'}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--psm-muted)] mt-0.5">
            Remaining Time
          </div>
        </div>
        <button
          disabled={!permit || !['Issued', 'Active', 'Extended', 'Suspended'].includes(permit.status)}
          onClick={requestExtension}
          className="mt-2 w-full justify-center text-xs font-bold py-2.5 px-4 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-1)] hover:bg-[var(--psm-surface-2)] transition-all active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 flex items-center gap-2 text-foreground"
        >
          Request Extension
        </button>
      </Panel>

      {/* Conflicts */}
      <Panel 
        title={`Conflicts (${openConflicts.length})`} 
        icon={<AlertTriangle size={14} className={openConflicts.length ? 'text-danger animate-pulse' : 'text-[var(--psm-muted)]'} />}
      >
        <div className="space-y-2">
          {openConflicts.length ? (
            openConflicts.slice(0, 3).map((conflict) => (
              <div key={conflict.id} className="rounded-lg border border-danger/30 bg-danger/5 p-3 space-y-1">
                <div className="text-xs font-bold text-danger uppercase tracking-wider">
                  {conflict.conflict_type}
                </div>
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {conflict.description}
                </p>
              </div>
            ))
          ) : (
            <div className="text-xs font-medium text-[var(--psm-muted)] py-3 text-center border border-dashed border-[var(--psm-line)] rounded-lg bg-[var(--psm-surface-2)]/30">
              No open conflicts.
            </div>
          )}
        </div>
      </Panel>

      {/* Quick Actions */}
      <Panel title="Quick Actions" icon={<FileText size={14} className="text-primary" />} >
        <div className="space-y-2">
          <button
            disabled={!permit}
            onClick={downloadPermit}
            className="w-full text-xs font-bold py-2.5 px-4 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-1)] flex items-center justify-center gap-2 hover:bg-[var(--psm-surface-2)] transition-all active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 text-foreground"
          >
            <Download size={14} /> Download Certificate
          </button>
          <Link
            href="/ptw/new"
            className="w-full text-xs font-bold py-2.5 px-4 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-all hover:bg-primary/90 shadow-sm active:scale-[0.985]"
          >
            Create New Permit
          </Link>
        </div>
      </Panel>

      {/* Control Room Summary */}
      <Panel title="Control Room" icon={<Users size={14} className="text-[var(--psm-muted)]" />} >
        <div className="space-y-2">
          <Metric label="Active Permits" value={String(dashboard.data?.counts?.active ?? 0)} tone="text-success" />
          <Metric label="Expiring Soon" value={String(dashboard.data?.counts?.expiringSoon ?? 0)} tone="text-warning" />
          <Metric label="Unresolved Conflicts" value={String(dashboard.data?.counts?.conflicts ?? 0)} tone="text-danger" />
        </div>
      </Panel>
    </aside>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="psm-card p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-1,inherit)] shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Metric({ label, value, tone = 'text-foreground' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs font-semibold">
      <span className="text-[var(--psm-muted)] font-medium">{label}</span>
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