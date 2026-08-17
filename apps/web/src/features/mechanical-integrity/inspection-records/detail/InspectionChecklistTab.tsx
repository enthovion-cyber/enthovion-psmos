import { InspectionChecklistExecutionSection } from '../sections/InspectionChecklistExecutionSection';
import type { MiInspectionChecklistItem } from '../../types/inspection-record.types';

export function InspectionChecklistTab({ rows, onUpdate, saving }: { rows: MiInspectionChecklistItem[]; onUpdate: (itemId: string, input: Record<string, unknown>) => void; saving?: boolean | undefined }) {
  return <InspectionChecklistExecutionSection rows={rows} onUpdate={onUpdate} saving={saving} />;
}
