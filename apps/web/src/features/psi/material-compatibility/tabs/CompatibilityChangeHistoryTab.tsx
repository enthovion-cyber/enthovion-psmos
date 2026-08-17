import { InfoPanel } from '../MaterialCompatibilityPrimitives';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function CompatibilityChangeHistoryTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  return <InfoPanel title="Change History" subtitle="Immutable PSI material compatibility history/audit events for create, edit, checks, conflicts, documents, review, approvals, archive/reactivate, and imports." rows={detail.history} emptyTitle="No history events returned" emptyMessage="Backend returned no material compatibility history events." />;
}

