import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingRecordTable } from '../AuditMappingUi';

export function AuditMappingScoringTab({ detail }: { detail: any }) { return <RegulatoryCard title="Compliance Score Links" subtitle="Score-run mappings feed audit assurance coverage and readiness."><AuditMappingRecordTable rows={detail?.scoring?.rows ?? detail?.links?.rows?.filter((row: any) => String(row.target_object_type).includes('Score'))} /></RegulatoryCard>; }
