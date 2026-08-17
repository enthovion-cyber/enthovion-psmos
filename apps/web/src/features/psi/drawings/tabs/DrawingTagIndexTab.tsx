import { DrawingTagIndexTable } from '../DrawingTagIndexTable';
import { TagIndexImportDialog } from '../TagIndexImportDialog';
import { PsiCard } from '../../shared/PsiUi';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingTagIndexTab({ detail }: { detail: DrawingDetail }) {
  return <div className="space-y-5"><TagIndexImportDialog drawingId={detail.drawing.id} /><PsiCard title="Tag Index" subtitle="Searchable tag foundation for equipment, line, instrument, PSV, SIF, interlock, alarm, analyzer, fire/gas, utility, drain, and vent tags."><DrawingTagIndexTable rows={detail.tagIndex} /></PsiCard></div>;
}
