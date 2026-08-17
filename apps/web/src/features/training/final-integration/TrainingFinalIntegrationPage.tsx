'use client';

import { useState } from 'react';
import { TrainingBadge, TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState, TrainingMetricCard, TrainingProgress, formatTrainingError } from '../shared/TrainingUi';
import { useTrainingFinalIntegrationActions, useTrainingFinalIntegrationDashboard, useTrainingFinalIntegrationSettings } from '../hooks/useTrainingFinalIntegration';

const cardDefs = [
  ['Compliance Score', 'complianceScore', 'good', '/training-competency/final-integration/compliance'],
  ['Total Workers', 'totalWorkers', 'neutral', '/training-competency/workforce'],
  ['Safety-Critical Gaps', 'safetyCriticalGaps', 'danger', '/training-competency/training-matrix/gaps?safetyCritical=true'],
  ['Open Gaps', 'openGaps', 'danger', '/training-competency/training-matrix/gaps'],
  ['Overdue', 'overdue', 'warn', '/training-competency/expiry-overdue'],
  ['Expired', 'expired', 'danger', '/training-competency/expiry-overdue?status=Expired'],
  ['Pending Approvals', 'pendingApprovals', 'warn', '/training-competency/review-approval/pending'],
  ['Data Quality Issues', 'dataQualityIssues', 'warn', '/training-competency/final-integration/data-quality'],
  ['Integration Warnings', 'integrationWarnings', 'warn', '/training-competency/final-integration/integration-health'],
  ['Hardening Failures', 'hardeningFailures', 'danger', '/training-competency/final-integration/hardening-checks'],
  ['Routes Audited', 'routeCount', 'neutral', '/training-competency/final-integration/route-health'],
  ['Permission Groups', 'permissionGroupsCovered', 'neutral', '/training-competency/final-integration/permission-audit']
] as const;

export function TrainingFinalIntegrationPage() {
  const [filters] = useState<Record<string, unknown>>({});
  const query = useTrainingFinalIntegrationDashboard(filters);
  const actions = useTrainingFinalIntegrationActions();
  const busy = actions.recalculateSnapshots.isPending || actions.runIntegrationHealth.isPending || actions.runDataQuality.isPending || actions.runHardening.isPending;
  if (query.isLoading) return <TrainingLoadingState rows={8} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  const summary = data?.summary ?? {};
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Training & Competency Phase 14</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--psm-fg)]">{data?.header?.title ?? 'Final Integration + Production Hardening'}</h1>
          <p className="mt-2 max-w-5xl text-sm text-[var(--psm-muted)]">{data?.header?.subtitle ?? 'Unified compliance, integration health, route health, RLS and production hardening.'}</p>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">Last backend calculation: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'Not calculated'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TrainingButton onClick={() => actions.recalculateSnapshots.mutate({})} disabled={busy} title={busy ? 'Another hardening action is running.' : 'Create an auditable compliance snapshot.'}>Recalculate Compliance</TrainingButton>
          <TrainingButton onClick={() => actions.runIntegrationHealth.mutate({})} disabled={busy} variant="secondary" title={busy ? 'Another hardening action is running.' : 'Run backend integration health checks.'}>Run Health</TrainingButton>
          <TrainingButton onClick={() => actions.runDataQuality.mutate({})} disabled={busy} variant="secondary" title={busy ? 'Another hardening action is running.' : 'Detect backend data quality issues.'}>Run Data Quality</TrainingButton>
          <TrainingButton onClick={() => actions.runHardening.mutate({})} disabled={busy} variant="secondary" title={busy ? 'Another hardening action is running.' : 'Run final production hardening checks.'}>Run Hardening</TrainingButton>
        </div>
      </header>

      <ActionErrors actions={actions} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cardDefs.map(([label, key, tone, href]) => <TrainingMetricCard key={key} label={label} value={key === 'complianceScore' && summary[key] != null ? `${summary[key]}%` : summary[key] ?? 0} tone={tone} href={href} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <TrainingCard title="Unified Compliance Engine" subtitle="Backend-calculated compliance across workforce, matrix, records, certificates, SOP, MOC/PSSR and PTW authorization.">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3"><TrainingBadge tone={statusTone(data?.compliance?.complianceStatus)}>{data?.compliance?.complianceStatus ?? 'Unknown / Data Missing'}</TrainingBadge><b className="text-2xl">{data?.compliance?.complianceScore ?? 0}%</b></div>
            <TrainingProgress value={Number(data?.compliance?.complianceScore ?? 0)} />
            <div className="grid grid-cols-2 gap-2 text-sm text-[var(--psm-muted)]">
              <span>Compliant workers: <b className="text-[var(--psm-fg)]">{data?.compliance?.compliantWorkers ?? 0}</b></span>
              <span>Blocked workers: <b className="text-[var(--psm-fg)]">{data?.compliance?.blockedWorkers ?? 0}</b></span>
              <span>Open gaps: <b className="text-[var(--psm-fg)]">{data?.compliance?.openGapCount ?? 0}</b></span>
              <span>Pending approvals: <b className="text-[var(--psm-fg)]">{data?.compliance?.pendingApprovalCount ?? 0}</b></span>
            </div>
          </div>
        </TrainingCard>
        <RowsPanel title="Data Quality Issues" subtitle="Worker, evidence, stale approval and source-link issues detected by backend." rows={data?.dataQualityIssues ?? []} columns={['issue_title', 'source_module', 'severity', 'issue_status']} emptyTitle="No quality issues returned" />
        <RowsPanel title="Integration Health" subtitle="Adapters and backend tables across all Training phases." rows={data?.integrationHealth ?? []} columns={['integration_name', 'status', 'warning_count', 'error_count']} emptyTitle="Run integration health" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RowsPanel title="Compliance Snapshots" subtitle="Auditable compliance snapshots generated by the backend." rows={data?.snapshots ?? []} columns={['snapshot_scope', 'compliance_status', 'compliance_score', 'calculated_at']} emptyTitle="No snapshots yet" />
        <RowsPanel title="Final Hardening Checks" subtitle="Production-hardening checks for routes, security, RLS, compliance and integrations." rows={data?.hardeningChecks ?? []} columns={['check_category', 'check_name', 'check_status', 'severity']} emptyTitle="No hardening checks yet" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RowsPanel title="Route Health" subtitle="Training routes required by Phase 14 with safe route states." rows={data?.routeHealth ?? []} columns={['route', 'status', 'loadingState', 'permissionState']} emptyTitle="No route health data" />
        <RowsPanel title="Permission Audit" subtitle="Training permission groups currently visible to this user/session." rows={data?.permissionAudit ?? []} columns={['group', 'status', 'grantedCount']} emptyTitle="No permission audit data" />
      </div>

      <TrainingFinalIntegrationSettingsPanel />
    </div>
  );
}

function ActionErrors({ actions }: { actions: ReturnType<typeof useTrainingFinalIntegrationActions> }) {
  const errors = [actions.recalculateSnapshots.error, actions.runIntegrationHealth.error, actions.runDataQuality.error, actions.runHardening.error].filter(Boolean);
  if (!errors.length) return null;
  return <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{errors.map((error, index) => <p key={index}>{formatTrainingError(error)}</p>)}</div>;
}

function RowsPanel({ title, subtitle, rows, columns, emptyTitle }: { title: string; subtitle: string; rows: Array<Record<string, any>>; columns: string[]; emptyTitle: string }) {
  return (
    <TrainingCard title={title} subtitle={subtitle}>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr>{columns.map((column) => <th key={column} className="px-3 py-2">{label(column)}</th>)}</tr></thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.slice(0, 10).map((row, index) => <tr key={row.id ?? index}>{columns.map((column) => <td key={column} className="px-3 py-2 align-top">{value(row[column])}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      ) : <TrainingEmptyState title={emptyTitle} message="No backend records were returned for your current company/site scope." />}
    </TrainingCard>
  );
}

function TrainingFinalIntegrationSettingsPanel() {
  const query = useTrainingFinalIntegrationSettings();
  const actions = useTrainingFinalIntegrationActions();
  if (query.isLoading) return <TrainingLoadingState rows={1} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const settings = query.data ?? {};
  return (
    <TrainingCard title="Production Hardening Settings" subtitle="Company/site scoped final audit, snapshot, health, data quality, recalc, cache and export thresholds.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Compliance snapshots', settings.enable_compliance_snapshots],
          ['Integration health checks', settings.enable_integration_health_checks],
          ['Data quality checks', settings.enable_data_quality_checks],
          ['Auto training recalculation', settings.enable_auto_recalculate_on_training_change],
          ['Certificate expiry recalculation', settings.enable_auto_recalculate_on_certificate_expiry],
          ['SOP revision recalculation', settings.enable_auto_recalculate_on_sop_revision],
          ['MOC/PSSR recalculation', settings.enable_auto_recalculate_on_moc_pssr_change],
          ['PTW authorization recheck', settings.enable_auto_ptw_authorization_recheck]
        ].map(([labelText, enabled]) => <div key={String(labelText)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{labelText}</p><div className="mt-2"><TrainingBadge tone={enabled ? 'good' : 'warn'}>{enabled ? 'Enabled' : 'Disabled'}</TrainingBadge></div></div>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <TrainingButton onClick={() => actions.updateSettings.mutate({ ...settings, enableFinalAuditMode: true })} disabled={actions.updateSettings.isPending} title={actions.updateSettings.isPending ? 'Saving settings to backend.' : 'Settings changes are company/site scoped and audited by backend.'}>Save Audit Mode</TrainingButton>
        <TrainingButton href="/training-competency/settings" variant="secondary">Open Training Settings</TrainingButton>
      </div>
    </TrainingCard>
  );
}

function label(column: string) {
  return column.replaceAll('_', ' ').replace(/([A-Z])/g, ' $1');
}

function value(input: unknown) {
  if (typeof input === 'boolean') return input ? 'Yes' : 'No';
  if (input == null || input === '') return 'Missing';
  if (typeof input === 'string' && input.includes('T') && input.includes(':')) return new Date(input).toLocaleString();
  if (typeof input === 'object') return JSON.stringify(input);
  return String(input);
}

function statusTone(status?: string | null): 'neutral' | 'good' | 'warn' | 'danger' | 'info' {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized.includes('compliant') && !normalized.includes('non')) return 'good';
  if (normalized.includes('blocked') || normalized.includes('failed') || normalized.includes('expired') || normalized.includes('non')) return 'danger';
  if (normalized.includes('pending') || normalized.includes('partial') || normalized.includes('warning') || normalized.includes('overdue')) return 'warn';
  return 'neutral';
}
