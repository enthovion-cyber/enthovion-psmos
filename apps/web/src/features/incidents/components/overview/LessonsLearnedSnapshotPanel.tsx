import { OverviewPanelShell, SnapshotGrid } from './OverviewPanelShell';
export function LessonsLearnedSnapshotPanel({ data }: { data?: Record<string, any> }) {
  return <OverviewPanelShell title="Lessons Learned Snapshot Panel" subtitle="Requirement state only until the full Lessons Learned tab is built."><SnapshotGrid data={data} fields={[['status','Lessons learned status'],['required','Lessons learned required'],['message','Message']]} /></OverviewPanelShell>;
}
