import { DataPanel } from './panel-utils';

export function EquipmentCalibrationSummaryCard({ summary }: { summary?: Record<string, unknown> | null }) {
  return <DataPanel title="Calibration Summary" data={summary ?? { nextCalibrationDueDate: 'Not scheduled', calibrationRequired: false }} />;
}

