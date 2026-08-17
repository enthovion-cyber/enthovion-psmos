import { CompatibilityCompletenessPanel } from '../CompatibilityCompletenessPanel';
import { CompatibilityConflictPanel } from '../CompatibilityConflictPanel';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function CompatibilityCompletenessConflictsTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  return <div className="space-y-5"><CompatibilityCompletenessPanel checks={detail.completeness} score={detail.compatibility.completeness_score} /><CompatibilityConflictPanel conflicts={detail.conflicts} /></div>;
}

