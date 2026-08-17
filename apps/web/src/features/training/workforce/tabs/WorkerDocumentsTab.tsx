import { FoundationTab } from './WorkerOverviewTab';
export function WorkerDocumentsTab({ rows }: { rows: Array<Record<string, any>> }) { return <FoundationTab title="Documents" message="Document links use Document Control only. No raw file content is stored here." rows={rows} />; }
