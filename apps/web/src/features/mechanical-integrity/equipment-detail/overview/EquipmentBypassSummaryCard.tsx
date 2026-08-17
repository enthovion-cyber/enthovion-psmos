import { DataPanel } from './panel-utils';

export function EquipmentBypassSummaryCard({ summary }: { summary: Record<string, unknown> }) {
  return <DataPanel title="Active Bypass / Impairment Summary" data={summary} />;
}
