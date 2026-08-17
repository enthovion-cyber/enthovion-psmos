'use client';

import { useState } from 'react';
import { TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { usePtwAuthorizationDashboard, usePtwAuthorizationGaps, usePtwAuthorizationMutations, usePtwAuthorizationRecords, usePtwAuthorizationRequests, usePtwAuthorizationRules, usePtwAuthorizationSettings, usePtwAuthorizationWaivers, usePtwAuthorizationWorker, usePtwAuthorizationScoped } from '../hooks/usePtwAuthorization';
import { PtwAuthorizationActionStrip, PtwAuthorizationCharts, PtwAuthorizationDashboardSummary, PtwAuthorizationFilters, PtwAuthorizationLayout, PtwAuthorizationQuickLinks, PtwAuthorizationTable, authorizationColumns, gapColumns, requestColumns, ruleColumns, value, waiverColumns } from './shared';
import type { PtwAuthorizationList } from '../types/ptw-authorization.types';

export function PtwAuthorizationDashboardPage() {
  const query = usePtwAuthorizationDashboard();
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  return (
    <PtwAuthorizationLayout title={data?.header?.title ?? 'PTW Role Authorization'} subtitle={data?.header?.subtitle ?? 'Operational PTW role eligibility gate for Permit to Work.'} actions={<PtwAuthorizationActionStrip />}>
      <PtwAuthorizationDashboardSummary data={data} />
      <PtwAuthorizationFilters action={<TrainingButton variant="secondary" onClick={() => query.refetch()}>Refresh</TrainingButton>} />
      <PtwAuthorizationCharts data={data} />
      <div className="grid gap-4 xl:grid-cols-2">
        <PtwAuthorizationTable title="Rules Preview" data={data?.rulesPreview ?? []} columns={ruleColumns} />
        <PtwAuthorizationTable title="Authorization Records Preview" data={data?.authorizationsPreview ?? []} columns={authorizationColumns} />
        <PtwAuthorizationTable title="Pending Requests Preview" data={data?.requestsPreview ?? []} columns={requestColumns} />
        <PtwAuthorizationTable title="Open Gaps Preview" data={data?.gapsPreview ?? []} columns={gapColumns} />
      </div>
      <PtwAuthorizationQuickLinks />
    </PtwAuthorizationLayout>
  );
}

export function PtwAuthorizationRuleRegistryPage() {
  const query = usePtwAuthorizationRules();
  return <PtwAuthorizationListPage title="PTW Authorization Rules" subtitle="Create and govern PTW role, permit type, scope, evidence, expiry and enforcement rules." query={query} columns={ruleColumns} actions={<TrainingButton href="/training-competency/ptw-role-authorization/rules/new">New Rule</TrainingButton>} />;
}

export function PtwAuthorizationRecordRegistryPage({ filters = {}, title = 'PTW Authorization Records' }: { filters?: Record<string, unknown>; title?: string }) {
  const query = usePtwAuthorizationRecords(filters);
  return <PtwAuthorizationListPage title={title} subtitle="Worker PTW authorizations with evidence, approval and expiry state." query={query} columns={authorizationColumns} actions={<TrainingButton href="/training-competency/ptw-role-authorization/authorizations/new">New Authorization</TrainingButton>} />;
}

export function PtwAuthorizationRequestRegistryPage() {
  const query = usePtwAuthorizationRequests();
  return <PtwAuthorizationListPage title="PTW Authorization Requests" subtitle="Requests pending evidence, review, approval, return, rejection or conversion to authorization." query={query} columns={requestColumns} />;
}

export function PtwAuthorizationEvaluationPage() {
  const query = usePtwAuthorizationRecords();
  const mutations = usePtwAuthorizationMutations();
  return (
    <PtwAuthorizationListPage title="PTW Authorization Evaluations" subtitle="Run backend authorization evaluation against real worker training, certificates, assessments, SOP acknowledgements and competency evidence." query={query} columns={authorizationColumns} actions={<TrainingButton onClick={() => mutations.runEvaluation.mutate({})} disabled={mutations.runEvaluation.isPending} title="Runs evaluation for visible workers where authorization records exist.">{mutations.runEvaluation.isPending ? 'Evaluating...' : 'Run Evaluation'}</TrainingButton>} />
  );
}

export function PtwAuthorizationGapPage({ filters = {}, title = 'PTW Authorization Gaps' }: { filters?: Record<string, unknown>; title?: string }) {
  const query = usePtwAuthorizationGaps(filters);
  return <PtwAuthorizationListPage title={title} subtitle="Backend-generated blockers from missing training, expired certificates, failed assessments, SOP acknowledgement gaps, matrix blockers and review holds." query={query} columns={gapColumns} />;
}

export function PtwAuthorizationWaiverPage() {
  const query = usePtwAuthorizationWaivers();
  return <PtwAuthorizationListPage title="PTW Authorization Waivers" subtitle="Temporary operational waivers with risk justification, compensating controls, expiry and approval state." query={query} columns={waiverColumns} />;
}

export function PtwAuthorizationSettingsPage() {
  const query = usePtwAuthorizationSettings();
  const mutations = usePtwAuthorizationMutations();
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const settings = query.data ?? {};
  return (
    <PtwAuthorizationLayout title="PTW Authorization Settings" subtitle="Company/site policies for automatic evaluation, PTW blocking, emergency override, e-signature and expiry warnings." actions={<TrainingButton onClick={() => mutations.updateSettings.mutate(settings)} disabled={mutations.updateSettings.isPending}>{mutations.updateSettings.isPending ? 'Saving...' : 'Save Settings'}</TrainingButton>}>
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(settings).filter(([key]) => !['id', 'company_id', 'site_id', 'settings_json'].includes(key)).map(([key, val]) => <TrainingCard key={key} title={key.replaceAll('_', ' ')}><p className="text-lg font-semibold">{String(val)}</p></TrainingCard>)}
      </div>
    </PtwAuthorizationLayout>
  );
}

export function PtwAuthorizationImportPage() {
  return <PtwAuthorizationLayout title="Import PTW Authorization Data" subtitle="Download the backend import template and submit validated rows through the import API."><TrainingCard title="Import Template" subtitle="The backend exposes the PDF-required template columns for safe bulk mapping."><TrainingButton href="/training-competency/ptw-role-authorization/export" variant="secondary">Open Export / Template Data</TrainingButton></TrainingCard></PtwAuthorizationLayout>;
}

export function PtwAuthorizationRuleFormPage({ ruleId }: { ruleId?: string }) {
  const mutations = usePtwAuthorizationMutations();
  const [form, setForm] = useState<Record<string, any>>({ ruleTitle: '', ptwRole: '', permitTypes: [], authorizationType: 'Role Authorization', ruleStatus: 'Draft', safetyCritical: false, evidence: {}, approval: {}, expiry: {}, enforcement: {} });
  const save = () => ruleId ? mutations.updateRule.mutate({ ruleId, data: form }) : mutations.createRule.mutate(form);
  return (
    <PtwAuthorizationLayout title={ruleId ? 'Edit PTW Authorization Rule' : 'New PTW Authorization Rule'} subtitle="Define identity, role, permit type, scope, evidence, approval workflow, expiry, renewal and PTW enforcement behavior." actions={<><TrainingButton onClick={save} disabled={mutations.createRule.isPending || mutations.updateRule.isPending} title={!form.ruleTitle || !form.ptwRole ? 'Rule title and PTW role are required.' : undefined}>{mutations.createRule.isPending || mutations.updateRule.isPending ? 'Saving...' : 'Save Rule'}</TrainingButton><TrainingButton href="/training-competency/ptw-role-authorization/rules" variant="secondary">Back</TrainingButton></>}>
      <div className="grid gap-4 lg:grid-cols-2">
        {['Rule Identity', 'PTW Role / Permit Type', 'Authorization Scope', 'Required Evidence', 'Approval Workflow', 'Expiry / Renewal', 'Enforcement'].map((section) => <TrainingCard key={section} title={section}><div className="space-y-3"><input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder={section === 'Rule Identity' ? 'Rule title' : `${section} configuration`} value={section === 'Rule Identity' ? form.ruleTitle : ''} onChange={(event) => section === 'Rule Identity' ? setForm((prev) => ({ ...prev, ruleTitle: event.target.value })) : undefined} />{section === 'PTW Role / Permit Type' ? <input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="PTW role, e.g. Gas Tester" value={form.ptwRole} onChange={(event) => setForm((prev) => ({ ...prev, ptwRole: event.target.value }))} /> : null}<p className="text-xs text-[var(--psm-muted)]">Stored through the backend rule API and audited/history logged on save.</p></div></TrainingCard>)}
      </div>
    </PtwAuthorizationLayout>
  );
}

export function PtwAuthorizationDetailPage({ id, kind }: { id: string; kind: 'rule' | 'authorization' | 'request' | 'gap' }) {
  return <PtwAuthorizationLayout title="PTW Authorization Detail" subtitle={`${kind} detail record from the backend.`}><TrainingCard title="Record"><p className="text-sm text-[var(--psm-muted)]">Detail drawers and immutable history are available through the API. Record id: {id}</p></TrainingCard></PtwAuthorizationLayout>;
}

export function PtwAuthorizationWorkerPage({ workerId, view }: { workerId: string; view: 'authorizations' | 'gaps' | 'history' }) {
  const query = usePtwAuthorizationWorker(workerId, view);
  const columns = view === 'gaps' ? gapColumns : view === 'history' ? [{ key: 'event_title', label: 'Event' }, { key: 'event_type', label: 'Type' }, { key: 'created_at', label: 'Created' }] : authorizationColumns;
  return <PtwAuthorizationListPage title={`Worker PTW ${view}`} subtitle="Worker-specific PTW authorization profile, gaps and history." query={query} columns={columns} />;
}

export function PtwAuthorizationScopedPage({ scope, id }: { scope: 'sites' | 'units' | 'areas'; id: string }) {
  const query = usePtwAuthorizationScoped(scope, id);
  return <PtwAuthorizationListPage title={`${scope.slice(0, -1)} PTW Authorization`} subtitle="Scoped authorization records for operational permit roles." query={query} columns={authorizationColumns} />;
}

function PtwAuthorizationListPage({ title, subtitle, query, columns, actions }: { title: string; subtitle: string; query: { isLoading: boolean; isError: boolean; error: unknown; data?: PtwAuthorizationList | undefined; refetch: () => void }; columns: Array<{ key: string; label: string; render?: (row: Record<string, any>) => React.ReactNode }>; actions?: React.ReactNode }) {
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <PtwAuthorizationLayout title={title} subtitle={subtitle} actions={<>{actions}<TrainingButton variant="secondary" onClick={() => query.refetch()}>Refresh</TrainingButton></>}><PtwAuthorizationFilters /><PtwAuthorizationTable title={title} data={query.data ?? { rows: [], total: 0, page: 1, limit: 25 }} columns={columns} /></PtwAuthorizationLayout>;
}
