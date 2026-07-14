import { EvidenceInfoPanel } from './EvidencePrimitives';

export function DocumentControlLinkedDocumentsPanel({ rows }: { rows?: any[] }) {
  return <EvidenceInfoPanel title="Document Control / Linked Documents" rows={rows} empty="No controlled Document Control links are attached." />;
}
