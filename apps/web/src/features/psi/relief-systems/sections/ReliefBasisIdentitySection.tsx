import { PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemLookups } from '../../types/relief-system.types';
import { CheckboxField, SelectField, TextAreaField, TextField } from './ReliefSectionControls';

export function ReliefBasisIdentitySection({ value, lookups, forcedUnitId, onChange }: { value: Record<string, any>; lookups?: ReliefSystemLookups | undefined; forcedUnitId?: string | undefined; onChange: (patch: Record<string, unknown>) => void }) {
  return (
    <PsiCard title="1. Relief Basis Identity" subtitle="Study-controlled identity, status, ownership, service fluid, criticality, MOC/PSSR impact, and review schedule.">
      <div className="grid gap-3 md:grid-cols-3">
        <TextField required label="Process unit ID" name="unit_id" value={forcedUnitId ?? value.unit_id} onChange={onChange} />
        <TextField label="Area ID" name="area_id" value={value.area_id} onChange={onChange} />
        <TextField label="Relief basis number" name="relief_basis_number" value={value.relief_basis_number} onChange={onChange} />
        <TextField required label="Relief basis title" name="relief_basis_title" value={value.relief_basis_title} onChange={onChange} />
        <SelectField required label="Relief system type" name="relief_system_type" value={value.relief_system_type} options={lookups?.reliefSystemTypes ?? ['PSV','Rupture Disc','Conservation Vent','Thermal Relief','Atmospheric Vent','Flare Header','Scrubber','Emergency Vent','Other']} onChange={onChange} />
        <TextField label="Protection type" name="protection_type" value={value.protection_type} onChange={onChange} />
        <TextField label="Service fluid" name="service_fluid" value={value.service_fluid} onChange={onChange} />
        <TextField label="Fluid phase" name="fluid_phase" value={value.fluid_phase} onChange={onChange} />
        <TextField label="Owner user ID" name="owner_user_id" value={value.owner_user_id} onChange={onChange} />
        <TextField type="date" label="Last review date" name="last_review_date" value={value.last_review_date} onChange={onChange} />
        <TextField type="date" label="Next review due" name="next_review_due" value={value.next_review_due} onChange={onChange} />
        <SelectField label="Status" name="status" value={value.status ?? 'Draft'} options={['Draft','Active','Under Review','Approved','Archived']} onChange={onChange} />
        <CheckboxField label="Safety-critical" name="safety_critical" value={value.safety_critical} onChange={onChange} />
        <CheckboxField label="PSM-critical" name="psm_critical" value={value.psm_critical} onChange={onChange} />
        <CheckboxField label="MOC update required" name="moc_update_required" value={value.moc_update_required} onChange={onChange} />
        <CheckboxField label="PSSR blocker" name="pssr_blocker" value={value.pssr_blocker} onChange={onChange} />
        <CheckboxField label="MI readiness impact" name="mi_readiness_impact" value={value.mi_readiness_impact} onChange={onChange} />
        <TextAreaField label="Design assumptions / notes" name="notes" value={value.notes} onChange={onChange} />
      </div>
    </PsiCard>
  );
}
