import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';
export function HistorySummaryCards({ cards }: { cards: any[] }) { return <SummaryCardGrid cards={cards ?? []} />; }
