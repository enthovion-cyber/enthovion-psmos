import { LinkedRecordSimplePanel } from './LinkedRecordsPrimitives';
export function BrokenStaleSupersededLinksPanel({ rows }: { rows: any[] }) { return <LinkedRecordSimplePanel title="Broken / Stale / Superseded Links Panel" data={{ rows }} empty="No broken, stale, superseded, restricted, or inaccessible links." />; }
