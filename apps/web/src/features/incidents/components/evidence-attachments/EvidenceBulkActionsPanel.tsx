import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function EvidenceBulkActionsPanel({ data, onExport }: any) {
  return (
    <TabPanel title="Bulk Actions / Export Evidence Index">
      <InfoRows rows={[['Can export index', data?.canExportIndex ? 'Yes' : 'No'], ['Can archive', data?.canArchive ? 'Yes' : 'No'], ['Can download', data?.canDownload ? 'Yes' : 'No']]} />
      <button disabled={!data?.canExportIndex} title={data?.canExportIndex ? '' : 'Missing incidents.evidence.export_index permission'} onClick={onExport} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black disabled:opacity-50 dark:border-cyan-300/10">Export Index</button>
    </TabPanel>
  );
}
