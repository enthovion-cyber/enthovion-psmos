import { TabPanel, TextArea, ToggleGrid } from '../shared/IncidentTabPrimitives';

export function EventDescriptionPanel({ form, set }: any) {
  return (
    <TabPanel title="Event Description">
      <div className="grid gap-3">
        <TextArea label="Detailed description" value={form.detailedDescription} onChange={(v) => set('detailedDescription', v)} />
        <TextArea label="Activity at time" value={form.activityAtTime} onChange={(v) => set('activityAtTime', v)} />
        <TextArea label="Abnormal condition / suspected initial cause" value={form.abnormalCondition} onChange={(v) => set('abnormalCondition', v)} />
        <TextArea label="Immediate and potential consequence" value={form.immediateConsequence} onChange={(v) => set('immediateConsequence', v)} />
        <ToggleGrid form={form} set={set} keys={[
          ['witnessesKnown', 'Witnesses known'],
          ['emergencyResponseActivated', 'Emergency response'],
          ['operationStopped', 'Operation stopped'],
          ['equipmentIsolated', 'Equipment isolated'],
          ['areaBarricaded', 'Area barricaded']
        ]} />
      </div>
    </TabPanel>
  );
}
