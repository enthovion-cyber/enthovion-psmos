import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';
export function AssetSummaryCards({ cards }: { cards: any[] }) { return <SummaryCardGrid cards={cards ?? []} />; }
