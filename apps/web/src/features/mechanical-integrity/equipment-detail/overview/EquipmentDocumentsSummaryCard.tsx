import { DataPanel } from './panel-utils';

export function EquipmentDocumentsSummaryCard({ summary }: { summary: Record<string, unknown> }) {
  return <DataPanel title="Documents / Certificates Summary" data={summary} />;
}
