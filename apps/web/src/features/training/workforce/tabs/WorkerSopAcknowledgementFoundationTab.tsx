import { FoundationTab } from './WorkerOverviewTab';
export function WorkerSopAcknowledgementFoundationTab({ summary }: { summary: Record<string, any> }) { return <FoundationTab title="SOP Acknowledgement Foundation" message={summary.emptyStates?.sopAcknowledgements ?? 'SOP acknowledgement records are a later phase.'} />; }
