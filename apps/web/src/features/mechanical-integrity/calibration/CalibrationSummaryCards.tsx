import { DataPanel } from '../equipment-detail/overview/panel-utils';

export function CalibrationSummaryCards({ summary }: { summary?: Record<string, unknown> }) {
  return <DataPanel title="Calibration Summary Cards" data={summary ?? { totalPlans: 0, activePlans: 0, dueSoon: 0, overdue: 0, failed: 0 }} />;
}

