import { FoundationTab } from './WorkerOverviewTab';
export function WorkerEmploymentTab({ worker }: { worker: Record<string, any> }) { return <FoundationTab title="Employment / Contractor Details" message="Employment and contractor foundation details." rows={[worker]} />; }
