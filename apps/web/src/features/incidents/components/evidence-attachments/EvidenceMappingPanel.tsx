import { EvidenceInfoPanel } from './EvidencePrimitives';

export function EvidenceMappingPanel({ rows }: { rows?: any[] }) {
  return <EvidenceInfoPanel title="Evidence Mapping Panel" rows={rows} empty="No evidence mappings to investigation records yet." />;
}
