import { Field, SelectField, TabPanel, TextArea } from '../shared/IncidentTabPrimitives';

export function PotentialConsequencePanel({ form, set, severityOptions }: any) {
  return (
    <TabPanel title="Potential Consequence Panel">
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="Potential severity" value={form.potentialSeverity} options={severityOptions} onChange={(v) => set('potentialSeverity', v)} />
        <Field label="Potential consequence category" value={form.potentialConsequenceCategory} onChange={(v) => set('potentialConsequenceCategory', v)} />
        <Field label="Potential injury severity" value={form.potentialInjurySeverity} onChange={(v) => set('potentialInjurySeverity', v)} />
        <Field label="Potential environmental impact" value={form.potentialEnvironmentalImpact} onChange={(v) => set('potentialEnvironmentalImpact', v)} />
        <Field label="Potential asset damage" value={form.potentialAssetDamage} onChange={(v) => set('potentialAssetDamage', v)} />
        <Field label="Potential process safety consequence" value={form.potentialProcessSafetyConsequence} onChange={(v) => set('potentialProcessSafetyConsequence', v)} />
      </div>
      <TextArea className="mt-3" label="Potential consequence and basis" value={form.potentialSeverityBasis || form.potentialConsequence} onChange={(v) => set('potentialSeverityBasis', v)} />
    </TabPanel>
  );
}
