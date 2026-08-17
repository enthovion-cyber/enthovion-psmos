import { AuditMappingJsonPanel, AuditMappingKeyValueGrid } from '../AuditMappingUi';

export function AuditMappingSourceTab({ detail }: { detail: any }) {
  return <div className="space-y-5"><AuditMappingKeyValueGrid data={detail?.mapping} keys={[['Source Type', 'regulatory_source_type'], ['Regulatory Item', 'regulatory_item_id'], ['Obligation', 'obligation_id'], ['Compliance Assessment', 'compliance_assessment_id'], ['Compliance Gap', 'compliance_gap_id'], ['Evidence Link', 'evidence_link_id'], ['Evidence Package', 'evidence_package_id']]} /><AuditMappingJsonPanel title="Preserved Source Snapshot" value={detail?.mapping?.source_snapshot_json} /></div>;
}
