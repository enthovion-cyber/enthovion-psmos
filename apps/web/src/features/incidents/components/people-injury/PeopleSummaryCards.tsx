import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';

export function PeopleSummaryCards({ cards }: { cards: any[] }) {
  return <SummaryCardGrid cards={cards ?? []} />;
}
