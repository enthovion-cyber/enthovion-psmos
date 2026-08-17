import { PsiCard } from '../../shared/PsiUi';
import type { SafeOperatingLimitLookups } from '../../types/safe-operating-limit.types';

export function ControlsSafeguardsSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: SafeOperatingLimitLookups | undefined; onChange: (patch: Record<string, any>) => void }) {
  const row = value.controls?.[0] ?? {};
  const patch = (input: Record<string, unknown>) => onChange({ controls: [{ ...row, ...input }] });
  return (
    <PsiCard title="6. Controls / Safeguards" subtitle="Alarm, interlock, SIF/SIS, PSV, SOP, control loop, analyzer, mechanical protection, and emergency control links.">
      <div className="grid gap-3 md:grid-cols-3">
        <select value={row.control_type ?? 'Alarm'} onChange={(e) => patch({ control_type: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{(lookups?.solControlTypes ?? ['Alarm']).map((item) => <option key={item}>{item}</option>)}</select>
        {['linked_module','linked_record_id','control_description','setpoint','safe_state','required_response','reliability_criticality','test_proof_inspection_requirement','owner_user_id','notes'].map((key) => <input key={key} value={row[key] ?? ''} onChange={(e) => patch({ [key]: e.target.value })} placeholder={key.replaceAll('_', ' ')} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />)}
      </div>
    </PsiCard>
  );
}
