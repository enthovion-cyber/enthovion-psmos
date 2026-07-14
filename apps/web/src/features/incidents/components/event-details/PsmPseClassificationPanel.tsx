import { InfoRows, TabPanel, TextArea } from '../shared/IncidentTabPrimitives';

export function PsmPseClassificationPanel({ data, form, set }: any) {
  return (
    <TabPanel title="PSM / Process Safety / API RP 754 Classification">
      <InfoRows rows={[
        ['PSM Incident', data.psmPseClassification?.isPsmIncident ? 'Yes' : 'No'],
        ['Process Safety Event', data.psmPseClassification?.isProcessSafetyEvent ? 'Yes' : 'No'],
        ['API RP 754 Tier', data.psmPseClassification?.apiRp754Tier ?? 'Not Determined'],
        ['Classification status', data.psmPseClassification?.classificationStatus ?? 'Not Determined'],
        ['Reviewer required', data.psmPseClassification?.reviewerRequired ? 'Yes' : 'No']
      ]} />
      <TextArea className="mt-3" label="Classification basis" value={form.pseClassificationBasis} onChange={(v) => set('pseClassificationBasis', v)} />
    </TabPanel>
  );
}
