import type { SafeguardDetail } from '../../types/safeguard.types';
import { SafeguardCompletenessPanel } from '../SafeguardCompletenessPanel';
import { SafeguardConflictPanel } from '../SafeguardConflictPanel';

export function SafeguardCompletenessConflictsTab({ detail }: { detail: SafeguardDetail }) {
  return <div className="space-y-5"><SafeguardCompletenessPanel checks={detail.completeness} score={detail.safeguard.completeness_score} /><SafeguardConflictPanel conflicts={detail.conflicts} /></div>;
}
