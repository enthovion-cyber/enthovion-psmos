import { OverviewPanelShell, SnapshotGrid, MiniBars } from './OverviewPanelShell';
export function CorrectiveActionSnapshotPanel({ data }: { data?: Record<string, any> }) {
  return <OverviewPanelShell title="Corrective Actions / CAPA Snapshot Panel" subtitle="Uses Universal Action Engine data only."><SnapshotGrid data={data} fields={[['openActions','Open actions'],['overdueActions','Overdue actions'],['criticalActions','Critical/high actions'],['usesUniversalActionEngine','Universal Action Engine']]} /><div className="mt-3"><MiniBars items={(data?.actions ?? []).map((a:any)=>({label:a.title ?? a.actionNumber ?? 'Action', count:1}))} emptyMessage="No Universal Actions linked yet."/></div></OverviewPanelShell>;
}
