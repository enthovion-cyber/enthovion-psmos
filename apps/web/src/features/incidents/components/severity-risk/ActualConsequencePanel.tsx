import { Field, SelectField, TabPanel, TextArea } from '../shared/IncidentTabPrimitives';

export function ActualConsequencePanel({ form, set, severityOptions }: any) {
  return (
    <TabPanel title="Actual Consequence Panel">
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="Actual severity" value={form.actualSeverity} options={severityOptions} onChange={(v) => set('actualSeverity', v)} />
        <Field label="Actual consequence category" value={form.actualConsequenceCategory} onChange={(v) => set('actualConsequenceCategory', v)} />
        <Field label="Injury severity" value={form.actualInjurySeverity} onChange={(v) => set('actualInjurySeverity', v)} />
        <Field label="Environmental impact" value={form.actualEnvironmentalImpact} onChange={(v) => set('actualEnvironmentalImpact', v)} />
        <Field label="Asset damage" value={form.actualAssetDamage} onChange={(v) => set('actualAssetDamage', v)} />
        <Field label="Production impact" value={form.actualProductionImpact} onChange={(v) => set('actualProductionImpact', v)} />
      </div>
      <TextArea className="mt-3" label="Actual consequence / notes" value={form.actualConsequenceNotes || form.actualConsequence} onChange={(v) => set('actualConsequenceNotes', v)} />
    </TabPanel>
  );
}
