import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingRecordTable } from '../AuditMappingUi';

export function AuditMappingFindingsTab({ detail }: { detail: any }) { return <RegulatoryCard title="Finding Links" subtitle="Regulatory gaps that require finding linkage are tracked by backend coverage and gap services."><AuditMappingRecordTable rows={detail?.findings?.rows ?? detail?.links?.rows?.filter((row: any) => String(row.target_object_type).includes('Finding'))} /></RegulatoryCard>; }
