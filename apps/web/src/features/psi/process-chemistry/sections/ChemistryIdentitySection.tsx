import { PsiCard } from '../../shared/PsiUi';
import type { ProcessChemistryLookups } from '../../types/process-chemistry.types';

export function ChemistryIdentitySection({ value, lookups, onChange, forcedUnitId }: { value: Record<string, any>; lookups?: ProcessChemistryLookups | undefined; onChange: (patch: Record<string, any>) => void; forcedUnitId?: string | undefined }) {
  return (
    <PsiCard title="Chemistry Identity" subtitle="Unit, chemistry name, type, operating mode, process step, status, owner and review metadata.">
      <div className="grid gap-3 md:grid-cols-3">
        {!forcedUnitId ? <input required value={value.unit_id ?? ''} onChange={(e) => onChange({ unit_id: e.target.value })} placeholder="Unit ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" /> : null}
        <input required value={value.chemistry_name ?? ''} onChange={(e) => onChange({ chemistry_name: e.target.value })} placeholder="Chemistry name" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select required value={value.chemistry_type ?? ''} onChange={(e) => onChange({ chemistry_type: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <option value="">Chemistry type</option>
          {(lookups?.chemistryTypes ?? []).map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={value.operating_mode ?? ''} onChange={(e) => onChange({ operating_mode: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <option value="">Operating mode</option>
          {(lookups?.operatingModes ?? []).map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={value.process_step ?? ''} onChange={(e) => onChange({ process_step: e.target.value })} placeholder="Process step" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.owner_user_id ?? ''} onChange={(e) => onChange({ owner_user_id: e.target.value })} placeholder="Owner user ID" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
      </div>
    </PsiCard>
  );
}
