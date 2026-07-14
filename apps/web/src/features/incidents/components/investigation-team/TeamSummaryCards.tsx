import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';
import { MiniDistribution } from './InvestigationTeamPrimitives';

export function TeamSummaryCards({ cards, charts }: { cards: any[]; charts?: any }) {
  return (
    <div className="grid gap-3">
      <SummaryCardGrid cards={cards ?? []} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MiniDistribution label="Role completion" rows={charts?.roleCompletion} />
        <MiniDistribution label="Acceptance status" rows={charts?.acceptanceStatus} />
        <MiniDistribution label="Competency gaps" rows={charts?.competencyGaps} />
        <MiniDistribution label="Availability / conflicts" rows={charts?.availabilityConflicts} />
        <MiniDistribution label="Readiness progress" rows={charts?.readiness} />
      </div>
    </div>
  );
}
