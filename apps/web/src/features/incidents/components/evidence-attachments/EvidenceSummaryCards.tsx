import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';

export function EvidenceSummaryCards({ cards }: { cards: any[] }) {
  return <SummaryCardGrid cards={cards ?? []} />;
}
