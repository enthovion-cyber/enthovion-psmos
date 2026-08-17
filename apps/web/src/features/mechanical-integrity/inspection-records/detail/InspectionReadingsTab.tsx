import { InspectionReadingsEntrySection } from '../sections/InspectionReadingsEntrySection';
import type { MiInspectionReading } from '../../types/inspection-record.types';

export function InspectionReadingsTab({ rows, onAdd, onApprove, saving }: { rows: MiInspectionReading[]; onAdd: (input: Record<string, unknown>) => void; onApprove: (readingId: string) => void; saving?: boolean | undefined }) {
  return <InspectionReadingsEntrySection rows={rows} onAdd={onAdd} onApprove={onApprove} saving={saving} />;
}
