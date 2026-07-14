import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';
export function LessonsSummaryCards({ cards }: { cards: any[] }) { return <SummaryCardGrid cards={cards ?? []} />; }
