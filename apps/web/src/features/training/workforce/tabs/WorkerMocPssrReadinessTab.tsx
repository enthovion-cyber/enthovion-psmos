import { FoundationTab } from './WorkerOverviewTab';
export function WorkerMocPssrReadinessTab({ summary }: { summary: Record<string, any> }) { return <FoundationTab title="MOC / PSSR Training Readiness" message={summary.emptyStates?.mocPssrReadiness ?? 'MOC/PSSR readiness appears when linked systems provide records.'} />; }
