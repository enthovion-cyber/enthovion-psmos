import { LinkedRecordSimplePanel } from './LinkedRecordsPrimitives';
export function PsmReviewLinksPanel({ rows }: { rows: any[] }) { return <LinkedRecordSimplePanel title="PSM Review Links Panel" data={{ rows }} empty="No PSM review link recommendations were returned." />; }
