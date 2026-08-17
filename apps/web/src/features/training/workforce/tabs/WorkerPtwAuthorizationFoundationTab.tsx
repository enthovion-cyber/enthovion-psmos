import { FoundationTab } from './WorkerOverviewTab';
export function WorkerPtwAuthorizationFoundationTab({ summary }: { summary: Record<string, any> }) { return <FoundationTab title="PTW Authorization Foundation" message={summary.emptyStates?.ptwAuthorization ?? 'PTW authorization enforcement is a later phase.'} />; }
