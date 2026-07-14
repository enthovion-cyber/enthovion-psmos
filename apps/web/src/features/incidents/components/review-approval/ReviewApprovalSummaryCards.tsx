import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';

export function ReviewApprovalSummaryCards({ cards }: { cards: any[] }) {
  return <SummaryCardGrid cards={cards ?? []} />;
}
