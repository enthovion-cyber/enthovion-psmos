import { AuditMappingKeyValueGrid, AuditMappingJsonPanel } from '../AuditMappingUi';
import { AuditMappingCoverageSection } from '../sections/AuditMappingCoverageSection';
import { AuditMappingLinksSection } from '../sections/AuditMappingLinksSection';
import { AuditMappingReadinessSection } from '../sections/AuditMappingReadinessSection';

export function AuditMappingOverviewTab({ detail }: { detail: any }) {
  return <div className="space-y-5"><AuditMappingKeyValueGrid data={detail?.mapping} keys={[['Mapping Code', 'mapping_code'], ['Mapping Type', 'mapping_type'], ['Source Type', 'regulatory_source_type'], ['Audit Target', 'audit_target_type'], ['Owner', 'owner_user_id'], ['Due Date', 'due_date'], ['Required Findings Review', 'required_findings_review'], ['Required CAPA Closure', 'required_capa_closure'], ['Required Score', 'required_score']]} /><AuditMappingCoverageSection mapping={detail?.mapping} /><AuditMappingReadinessSection mapping={detail?.mapping} gaps={detail?.gaps} /><AuditMappingLinksSection links={detail?.links} /><AuditMappingJsonPanel title="Traceability Snapshot" value={detail?.mapping?.traceability_snapshot_json} /></div>;
}
