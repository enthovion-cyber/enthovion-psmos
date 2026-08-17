import { PsiCard } from '../../shared/PsiUi';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';

export function NormalConditionsTab({ detail }: { detail: ProcessChemistryDetail }) {
  const conditions = detail.conditions ?? {};
  return <PsiCard title="Normal Conditions" subtitle="Temperature, pressure, pH, concentration/feed, residence time, utilities, inerting and safe operating limits."><div className="grid gap-3 md:grid-cols-4">{Object.entries(conditions).filter(([key]) => !['id','company_id','site_id','chemistry_id','created_at','updated_at'].includes(key)).map(([key, value]) => <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{key.replaceAll('_', ' ')}</p><p className="text-sm">{String(value ?? 'Not recorded')}</p></div>)}</div></PsiCard>;
}
