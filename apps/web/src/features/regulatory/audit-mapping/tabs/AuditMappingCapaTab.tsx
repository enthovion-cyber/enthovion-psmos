import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingRecordTable } from '../AuditMappingUi';

export function AuditMappingCapaTab({ detail }: { detail: any }) { return <RegulatoryCard title="CAPA Links" subtitle="CAPA closure coverage is backend-generated and preserved in coverage records."><AuditMappingRecordTable rows={detail?.capa?.rows ?? detail?.links?.rows?.filter((row: any) => String(row.target_object_type).includes('CAPA'))} /></RegulatoryCard>; }
