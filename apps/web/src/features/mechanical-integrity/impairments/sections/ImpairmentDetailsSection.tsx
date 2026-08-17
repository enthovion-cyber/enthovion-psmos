import type { MiImpairmentLookups } from '../../types/impairment.types';
import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { BoolField, Field, inputClass } from './SectionField';

export function ImpairmentDetailsSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: MiImpairmentLookups | undefined; onChange: (value: Record<string, any>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <SectionCard title="2. Bypass / Impairment Details" description="Capture type, operational need, reason, affected function, consequence, and work basis.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Bypass / impairment type"><select className={inputClass} value={value.impairmentType ?? ''} onChange={(e) => set('impairmentType', e.target.value)}><option value="">Select type</option>{lookups?.impairmentTypes?.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Reason"><select className={inputClass} value={value.reason ?? ''} onChange={(e) => set('reason', e.target.value)}><option value="">Select reason</option>{['Maintenance','Testing','Calibration','Repair','Troubleshooting','Operational need','Startup / shutdown','Emergency response','Failed device','Nuisance trip / alarm','Project work','Temporary change','Other'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Planned / emergency"><select className={inputClass} value={value.plannedEmergency ?? 'Planned'} onChange={(e) => set('plannedEmergency', e.target.value)}><option>Planned</option><option>Emergency</option></select></Field>
        <Field label="Work description"><textarea className={inputClass} rows={3} value={value.workDescription ?? ''} onChange={(e) => set('workDescription', e.target.value)} /></Field>
        <Field label="Operational need"><textarea className={inputClass} rows={3} value={value.operationalNeed ?? ''} onChange={(e) => set('operationalNeed', e.target.value)} /></Field>
        <Field label="Consequence if needed"><textarea className={inputClass} rows={3} value={value.consequenceIfNeeded ?? ''} onChange={(e) => set('consequenceIfNeeded', e.target.value)} /></Field>
        <Field label="Affected function"><input className={inputClass} value={value.affectedFunction ?? ''} onChange={(e) => set('affectedFunction', e.target.value)} /></Field>
        <Field label="Affected scenario"><input className={inputClass} value={value.affectedScenario ?? ''} onChange={(e) => set('affectedScenario', e.target.value)} /></Field>
        <Field label="Affected equipment"><input className={inputClass} value={value.affectedEquipment ?? ''} onChange={(e) => set('affectedEquipment', e.target.value)} /></Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <BoolField label="Testing / maintenance related" checked={!!value.testingMaintenanceRelated} onChange={(next) => set('testingMaintenanceRelated', next)} />
        <BoolField label="LOPA / SIL IPL" checked={!!value.lopaSilIpl} onChange={(next) => set('lopaSilIpl', next)} />
        <BoolField label="Safety critical" checked={!!value.safetyCritical} onChange={(next) => set('safetyCritical', next)} />
        <BoolField label="PSM critical" checked={!!value.psmCritical} onChange={(next) => set('psmCritical', next)} />
      </div>
    </SectionCard>
  );
}
