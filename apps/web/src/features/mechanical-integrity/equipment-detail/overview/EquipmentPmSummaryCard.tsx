import { DataPanel } from './panel-utils';

export function EquipmentPmSummaryCard({ summary }: { summary?: Record<string, unknown> | null }) {
  return <DataPanel title="Preventive Maintenance Summary" data={summary ?? { nextPmDueDate: 'Not scheduled', pmRequired: false }} />;
}

