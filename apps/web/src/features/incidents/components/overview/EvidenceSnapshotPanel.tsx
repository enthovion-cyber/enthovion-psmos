import { OverviewPanelShell, SnapshotGrid, MiniBars } from './OverviewPanelShell';
export function EvidenceSnapshotPanel({ data }: { data?: Record<string, any> }) {
  return <OverviewPanelShell title="Evidence / Attachment Snapshot Panel" subtitle={data?.restrictedHidden ? `${data.restrictedHidden} restricted evidence record(s) hidden.` : 'Initial evidence and attachment status.'}><SnapshotGrid data={data} fields={[['status','Evidence status'],['totalEvidence','Total evidence'],['visibleEvidence','Visible evidence'],['restrictedHidden','Restricted hidden'],['missingRequired','Missing required evidence']]} /><div className="mt-3"><MiniBars items={data?.byType as any[]} emptyMessage="No evidence has been uploaded yet."/></div></OverviewPanelShell>;
}
