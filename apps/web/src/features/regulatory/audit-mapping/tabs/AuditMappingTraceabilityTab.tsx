import { AuditMappingJsonPanel, AuditMappingRecordTable } from '../AuditMappingUi';
import { RegulatoryCard } from '../../shared/RegulatoryUi';

export function AuditMappingTraceabilityTab({ detail }: { detail: any }) { return <div className="space-y-5"><AuditMappingJsonPanel title="Current Traceability Chain" value={detail?.mapping?.traceability_snapshot_json} /><RegulatoryCard title="Immutable Traceability Snapshots"><AuditMappingRecordTable rows={detail?.traceability?.rows} /></RegulatoryCard></div>; }
