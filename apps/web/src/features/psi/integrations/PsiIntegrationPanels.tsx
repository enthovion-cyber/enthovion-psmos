'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PsiButton, PsiCard, PsiEmptyState, PsiErrorState, PsiLoadingState, PsiMetricCard, PsiProgress } from '../shared/PsiUi';
import { ImpactSeverityBadge } from '../shared/ImpactSeverityBadge';
import { IntegrationStatusBadge } from '../shared/IntegrationStatusBadge';
import { SyncStatusBadge } from '../shared/SyncStatusBadge';
import { SourceModuleBadge } from '../shared/SourceModuleBadge';
import { useIntegrationImpactRegister, useOutOfSyncChecks, usePsiIntegrationDashboard, usePsiIntegrationMutation, usePsiIntegrationSettings } from './hooks/usePsiIntegrations';
import { psiIntegrationService } from './services/psi-integration.service';
import type { PsiIntegrationDashboard, PsiIntegrationLink, PsiPaged, PsiSyncCheck } from './types/psi-integration.types';

function text(value: unknown, fallback = 'Not set') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function rowsFromRecord(record?: Record<string, number> | Array<Record<string, unknown>>) {
  if (Array.isArray(record)) return record.map((row) => ({ label: text(row.label ?? row.module ?? row.type), value: Number(row.value ?? row.count ?? row.gaps ?? 0) }));
  return Object.entries(record ?? {}).map(([label, value]) => ({ label, value: Number(value ?? 0) }));
}

export function PsiIntegrationHeader({ title = 'PSI Integrations', subtitle = 'MOC, PSSR, HAZOP, and Mechanical Integrity impact/readiness links.', onRefresh, onRunSync, running }: { title?: string; subtitle?: string; onRefresh?: () => void; onRunSync?: () => void; running?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Process Safety Information</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href="/process-safety-information/integrations/impact-register" variant="secondary">Impact Register</PsiButton>
          <PsiButton href="/process-safety-information/integrations/out-of-sync" variant="secondary">Out of Sync</PsiButton>
          <PsiButton onClick={onRunSync} disabled={running} title={running ? 'Sync check is running.' : undefined}>{running ? 'Running...' : 'Run Sync Check'}</PsiButton>
          <PsiButton onClick={onRefresh} variant="secondary">Refresh</PsiButton>
        </div>
      </div>
    </div>
  );
}

export function PsiIntegrationSummaryCards({ dashboard }: { dashboard?: PsiIntegrationDashboard | undefined }) {
  const s = dashboard?.summary ?? {};
  const cards = [
    ['PSI records linked to MOC', s.psiRecordsLinkedToMoc],
    ['Open MOCs with PSI impact', s.openMocsWithPsiImpact, 'warn'],
    ['MOCs blocked by PSI updates', s.mocsBlockedByPsiUpdates, 'danger'],
    ['PSSRs readiness checked', s.pssrsWithPsiReadinessChecks],
    ['PSSR blockers from PSI', s.pssrBlockersFromPsi, 'danger'],
    ['HAZOP studies using PSI', s.hazopStudiesUsingPsi],
    ['HAZOP PSI actions', s.hazopActionsRequiringPsiUpdates, 'warn'],
    ['MI equipment impacted', s.miEquipmentWithPsiReadinessImpact, 'warn'],
    ['Equipment missing PSI for MI', s.equipmentMissingPsiForMi, 'danger'],
    ['PSI records out of sync', s.psiRecordsOutOfSync, 'danger'],
    ['Critical blockers', s.criticalIntegrationBlockers, 'danger'],
    ['Open integration actions', s.integrationActionsOpen, 'warn'],
    ['Overdue reviews/actions', s.integrationReviewsOverdue, 'danger'],
    ['Last sync check', s.lastSyncCheck ?? 'Not checked']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, tone]) => <PsiMetricCard key={label} label={label} value={text(value, '0')} tone={tone as any} />)}</div>;
}

export function PsiIntegrationFilters({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side filters are sent to the PSI integration APIs.">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search integration title, PSI record, source record..." className="min-h-10 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm outline-none focus:border-primary" />
        <PsiButton href="/process-safety-information/integrations/settings" variant="secondary">Settings</PsiButton>
      </div>
    </PsiCard>
  );
}

export function IntegrationImpactTable({ rows }: { rows: PsiIntegrationLink[] }) {
  if (!rows.length) return <PsiEmptyState title="No integration links found" message="Create or run MOC/PSSR/HAZOP/MI integration checks to populate this register." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>
            {['Integration', 'Source', 'PSI record', 'Relationship', 'Severity', 'Status', 'Sync', 'Blocking', 'Owner', 'Due', 'Last checked'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-[var(--psm-surface-2)]">
              <td className="px-3 py-3 font-semibold">{text(row.integration_title)}</td>
              <td className="px-3 py-3"><SourceModuleBadge value={row.source_module} /><div className="mt-1 text-xs text-[var(--psm-muted)]">{text(row.source_record_title ?? row.source_record_id)}</div></td>
              <td className="px-3 py-3">{text(row.psi_module)}<div className="text-xs text-[var(--psm-muted)]">{text(row.psi_record_title ?? row.psi_record_id, 'No PSI record')}</div></td>
              <td className="px-3 py-3">{text(row.relationship_type)}</td>
              <td className="px-3 py-3"><ImpactSeverityBadge value={row.impact_severity} /></td>
              <td className="px-3 py-3"><IntegrationStatusBadge value={row.integration_status} /></td>
              <td className="px-3 py-3"><SyncStatusBadge value={row.sync_status} /></td>
              <td className="px-3 py-3">{text(row.blocking_status, 'Not Blocking')}</td>
              <td className="px-3 py-3">{text(row.owner_user_id, 'Unassigned')}</td>
              <td className="px-3 py-3">{text(row.due_date, 'No due date')}</td>
              <td className="px-3 py-3">{text(row.last_checked_at, 'Not checked')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IntegrationImpactDetailPanel({ link }: { link?: PsiIntegrationLink }) {
  if (!link) return <PsiEmptyState title="Select an integration" message="Open an integration link to inspect snapshots, evidence, actions, sync checks, and history." />;
  return (
    <PsiCard title="Integration Impact Detail" subtitle={text(link.integration_title)}>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Required update" value={link.required_update} />
        <Field label="Required action" value={link.required_action} />
        <Field label="Evidence status" value={link.evidence_status} />
        <Field label="Site / unit / equipment" value={[link.site_id, link.unit_id, link.equipment_id].filter(Boolean).join(' / ')} />
        <Field label="Last synced" value={link.last_synced_at} />
        <Field label="Notes" value={link.notes} />
      </div>
    </PsiCard>
  );
}

export function IntegrationStatusTimeline({ rows }: { rows: PsiIntegrationLink[] }) {
  return (
    <PsiCard title="Integration Status Timeline" subtitle="Recent integration state changes and required reviews.">
      <div className="space-y-3">
        {rows.slice(0, 8).map((row) => (
          <div key={row.id} className="flex gap-3 rounded-lg border border-[var(--psm-line)] p-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
            <div>
              <p className="font-semibold">{text(row.integration_title)}</p>
              <p className="text-sm text-[var(--psm-muted)]">{text(row.updated_at)} - {text(row.integration_status)} / {text(row.sync_status)}</p>
            </div>
          </div>
        ))}
        {!rows.length ? <PsiEmptyState title="No recent integration status" message="Status timeline appears after links or sync checks are created." /> : null}
      </div>
    </PsiCard>
  );
}

export function MocPsiImpactChecklist({ rows }: { rows: Record<string, unknown>[] }) {
  return <ChecklistPanel title="MOC PSI Impact Checklist" rows={rows} labelKey="checklist_item" statusKey="impact_status" detailKey="blocker_reason" />;
}

export function MocPsiImpactItemsTable({ rows }: { rows: Record<string, unknown>[] }) {
  return <SimpleRowsTable title="MOC PSI Impact Items" rows={rows} columns={['psi_module', 'impact_status', 'update_required', 'blocking', 'evidence_status', 'verification_status']} />;
}

export function MocClosureBlockerPanel({ assessment, items }: { assessment?: Record<string, unknown> | null; items?: Record<string, unknown>[] }) {
  const blocking = (items ?? []).filter((item) => item.blocking);
  return <BlockerPanel title="MOC Closure Blockers" status={text(assessment?.assessment_status)} blockers={blocking.map((item) => text(item.blocker_reason ?? item.checklist_item))} />;
}

export function PssrPsiReadinessChecklist({ rows }: { rows: Record<string, unknown>[] }) {
  return <ChecklistPanel title="PSSR PSI Readiness Checklist" rows={rows} labelKey="blocker_title" statusKey="blocker_status" detailKey="blocker_description" />;
}

export function PssrPsiBlockersTable({ rows }: { rows: Record<string, unknown>[] }) {
  return <SimpleRowsTable title="PSSR Blockers From PSI" rows={rows} columns={['blocker_type', 'severity', 'blocker_status', 'startup_blocker', 'evidence_status', 'due_date']} />;
}

export function PssrReadinessSnapshotPanel({ check }: { check?: Record<string, unknown> | null }) {
  return <SnapshotPanel title="PSSR Readiness Snapshot" snapshot={check?.snapshot_json as Record<string, unknown> | undefined} fallback="Run PSI readiness to create a PSSR startup snapshot." />;
}

export function HazopPsiBasisPackagePanel({ rows }: { rows: Record<string, unknown>[] }) {
  return <ChecklistPanel title="HAZOP PSI Basis Package" rows={rows} labelKey="basisType" statusKey="linked" detailKey="records" />;
}

export function HazopPsiBasisLinksTable({ rows }: { rows: Record<string, unknown>[] }) {
  return <SimpleRowsTable title="HAZOP PSI Basis Links" rows={rows} columns={['psi_module', 'psi_record_title', 'basis_type', 'basis_status', 'source_revision', 'revalidation_required']} />;
}

export function HazopPsiActionsTable({ rows }: { rows: Record<string, unknown>[] }) {
  return <SimpleRowsTable title="HAZOP PSI Actions" rows={rows} columns={['action_title', 'psi_module', 'action_status', 'owner_user_id', 'due_date', 'priority']} />;
}

export function HazopRevalidationPanel({ revalidation }: { revalidation?: Record<string, unknown> }) {
  return <BlockerPanel title="HAZOP Revalidation Panel" status={revalidation?.required ? 'Revalidation required' : 'Current'} blockers={(revalidation?.reasons as string[]) ?? []} />;
}

export function MiPsiReadinessPanel({ readiness }: { readiness?: Record<string, unknown> }) {
  const completion = Number(readiness?.completion ?? 0);
  return (
    <PsiCard title="MI PSI Readiness" subtitle={text(readiness?.status)}>
      <PsiProgress value={completion} />
      <p className="mt-2 text-sm text-[var(--psm-muted)]">{completion}% complete</p>
    </PsiCard>
  );
}

export function MiPsiImpactTable({ rows }: { rows: Record<string, unknown>[] }) {
  return <SimpleRowsTable title="MI PSI Readiness Impacts" rows={rows} columns={['impact_type', 'impact_title', 'impact_status', 'severity', 'sync_status', 'due_date']} />;
}

export function MiPsiSyncDiffPanel({ rows }: { rows: PsiSyncCheck[] }) {
  return <SyncDiffViewer rows={rows} />;
}

export function OutOfSyncTable({ rows }: { rows: PsiSyncCheck[] }) {
  if (!rows.length) return <PsiEmptyState title="No out-of-sync records" message="Backend sync checks did not find records needing review." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase text-[var(--psm-muted)]"><tr>{['Source', 'Check', 'Sync', 'Severity', 'Diff', 'Checked', 'Resolved'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr></thead>
        <tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}><td className="px-3 py-3">{text(row.source_module)}<div className="text-xs text-[var(--psm-muted)]">{text(row.source_record_id)}</div></td><td className="px-3 py-3">{text(row.check_type)}</td><td className="px-3 py-3"><SyncStatusBadge value={row.sync_status} /></td><td className="px-3 py-3"><ImpactSeverityBadge value={row.impact_severity} /></td><td className="px-3 py-3">{text(row.diff_summary)}</td><td className="px-3 py-3">{text(row.checked_at)}</td><td className="px-3 py-3">{text(row.resolved_at, 'Open')}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function SyncDiffViewer({ rows }: { rows: PsiSyncCheck[] }) {
  return (
    <PsiCard title="Sync Diff Viewer" subtitle="Backend-generated before/after or source-vs-PSI difference payloads.">
      <div className="grid gap-3">
        {rows.slice(0, 5).map((row) => <pre key={row.id} className="max-h-56 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(row.diff_json ?? { summary: row.diff_summary }, null, 2)}</pre>)}
        {!rows.length ? <PsiEmptyState title="No sync diff available" message="Run a sync check to compare linked source modules and PSI records." /> : null}
      </div>
    </PsiCard>
  );
}

export function CreateIntegrationActionDialog() {
  return <PsiCard title="Create Integration Action" subtitle="Actions are created through the backend and linked to the Universal Action Engine where configured."><p className="text-sm text-[var(--psm-muted)]">Use row actions in MOC/PSSR/HAZOP/MI panels to create module-specific actions with audit and history events.</p></PsiCard>;
}

export function VerifyIntegrationDialog() {
  return <PsiCard title="Verify Integration" subtitle="Verification records reason, actor, timestamp, audit log, and PSI integration history event."><p className="text-sm text-[var(--psm-muted)]">Verification is enabled for authorized users on integration detail rows.</p></PsiCard>;
}

export function PsiIntegrationDashboardPage() {
  const [search, setSearch] = useState('');
  const dashboard = usePsiIntegrationDashboard(search ? { search } : {});
  const mutation = usePsiIntegrationMutation();
  if (dashboard.isLoading) return <PsiLoadingState rows={6} />;
  if (dashboard.isError) return <PsiErrorState message="The PSI integration dashboard could not be loaded." onRetry={() => dashboard.refetch()} />;
  const data = dashboard.data;
  return (
    <div className="space-y-5">
      <PsiIntegrationHeader onRefresh={() => dashboard.refetch()} onRunSync={() => mutation.mutate({ action: 'runSync' })} running={mutation.isPending} />
      <PsiIntegrationFilters search={search} onSearch={setSearch} />
      <PsiIntegrationSummaryCards dashboard={data} />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PsiCard title="Integration Type Breakdown"><MiniBars rows={rowsFromRecord(data?.charts?.byIntegrationType as any)} /></PsiCard>
        <PsiCard title="Sync Status Breakdown"><MiniBars rows={rowsFromRecord(data?.charts?.bySyncStatus as any)} /></PsiCard>
      </div>
      <IntegrationImpactTable rows={data?.recentLinks ?? []} />
      <IntegrationStatusTimeline rows={data?.recentLinks ?? []} />
    </div>
  );
}

export function IntegrationImpactRegisterPage() {
  const [search, setSearch] = useState('');
  const register = useIntegrationImpactRegister(search ? { search } : {});
  if (register.isLoading) return <PsiLoadingState rows={5} />;
  if (register.isError) return <PsiErrorState message="The PSI integration impact register could not be loaded." onRetry={() => register.refetch()} />;
  return <div className="space-y-5"><PsiIntegrationHeader title="Integration Impact Register" onRefresh={() => register.refetch()} /><PsiIntegrationFilters search={search} onSearch={setSearch} /><IntegrationImpactTable rows={register.data?.rows ?? []} /></div>;
}

export function OutOfSyncRegisterPage() {
  const out = useOutOfSyncChecks();
  const mutation = usePsiIntegrationMutation();
  if (out.isLoading) return <PsiLoadingState rows={4} />;
  if (out.isError) return <PsiErrorState message="Out-of-sync records could not be loaded." onRetry={() => out.refetch()} />;
  return <div className="space-y-5"><PsiIntegrationHeader title="Out-of-Sync Register" subtitle="Source changed, PSI changed, stale snapshot, and cross-module conflict checks." onRefresh={() => out.refetch()} onRunSync={() => mutation.mutate({ action: 'runSync' })} running={mutation.isPending} /><OutOfSyncTable rows={out.data?.rows ?? []} /><SyncDiffViewer rows={out.data?.rows ?? []} /></div>;
}

export function IntegrationHistoryPage() {
  const history = useIntegrationHistory();
  if (history.isLoading) return <PsiLoadingState rows={4} />;
  if (history.isError) return <PsiErrorState message="Integration history could not be loaded." onRetry={() => history.refetch()} />;
  const rows = history.data ?? [];
  return <div className="space-y-5"><PsiIntegrationHeader title="Integration History" /><SimpleRowsTable title="Immutable Integration History" rows={rows} columns={['event_type', 'event_title', 'source_module', 'psi_module', 'severity', 'actor_user_id', 'created_at']} /></div>;
}

export function IntegrationSettingsPage() {
  const settings = usePsiIntegrationSettings();
  const mutation = usePsiIntegrationMutation();
  if (settings.isLoading) return <PsiLoadingState rows={3} />;
  if (settings.isError) return <PsiErrorState message="Integration settings could not be loaded." onRetry={() => settings.refetch()} />;
  const data = settings.data ?? {};
  return (
    <div className="space-y-5">
      <PsiIntegrationHeader title="Integration Settings" subtitle="Backend-controlled thresholds and blocker behavior." onRefresh={() => settings.refetch()} />
      <PsiCard title="Policy Snapshot" subtitle="Update these values through backend settings API.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(data).filter(([key]) => !['id', 'company_id', 'created_at', 'updated_at'].includes(key)).map(([key, value]) => <Field key={key} label={key.replaceAll('_', ' ')} value={text(value)} />)}
        </div>
        <div className="mt-4"><PsiButton disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'updateSettings', data })}>{mutation.isPending ? 'Saving...' : 'Save Settings Snapshot'}</PsiButton></div>
      </PsiCard>
    </div>
  );
}

export function GenericIntegrationSourcePage({ title, module }: { title: string; module: 'moc' | 'pssr' | 'hazop' | 'mechanical-integrity' }) {
  const register = useIntegrationImpactRegister({ sourceModule: module === 'mechanical-integrity' ? 'Mechanical Integrity' : module.toUpperCase() });
  if (register.isLoading) return <PsiLoadingState rows={4} />;
  if (register.isError) return <PsiErrorState message={`${title} integration records could not be loaded.`} onRetry={() => register.refetch()} />;
  const rows = register.data?.rows ?? [];
  return (
    <div className="space-y-5">
      <PsiIntegrationHeader title={title} subtitle="Module-specific PSI integration links, blockers, readiness, and sync state." onRefresh={() => register.refetch()} />
      <IntegrationImpactTable rows={rows} />
      {module === 'moc' ? <MocClosureBlockerPanel items={rows as any} /> : null}
      {module === 'pssr' ? <PssrPsiBlockersTable rows={rows as any} /> : null}
      {module === 'hazop' ? <HazopRevalidationPanel revalidation={{ required: rows.some((row) => row.sync_status !== 'In Sync'), reasons: rows.map((row) => row.required_update).filter(Boolean) }} /> : null}
      {module === 'mechanical-integrity' ? <MiPsiReadinessPanel readiness={{ status: rows.length ? 'MI Readiness Impact' : 'PSI Ready for MI', completion: rows.length ? 50 : 100 }} /> : null}
    </div>
  );
}

export function ScopedIntegrationPage({ title, filters }: { title: string; filters: Record<string, unknown> }) {
  const register = useIntegrationImpactRegister(filters);
  if (register.isLoading) return <PsiLoadingState rows={4} />;
  if (register.isError) return <PsiErrorState message={`${title} could not be loaded.`} onRetry={() => register.refetch()} />;
  return (
    <div className="space-y-5">
      <PsiIntegrationHeader title={title} subtitle="Scoped PSI integration links, blockers, sync state, and readiness evidence." onRefresh={() => register.refetch()} />
      <IntegrationImpactTable rows={register.data?.rows ?? []} />
      <IntegrationStatusTimeline rows={register.data?.rows ?? []} />
    </div>
  );
}

function useIntegrationHistory() {
  return useQuery({ queryKey: ['psi', 'integrations', 'history'], queryFn: () => psiIntegrationService.history() });
}

function Field({ label, value }: { label: string; value?: unknown }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-sm font-medium">{text(value)}</p></div>;
}

function MiniBars({ rows }: { rows: { label: string; value: number }[] }) {
  if (!rows.length) return <PsiEmptyState title="No chart data" message="Backend returned no values for this chart." />;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return <div className="space-y-3">{rows.map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><span className="font-semibold">{row.value}</span></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.round((row.value / max) * 100)}%` }} /></div></div>)}</div>;
}

function ChecklistPanel({ title, rows, labelKey, statusKey, detailKey }: { title: string; rows: Record<string, unknown>[]; labelKey: string; statusKey: string; detailKey: string }) {
  return <PsiCard title={title}>{rows.length ? <div className="space-y-2">{rows.map((row, index) => <div key={index} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{text(row[labelKey])}</p><IntegrationStatusBadge value={String(row[statusKey] ?? '')} /></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{text(row[detailKey], 'No detail')}</p></div>)}</div> : <PsiEmptyState title="No checklist rows" message="Run the backend readiness or impact workflow to generate checklist items." />}</PsiCard>;
}

function BlockerPanel({ title, status, blockers }: { title: string; status?: string; blockers: string[] }) {
  return <PsiCard title={title} subtitle={status}><div className="space-y-2">{blockers.length ? blockers.map((blocker) => <div key={blocker} className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{blocker}</div>) : <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">No open blockers returned by backend.</div>}</div></PsiCard>;
}

function SnapshotPanel({ title, snapshot, fallback }: { title: string; snapshot?: Record<string, unknown> | undefined; fallback: string }) {
  return <PsiCard title={title}>{snapshot ? <pre className="max-h-80 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(snapshot, null, 2)}</pre> : <PsiEmptyState title="No snapshot" message={fallback} />}</PsiCard>;
}

function SimpleRowsTable({ title, rows, columns }: { title: string; rows: Record<string, unknown>[]; columns: string[] }) {
  return <PsiCard title={title}>{rows.length ? <div className="overflow-x-auto"><table className="min-w-[800px] w-full text-sm"><thead className="text-left text-xs uppercase text-[var(--psm-muted)]"><tr>{columns.map((column) => <th key={column} className="px-3 py-2">{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row, index) => <tr key={String(row.id ?? index)}>{columns.map((column) => <td key={column} className="px-3 py-3">{typeof row[column] === 'boolean' ? (row[column] ? 'Yes' : 'No') : text(row[column])}</td>)}</tr>)}</tbody></table></div> : <PsiEmptyState title="No rows" message="Backend returned no records for this panel." />}</PsiCard>;
}
