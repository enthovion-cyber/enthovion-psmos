import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';
export function TimelineSummaryCards({ cards }: { cards: any[] }) { return <SummaryCardGrid cards={cards ?? []} />; }
