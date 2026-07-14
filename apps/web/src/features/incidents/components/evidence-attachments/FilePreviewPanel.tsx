import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function FilePreviewPanel({ data, accessMessage }: any) {
  return (
    <TabPanel title="File Preview Panel">
      <InfoRows rows={[['Storage available', data?.storageAvailable ? 'Yes' : 'No'], ['Signed URL required', data?.previewRequiresSignedUrl ? 'Yes' : 'No'], ['Last access result', accessMessage]]} />
      <p className="mt-3 text-xs text-slate-500">{data?.message ?? 'Preview/download availability is controlled by backend permissions and storage configuration.'}</p>
    </TabPanel>
  );
}
