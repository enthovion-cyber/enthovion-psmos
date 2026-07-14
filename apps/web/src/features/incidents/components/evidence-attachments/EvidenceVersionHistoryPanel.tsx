import { EvidenceInfoPanel } from './EvidencePrimitives';

export function EvidenceVersionHistoryPanel({ rows }: { rows?: any[] }) {
  return <EvidenceInfoPanel title="Evidence Version History" rows={rows} empty="No evidence versions have been created yet." />;
}
