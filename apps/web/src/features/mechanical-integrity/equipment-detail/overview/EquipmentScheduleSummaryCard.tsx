import { DataPanel } from './panel-utils';

export function EquipmentScheduleSummaryCard({ summary }: { summary: Record<string, unknown> }) {
  return <DataPanel title="Inspection / PM / Calibration Summary" data={summary} />;
}
