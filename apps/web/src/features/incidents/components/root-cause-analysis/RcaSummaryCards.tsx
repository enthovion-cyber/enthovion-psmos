import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';
import { RcaMiniChart, RcaPanel } from './RcaPrimitives';

export function RcaSummaryCards({ cards, charts }: { cards?: any[]; charts?: any }) {
  return <div className="grid gap-4"><SummaryCardGrid cards={cards ?? []} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><RcaPanel title="Factor Status"><RcaMiniChart rows={charts?.factorStatus} empty="No causal factor status data." /></RcaPanel><RcaPanel title="Evidence Support"><RcaMiniChart rows={charts?.evidenceSupport} empty="No evidence support data." /></RcaPanel><RcaPanel title="Root Cause Categories"><RcaMiniChart rows={charts?.rootCauseCategories} empty="No root cause categories." /></RcaPanel><RcaPanel title="Quality Checks"><RcaMiniChart rows={charts?.quality} empty="No quality check chart data." /></RcaPanel></div></div>;
}
