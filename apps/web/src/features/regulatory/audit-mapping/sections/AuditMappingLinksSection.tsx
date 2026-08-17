import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingRecordTable } from '../AuditMappingUi';

export function AuditMappingLinksSection({ links }: { links?: { rows?: Record<string, any>[] | undefined } | undefined }) {
  return <RegulatoryCard title="Audit Links" subtitle="Linked audit programs, plans, checklists, execution records, findings, CAPA, evidence, score runs, and snapshots."><AuditMappingRecordTable rows={links?.rows} /></RegulatoryCard>;
}
