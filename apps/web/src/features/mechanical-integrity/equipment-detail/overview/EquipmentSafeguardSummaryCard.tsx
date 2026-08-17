import { DataPanel } from './panel-utils';

export function EquipmentSafeguardSummaryCard({ summary }: { summary: Record<string, unknown> }) {
  return <DataPanel title="PSV / SIS / Alarm / Interlock Summary" data={summary} />;
}
