import { DataPanel } from './panel-utils';

export function EquipmentCmlSummaryCard({ summary }: { summary: Record<string, unknown> }) {
  return <DataPanel title="CML / TML Summary" data={summary} />;
}
