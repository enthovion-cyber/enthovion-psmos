import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function RestrictedConfidentialEvidencePanel({ data }: any) {
  return (
    <TabPanel title="Restricted / Confidential / Medical Evidence">
      <InfoRows rows={[
        ['Hidden by permission', data?.hiddenCount],
        ['Restricted records', data?.restrictedCount],
        ['Confidential records', data?.confidentialCount],
        ['Medical records', data?.medicalHidden]
      ]} />
      <p className="mt-3 text-xs text-slate-500">Restricted, confidential, and medical evidence is redacted unless the current user has the required permission.</p>
    </TabPanel>
  );
}
