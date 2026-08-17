import type { AuditDetail } from '../../types/audit.types';
import { AuditCard } from '../../shared/AuditUi';

export function ProgramIntegrationTab({ detail }: { detail: AuditDetail }) {
  const settings = detail.integrationSettings ?? {};
  return <AuditCard title="Integration Settings" subtitle="Foundation flags for future planning, checklist, findings, CAPA, evidence, scoring, notification, and report phases."><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Object.entries(settings).filter(([key]) => !['id','company_id','site_id','program_id'].includes(key)).map(([key, value]) => <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{key.replaceAll('_', ' ')}</p><p className="mt-1 font-semibold">{typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value ?? 'Not configured')}</p></div>)}</div></AuditCard>;
}
