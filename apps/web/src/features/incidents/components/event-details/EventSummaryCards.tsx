import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';

export function EventSummaryCards({ cards }: { cards: any[] }) {
  return <SummaryCardGrid cards={cards ?? []} />;
}
