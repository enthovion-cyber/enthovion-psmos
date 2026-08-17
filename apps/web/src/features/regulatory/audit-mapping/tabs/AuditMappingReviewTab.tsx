import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingRecordTable } from '../AuditMappingUi';
import { AuditMappingReadinessSection } from '../sections/AuditMappingReadinessSection';

export function AuditMappingReviewTab({ detail }: { detail: any }) { return <div className="space-y-5"><AuditMappingReadinessSection mapping={detail?.mapping} gaps={detail?.gaps} /><RegulatoryCard title="Review Records"><AuditMappingRecordTable rows={detail?.reviews?.rows} /></RegulatoryCard></div>; }
