'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { useAuditSettings, useAuditSettingsMutation, useAuditSettingsSummary } from '../hooks/useAuditSettings';
import type { AuditSettingsSection } from '../services/audit-settings.service';
import { AuditBadge, AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState, Field, inputClass } from '../shared/AuditUi';

const hiddenKeys = new Set(['id', 'company_id', 'site_id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'archived_by', 'archived_at']);

export function AuditSettingsPage() {
  const query = useAuditSettings();
  const summary = useAuditSettingsSummary();
  const mutation = useAuditSettingsMutation();
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const sections = query.data ?? [];
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit Settings" subtitle="Final consolidated Audit / Compliance Assurance settings console. Each section loads from the real backend settings endpoint and saves through audited, permission-guarded APIs." />
        {summary.isError ? <AuditErrorState message={summary.error} onRetry={() => summary.refetch()} /> : null}
        <AuditSettingsHardeningSummary summary={summary.data} loading={summary.isLoading} />
        <div className="grid gap-5">
          {sections.map((section) => <AuditSettingsSectionCard key={section.key} section={section} saving={mutation.isPending} onSave={(payload) => mutation.mutate({ section, payload })} />)}
        </div>
        {mutation.isError ? <AuditErrorState message={mutation.error} /> : null}
      </div>
    </AuditLayout>
  );
}

function AuditSettingsHardeningSummary({ summary, loading }: { summary: Record<string, any> | undefined; loading: boolean }) {
  if (loading) return <AuditLoadingState rows={2} />;
  const permissionGroups = summary?.permissionGroups ?? {};
  const hardening = summary?.hardening ?? {};
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <AuditCard title="Final hardening status" subtitle="Backend-reported settings, route, permission, and tenant/site scope posture.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Company" value={String(summary?.companyId ?? 'Not available')} />
          <SummaryTile label="Selected site" value={String(summary?.selectedSiteId ?? 'Company scope')} />
          <SummaryTile label="Audit permissions" value={String(summary?.totalAuditPermissions ?? 0)} />
          <SummaryTile label="Corporate view" value={summary?.corporateView ? 'Yes' : 'No'} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(hardening).map(([key, value]) => <AuditBadge key={key} tone={value ? 'good' : 'warn'}>{key.replace(/([A-Z])/g, ' $1')}: {value ? 'Yes' : 'No'}</AuditBadge>)}
        </div>
      </AuditCard>
      <AuditCard title="Permission groups" subtitle="Seeded Audit RBAC groups returned by the backend.">
        {Object.keys(permissionGroups).length ? <div className="grid gap-2 sm:grid-cols-2">{Object.entries(permissionGroups).map(([group, count]) => <div key={group} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">{group}</p><p className="mt-2 text-xl font-bold text-[var(--psm-fg)]">{String(count)}</p></div>)}</div> : <AuditEmptyState title="No permission summary" message="The backend did not return Audit permission groups for the current tenant." />}
      </AuditCard>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">{label}</p><p className="mt-2 break-words text-lg font-bold text-[var(--psm-fg)]">{value}</p></div>;
}

function AuditSettingsSectionCard({ section, saving, onSave }: { section: AuditSettingsSection; saving: boolean; onSave: (payload: Record<string, unknown>) => void }) {
  const initial = useMemo(() => normalizeSettings(section.data), [section.data]);
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  useEffect(() => setForm(initial), [initial]);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const visibleEntries = Object.entries(form).filter(([key]) => !hiddenKeys.has(key));
  const disabledReason = section.unavailableReason ?? (!section.editable ? 'This section is read-only because it summarizes backend integration or permission posture.' : dirty ? 'Save audited settings changes.' : 'No unsaved changes.');
  return (
    <AuditCard
      title={section.title}
      subtitle={section.description}
      action={<div className="flex flex-wrap items-center gap-2"><AuditBadge tone={section.unavailableReason ? 'danger' : section.editable ? 'info' : 'neutral'}>{section.unavailableReason ? 'Unavailable' : section.editable ? 'Editable' : 'Read only'}</AuditBadge>{dirty ? <AuditBadge tone="warn">Unsaved changes</AuditBadge> : null}</div>}
    >
      {section.unavailableReason ? <AuditEmptyState title={`${section.title} unavailable`} message={section.unavailableReason} /> : (
        <div className="space-y-4">
          {visibleEntries.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleEntries.map(([key, value]) => (
            <Field key={key} label={formatKey(key)}>
              <SettingInput settingKey={key} value={value} readOnly={!section.editable} dangerous={section.dangerousKeys.includes(key)} onChange={(next) => setForm((current) => ({ ...current, [key]: next }))} />
            </Field>
          ))}</div> : <AuditEmptyState title="No configurable fields returned" message="This backend endpoint returned no editable settings for the current company/site scope." />}
          {section.dangerousKeys.some((key) => key in form) ? <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">Dangerous settings in this section can weaken audit governance and should be changed only after management approval.</div> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <AuditButton onClick={() => setForm(initial)} disabled={!dirty || saving} variant="secondary" title={dirty ? 'Discard local unsaved changes.' : 'No unsaved changes.'}>Reset</AuditButton>
            <AuditButton onClick={() => onSave(form)} disabled={!section.editable || !dirty || saving} title={disabledReason}>{saving ? 'Saving...' : 'Save Changes'}</AuditButton>
          </div>
        </div>
      )}
    </AuditCard>
  );
}

function SettingInput({ settingKey, value, readOnly, dangerous, onChange }: { settingKey: string; value: unknown; readOnly: boolean; dangerous: boolean; onChange: (value: unknown) => void }) {
  const className = `${inputClass()} ${dangerous ? 'border-amber-500/50' : ''}`;
  if (typeof value === 'boolean') {
    return <select className={className} value={value ? 'true' : 'false'} disabled={readOnly} onChange={(event) => onChange(event.target.value === 'true')}><option value="true">Yes</option><option value="false">No</option></select>;
  }
  if (typeof value === 'number') {
    return <input className={className} type="number" value={Number.isFinite(value) ? value : 0} disabled={readOnly} onChange={(event) => onChange(Number(event.target.value))} />;
  }
  if (value && typeof value === 'object') {
    return <textarea className={className} value={JSON.stringify(value, null, 2)} disabled={readOnly} rows={4} onChange={(event) => onChange(safeJson(event.target.value))} />;
  }
  const type = settingKey.toLowerCase().includes('date') ? 'date' : 'text';
  return <input className={className} type={type} value={String(value ?? '')} disabled={readOnly} onChange={(event) => onChange(event.target.value)} />;
}

function normalizeSettings(settings: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(settings ?? {}).filter(([key]) => !key.startsWith('_')));
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatKey(key: string) {
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\s+/g, ' ').trim();
}
