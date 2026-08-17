import { InspectionFindingsEntrySection } from '../sections/InspectionFindingsEntrySection';
import type { MiInspectionFinding } from '../../types/inspection-record.types';

export function InspectionFindingsTab({ rows, onAdd, onClose, saving }: { rows: MiInspectionFinding[]; onAdd: (input: Record<string, unknown>) => void; onClose: (findingId: string) => void; saving?: boolean | undefined }) {
  return <InspectionFindingsEntrySection rows={rows} onAdd={onAdd} onClose={onClose} saving={saving} />;
}
