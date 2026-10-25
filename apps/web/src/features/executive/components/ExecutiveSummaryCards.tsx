import type { ExecutiveKpiResult } from '../types/executive-kpi.types';
import { ExecutiveEmpty } from './ExecutivePanel';
import { ExecutiveKpiCard } from './ExecutiveKpiCard';

export function ExecutiveSummaryCards({ cards }: { cards: ExecutiveKpiResult[] }) { if (!cards.length) return <ExecutiveEmpty message="No KPI definitions are available for this company. Apply the Executive KPI migration and configure permitted source modules." />; return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <ExecutiveKpiCard key={card.id} result={card} />)}</div>; }
