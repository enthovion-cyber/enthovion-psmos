import { FoundationTab } from './WorkerOverviewTab';
export function WorkerRolesCompetencyTab({ rows }: { rows: Array<Record<string, any>> }) { return <FoundationTab title="Job Roles / Competency Foundation" message="Role competency profiles are available in the Roles & Competency Profiles module and feed this worker's assignment, evaluation, and gap status." rows={rows} />; }
