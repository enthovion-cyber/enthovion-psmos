'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Copy, PauseCircle, PlayCircle, RotateCcw, Send, ShieldCheck, XCircle } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { usePermit, usePermitMutations } from '../hooks/usePtw';
import { ptwOfflineStore } from '../offline/ptw-offline-store';
import { OfflineSyncStatus } from './OfflineSyncStatus';
import { PermitStatusBadge, PermitTypeBadge, RiskBadge } from './PermitBadges';
import { PermitLifecycleStepper } from './PermitLifecycleStepper';
import { PermitGasTestTab } from './tabs/PermitGasTestTab';
import { PermitAttachmentsTab } from './tabs/PermitAttachmentsTab';
import { PermitConflictsTab } from './tabs/PermitConflictsTab';
import { PermitDetailsTab } from './tabs/PermitDetailsTab';
import { PermitHistoryTab } from './tabs/PermitHistoryTab';
import { PermitIsolationTab } from './tabs/PermitIsolationTab';
import { PermitShiftHandoverTab } from './tabs/PermitShiftHandoverTab';
import { PermitSignaturesTab } from './tabs/PermitSignaturesTab';
import { PermitWorkforceTab } from './tabs/PermitWorkforceTab';

const tabs = ['Details', 'Isolation', 'Gas Test', 'Workforce', 'Shift Handover', 'Conflicts', 'Signatures', 'History', 'Attachments', 'Closure'] as const;
type Tab = (typeof tabs)[number];

export function PermitDetail({ id, initialTab = 'Details', hideHeader = false }: { id: string; initialTab?: Tab; hideHeader?: boolean }) {
  const query = usePermit(id);
  const mutations = usePermitMutations(id);
  const toast = useMutationToast();
  const [tab, setTab] = useState<Tab>(initialTab);
  const permit = query.data;

  useEffect(() => {
    if (permit) ptwOfflineStore.cachePermit(id, permit);
  }, [id, permit]);

  async function run(work: () => Promise<unknown>, success: string) {
    try {
      await work();
      toast.success(success);
    } catch (error) {
      toast.error('PTW action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  if (query.isLoading) return <div className="psm-card p-6">Loading permit...</div>;
  if (!permit) return <div className="psm-card p-6 text-danger">Permit not found.</div>;
  const extensionExpiryAt = () => {
    const currentExpiry = new Date(permit.planned_end_at).getTime();
    const baseExpiry = Number.isFinite(currentExpiry) ? currentExpiry : Date.now();
    return new Date(baseExpiry + 4 * 60 * 60 * 1000).toISOString();
  };

  return (
    <div className="space-y-4">
      {!hideHeader ? <section className="psm-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2"><PermitTypeBadge type={permit.permit_type} /><PermitStatusBadge status={permit.status} /><RiskBadge risk={permit.risk_level} /></div>
            <h1 className="mt-3 text-2xl font-semibold">{permit.permit_number}</h1>
            <p className="mt-1 text-lg">{permit.title}</p>
            <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{permit.job_area} · Equipment: {permit.equipment_tag ?? '-'} · Permit Holder: {permit.holder?.displayName ?? '-'}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[640px] xl:grid-cols-4">
            <div className="sm:col-span-2 xl:col-span-4"><OfflineSyncStatus /></div>
            {permit.status === 'Draft' ? <button onClick={() => run(() => mutations.submit.mutateAsync(), 'Permit submitted')} className="psm-button psm-button-secondary"><Send size={15} /> Submit</button> : null}
            {permit.status === 'Submitted' ? <button onClick={() => run(() => mutations.approve.mutateAsync(), 'Permit approved')} className="psm-button psm-button-secondary"><CheckCircle2 size={15} /> Approve</button> : null}
            {permit.status === 'Approved' ? <button onClick={() => run(() => mutations.issue.mutateAsync(), 'Permit issued')} className="psm-button psm-button-secondary"><ShieldCheck size={15} /> Issue</button> : null}
            {['Issued', 'Extended'].includes(permit.status) ? <button onClick={() => run(() => mutations.activate.mutateAsync(), 'Permit activated')} className="psm-button psm-button-primary"><PlayCircle size={15} /> Activate</button> : null}
            {['Issued', 'Active', 'Extended'].includes(permit.status) ? <button onClick={() => run(() => mutations.suspend.mutateAsync('Suspended from permit detail'), 'Permit suspended')} className="psm-button psm-button-danger"><PauseCircle size={15} /> Suspend</button> : null}
            {['Issued', 'Active', 'Extended'].includes(permit.status) ? <button onClick={() => run(() => mutations.extend.mutateAsync({ newExpiryAt: extensionExpiryAt(), reason: 'Operational extension requested from PTW console' }), 'Permit extended')} className="psm-button psm-button-secondary"><RotateCcw size={15} /> Extend</button> : null}
            <button onClick={() => run(() => mutations.clone.mutateAsync(), 'Permit duplicated')} className="psm-button psm-button-secondary"><Copy size={15} /> Duplicate</button>
            {permit.status !== 'Closed' && permit.status !== 'Cancelled' ? <button onClick={() => run(() => mutations.cancel.mutateAsync('Cancelled from PTW console'), 'Permit cancelled')} className="psm-button psm-button-danger"><XCircle size={15} /> Cancel</button> : null}
          </div>
        </div>
        <div className="mt-5"><PermitLifecycleStepper status={permit.status} /></div>
      </section> : null}

      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2 shadow-sm">
        <div className="flex gap-1 overflow-auto">
        {tabs.map((item) => (
          <Link
            key={item}
            href={`/ptw/${id}${tabPath(item) ? `/${tabPath(item)}` : ''}`}
            onClick={() => setTab(item)}
            className={`my-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === item ? 'bg-primary text-white shadow-sm' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'}`}
          >
            {item}
          </Link>
        ))}
        </div>
      </div>

      {tab === 'Details' ? <PermitDetailsTab permit={permit} onCreateMoc={() => run(() => mutations.createMocAction.mutateAsync(), 'MOC action created')} onSaveTemplate={() => run(() => mutations.saveTemplate.mutateAsync(), 'Permit template saved')} /> : null}
      {tab === 'Isolation' ? <PermitIsolationTab permit={permit} /> : null}
      {tab === 'Gas Test' ? <PermitGasTestTab permit={permit} /> : null}
      {tab === 'Workforce' ? <PermitWorkforceTab permit={permit} /> : null}
      {tab === 'Shift Handover' ? <PermitShiftHandoverTab permit={permit} /> : null}
      {tab === 'Conflicts' ? <PermitConflictsTab permit={permit} /> : null}
      {tab === 'Attachments' ? <PermitAttachmentsTab permit={permit} /> : null}
      {tab === 'Signatures' ? <PermitSignaturesTab permit={permit} /> : null}
      {tab === 'History' ? <PermitHistoryTab permit={permit} /> : null}
      {tab === 'Closure' ? <Closure permit={permit} onChecklist={() => run(() => mutations.checklist.mutateAsync({ workCompleted: true, toolsRemoved: true, housekeepingCompleted: true, personnelAccounted: true, equipmentSafe: true, areaInspected: true }), 'Closure checklist completed')} onClose={() => run(() => mutations.close.mutateAsync('Work completed and area verified safe.'), 'Permit closed')} canClose={['Active', 'Suspended', 'Extended'].includes(permit.status)} /> : null}
    </div>
  );
}

function Closure({ permit, onChecklist, onClose, canClose }: { permit: any; onChecklist: () => void; onClose: () => void; canClose: boolean }) {
  return (
    <section className="psm-card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Closure Verification</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(permit.closureChecklist?.items ?? {}).map(([key, value]) => <Info key={key} label={key} value={value ? 'Complete' : 'Open'} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button onClick={onChecklist} className="psm-button psm-button-secondary">Complete Checklist</button>{canClose ? <button onClick={onClose} className="psm-button psm-button-primary">Close Permit</button> : <button disabled className="psm-button psm-button-secondary opacity-60">Close Permit unavailable for {permit.status}</button>}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}

function tabPath(tab: Tab) {
  const paths: Record<Tab, string> = {
    Details: '',
    Isolation: 'isolation',
    'Gas Test': 'gas-test',
    Workforce: 'workforce',
    'Shift Handover': 'handover',
    Conflicts: 'conflicts',
    Signatures: 'signatures',
    History: 'history',
    Attachments: 'attachments',
    Closure: 'closure'
  };
  return paths[tab];
}
