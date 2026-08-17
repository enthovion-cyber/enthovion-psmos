import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingRecordTable } from '../AuditMappingUi';

export function AuditMappingEvidenceTab({ detail }: { detail: any }) { return <RegulatoryCard title="Evidence Mapping" subtitle="Audit evidence links are redacted by the backend when restricted evidence permission is missing."><AuditMappingRecordTable rows={detail?.evidence?.rows ?? detail?.links?.rows?.filter((row: any) => String(row.target_object_type).includes('Evidence'))} /></RegulatoryCard>; }
