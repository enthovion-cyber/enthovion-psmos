import { TeamInfoPanel } from './InvestigationTeamPrimitives';
export function MeetingSessionPlanningPanel({ data }: any) { return <TeamInfoPanel title="Meeting & Session Planning" rows={data?.rows} empty="No investigation team sessions planned." />; }
