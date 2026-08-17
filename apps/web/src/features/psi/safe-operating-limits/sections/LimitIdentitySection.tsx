import { PsiCard } from '../../shared/PsiUi';
import type { SafeOperatingLimitLookups } from '../../types/safe-operating-limit.types';

export function LimitIdentitySection({ value, lookups, forcedUnitId, onChange }: { value: Record<string, any>; lookups?: SafeOperatingLimitLookups | undefined; forcedUnitId?: string | undefined; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="1. Limit Identity" subtitle="Required owner, scope, criticality, unit, equipment, status, and review metadata for the SOL truth record.">
      <div className="grid gap-3 md:grid-cols-3">
        <input required value={value.limit_title ?? ''} onChange={(e) => onChange({ limit_title: e.target.value })} placeholder="Limit title" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input required disabled={Boolean(forcedUnitId)} value={value.unit_id ?? forcedUnitId ?? ''} onChange={(e) => onChange({ unit_id: e.target.value })} placeholder="Process unit ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm disabled:opacity-70" />
        <input value={value.area_id ?? ''} onChange={(e) => onChange({ area_id: e.target.value })} placeholder="Area ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.equipment_id ?? ''} onChange={(e) => onChange({ equipment_id: e.target.value })} placeholder="Equipment ID / tag" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.system_service ?? ''} onChange={(e) => onChange({ system_service: e.target.value })} placeholder="System / service" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input required value={value.parameter_name ?? ''} onChange={(e) => onChange({ parameter_name: e.target.value })} placeholder="Parameter name" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.parameter_tag ?? ''} onChange={(e) => onChange({ parameter_tag: e.target.value })} placeholder="Parameter tag" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select required value={value.parameter_type ?? ''} onChange={(e) => onChange({ parameter_type: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Parameter type</option>{(lookups?.parameterTypes ?? []).map((item) => <option key={item}>{item}</option>)}</select>
        <select required value={value.limit_scope ?? 'Unit-level'} onChange={(e) => onChange({ limit_scope: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{(lookups?.limitScopes ?? ['Unit-level']).map((item) => <option key={item}>{item}</option>)}</select>
        <select required value={value.criticality ?? 'Medium'} onChange={(e) => onChange({ criticality: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{(lookups?.limitCriticalities ?? ['Medium']).map((item) => <option key={item}>{item}</option>)}</select>
        <select value={value.operating_mode ?? ''} onChange={(e) => onChange({ operating_mode: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Operating mode</option>{(lookups?.operatingModes ?? []).map((item) => <option key={item}>{item}</option>)}</select>
        <select value={value.status ?? 'Draft'} onChange={(e) => onChange({ status: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{['Draft','Active','Under Review','Approved'].map((item) => <option key={item}>{item}</option>)}</select>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(value.safety_critical)} onChange={(e) => onChange({ safety_critical: e.target.checked })} /> Safety-critical</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(value.psm_critical)} onChange={(e) => onChange({ psm_critical: e.target.checked })} /> PSM-critical</label>
        <input value={value.owner_user_id ?? ''} onChange={(e) => onChange({ owner_user_id: e.target.value })} placeholder="Owner user ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.process_engineer_id ?? ''} onChange={(e) => onChange({ process_engineer_id: e.target.value })} placeholder="Process engineer ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.operations_owner_id ?? ''} onChange={(e) => onChange({ operations_owner_id: e.target.value })} placeholder="Operations owner ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.hse_reviewer_id ?? ''} onChange={(e) => onChange({ hse_reviewer_id: e.target.value })} placeholder="HSE / process safety reviewer ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input type="date" value={value.last_review_date ?? ''} onChange={(e) => onChange({ last_review_date: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input type="date" value={value.next_review_due ?? ''} onChange={(e) => onChange({ next_review_due: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <textarea value={value.notes ?? ''} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Notes" className="min-h-20 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm md:col-span-3" />
      </div>
    </PsiCard>
  );
}
