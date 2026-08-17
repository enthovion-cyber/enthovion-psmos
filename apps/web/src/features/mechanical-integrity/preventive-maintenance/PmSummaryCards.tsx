import { DataPanel } from '../equipment-detail/overview/panel-utils';

export function PmSummaryCards({ summary }: { summary?: Record<string, unknown> }) {
  return <DataPanel title="PM Summary Cards" data={summary ?? { totalPlans: 0, activePlans: 0, dueSoon: 0, overdue: 0 }} />;
}

