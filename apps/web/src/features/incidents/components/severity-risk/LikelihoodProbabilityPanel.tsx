import { Field, SelectField, TabPanel, ToggleGrid } from '../shared/IncidentTabPrimitives';

export function LikelihoodProbabilityPanel({ form, set, likelihoodOptions }: any) {
  return (
    <TabPanel title="Likelihood / Probability Panel">
      <div className="grid gap-3">
        <SelectField label="Likelihood" value={form.likelihood} options={likelihoodOptions} onChange={(v) => set('likelihood', v)} />
        <Field label="Likelihood basis" value={form.likelihoodBasis} onChange={(v) => set('likelihoodBasis', v)} />
        <Field label="Probability basis" value={form.probabilityBasis} onChange={(v) => set('probabilityBasis', v)} />
        <Field label="Exposure frequency" value={form.exposureFrequency} onChange={(v) => set('exposureFrequency', v)} />
        <Field label="Controls present" value={form.controlsPresent} onChange={(v) => set('controlsPresent', v)} />
        <ToggleGrid form={form} set={set} keys={[
          ['highPotentialNearMiss', 'High-potential near miss'],
          ['fatalityPotential', 'Fatality potential'],
          ['majorProcessSafetyPotential', 'Major process safety potential']
        ]} />
      </div>
    </TabPanel>
  );
}
