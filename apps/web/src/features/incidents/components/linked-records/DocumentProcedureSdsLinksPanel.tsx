import { LinkedRecordSimplePanel } from './LinkedRecordsPrimitives';
export function DocumentProcedureSdsLinksPanel({ rows }: { rows: any[] }) { return <LinkedRecordSimplePanel title="Document Control / Procedure / SDS Links Panel" data={{ rows }} empty="No Document Control, procedure, SOP, or SDS links." />; }
