import { DataPanel } from './panel-utils';

export function EquipmentDeficiencySummaryCard({ summary }: { summary: Record<string, unknown> }) {
  return <DataPanel title="Deficiency Summary" data={summary} />;
}
