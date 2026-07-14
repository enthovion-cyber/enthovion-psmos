import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';

export function SeveritySummaryCards({ cards }: { cards: any[] }) {
  return <SummaryCardGrid cards={cards ?? []} />;
}
