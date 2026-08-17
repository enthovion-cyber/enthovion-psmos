import { DrawingCompletenessPanel } from '../DrawingCompletenessPanel';
import { DrawingConflictPanel } from '../DrawingConflictPanel';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingCompletenessConflictsTab({ detail }: { detail: DrawingDetail }) {
  return <div className="space-y-5"><DrawingCompletenessPanel checks={detail.completeness} /><DrawingConflictPanel conflicts={detail.conflicts} /></div>;
}
