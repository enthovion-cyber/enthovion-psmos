import { FoundationTab } from './WorkerOverviewTab';
export function WorkerIdentityTab({ worker }: { worker: Record<string, any> }) { return <FoundationTab title="Identity" message="Sensitive identity fields are displayed only when returned by the permission-scoped backend." rows={[worker]} />; }
