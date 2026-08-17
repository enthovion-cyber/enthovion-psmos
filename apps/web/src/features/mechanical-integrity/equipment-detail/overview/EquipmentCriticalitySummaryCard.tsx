import { DataPanel } from './panel-utils';

export function EquipmentCriticalitySummaryCard({ summary }: { summary: Record<string, unknown> }) {
  return <DataPanel title="Criticality Summary" data={summary} />;
}
