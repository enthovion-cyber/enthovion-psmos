import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingRecordTable } from '../AuditMappingUi';

export function AuditMappingHistoryTab({ detail }: { detail: any }) { return <RegulatoryCard title="Immutable Audit Mapping History"><AuditMappingRecordTable rows={detail?.history?.rows} /></RegulatoryCard>; }
