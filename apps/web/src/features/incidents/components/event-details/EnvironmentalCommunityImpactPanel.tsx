import { Field, TabPanel, ToggleGrid } from '../shared/IncidentTabPrimitives';

export function EnvironmentalCommunityImpactPanel({ form, set }: any) {
  return (
    <TabPanel title="Environmental / Community Impact">
      <ToggleGrid form={form} set={set} keys={[
        ['environmentalImpact', 'Environmental impact'],
        ['communityImpact', 'Community impact'],
        ['regulatoryReportingRequired', 'Regulatory reporting'],
        ['acuteRelease', 'Acute release'],
        ['fireExplosionOccurred', 'Fire/explosion'],
        ['toxicExposureOccurred', 'Toxic exposure']
      ]} />
      <div className="mt-3 grid gap-3">
        <Field label="Released material" value={form.releasedMaterial} onChange={(v) => set('releasedMaterial', v)} />
        <Field label="Released quantity" value={form.releasedQuantity} onChange={(v) => set('releasedQuantity', v)} />
        <Field label="Release unit / duration" value={`${form.releaseUnit ?? ''}${form.releaseDuration ? ` / ${form.releaseDuration}` : ''}`} onChange={(v) => set('releaseUnit', v)} />
      </div>
    </TabPanel>
  );
}
