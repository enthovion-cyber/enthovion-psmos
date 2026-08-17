import { AuditMappingRecordTable } from '../AuditMappingUi';
import { AuditMappingCoverageSection } from '../sections/AuditMappingCoverageSection';
import { RegulatoryCard } from '../../shared/RegulatoryUi';

export function AuditMappingCoverageTab({ detail }: { detail: any }) { return <div className="space-y-5"><AuditMappingCoverageSection mapping={detail?.mapping} /><RegulatoryCard title="Coverage Records"><AuditMappingRecordTable rows={detail?.coverage?.rows} /></RegulatoryCard></div>; }
