import { EvidenceInfoPanel } from './EvidencePrimitives';

export function ChainOfCustodyPanel({ rows }: { rows?: any[] }) {
  return <EvidenceInfoPanel title="Chain of Custody Panel" rows={rows} empty="No chain of custody events have been logged." />;
}
