import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryAuditMappingWizard } from './RegulatoryAuditMappingWizard';

export function RegulatoryAuditMappingFormPage({ initialValues }: { initialValues?: Record<string, any> | undefined }) {
  return (
    <RegulatoryLayout current="New Audit Mapping">
      <div className="space-y-5">
        <RegulatoryHeader title="New Audit Mapping" subtitle="Create a backend-controlled traceability link from regulatory obligation to audit assurance records." />
        <RegulatoryAuditMappingWizard initialValues={initialValues} />
      </div>
    </RegulatoryLayout>
  );
}
