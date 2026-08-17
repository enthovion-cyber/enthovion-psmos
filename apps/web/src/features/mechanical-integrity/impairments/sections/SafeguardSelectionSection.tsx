import type { MiImpairmentLookups } from '../../types/impairment.types';
import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { Field, inputClass } from './SectionField';

export function SafeguardSelectionSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: MiImpairmentLookups | undefined; onChange: (value: Record<string, any>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <SectionCard title="1. Safeguard Selection" description="Select the real safeguard record. Backend validates company, site, duplicate active bypasses, and LOPA/SIL/startup warnings.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Safeguard type"><select className={inputClass} value={value.safeguardType ?? ''} onChange={(e) => set('safeguardType', e.target.value)}><option value="">Select type</option>{lookups?.safeguardTypes?.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Safeguard record ID" hint="Use the actual SIF/interlock/alarm/relief-device record ID."><input className={inputClass} value={value.safeguardId ?? ''} onChange={(e) => set('safeguardId', e.target.value)} /></Field>
        <Field label="Safeguard tag"><input className={inputClass} value={value.safeguardTag ?? ''} onChange={(e) => set('safeguardTag', e.target.value)} /></Field>
        <Field label="Protected equipment / equipment tag"><input className={inputClass} value={value.equipmentTag ?? ''} onChange={(e) => set('equipmentTag', e.target.value)} /></Field>
        <Field label="Equipment criticality"><input className={inputClass} value={value.equipmentCriticality ?? ''} onChange={(e) => set('equipmentCriticality', e.target.value)} /></Field>
        <Field label="Current safeguard status"><input className={inputClass} value={value.currentSafeguardStatus ?? ''} onChange={(e) => set('currentSafeguardStatus', e.target.value)} /></Field>
        <Field label="Last test / inspection"><input type="date" className={inputClass} value={value.lastTestAt ?? ''} onChange={(e) => set('lastTestAt', e.target.value)} /></Field>
        <Field label="Next due"><input type="date" className={inputClass} value={value.nextTestDueAt ?? ''} onChange={(e) => set('nextTestDueAt', e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">If this safeguard is a credited LOPA/SIL IPL or startup blocker, the backend stores the warning and updates equipment readiness/PSSR impact.</div>
    </SectionCard>
  );
}
