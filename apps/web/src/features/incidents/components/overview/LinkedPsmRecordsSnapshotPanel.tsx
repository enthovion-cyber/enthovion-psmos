import { OverviewPanelShell, SnapshotGrid, MiniBars } from './OverviewPanelShell';
export function LinkedPsmRecordsSnapshotPanel({ data }: { data?: Record<string, any> }) {
  return <OverviewPanelShell title="Linked PSM Records Snapshot Panel" subtitle="PTW, MOC, PSSR, HAZOP/PHA, LOPA/SIL, and MI linkage summary."><SnapshotGrid data={data} fields={[['count','Linked records count'],['missingRequired','Missing required links']]} /><div className="mt-3"><MiniBars items={(data?.records ?? []).map((r:any)=>({label:r.type ?? 'Record', count:r.id ? 1 : 0}))} emptyMessage="No linked records available."/></div></OverviewPanelShell>;
}
