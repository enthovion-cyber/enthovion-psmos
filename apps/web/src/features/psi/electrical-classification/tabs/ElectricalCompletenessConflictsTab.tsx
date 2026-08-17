import type { ElectricalDetail } from '../../types/electrical-classification.types';
import { ElectricalCompletenessPanel } from '../ElectricalCompletenessPanel';
import { ElectricalConflictPanel } from '../ElectricalConflictPanel';

export function ElectricalCompletenessConflictsTab({ detail }: { detail: ElectricalDetail }) {
  return <div className="space-y-5"><ElectricalCompletenessPanel checks={detail.completeness} score={detail.classification.completeness_score} /><ElectricalConflictPanel conflicts={detail.conflicts} /></div>;
}
