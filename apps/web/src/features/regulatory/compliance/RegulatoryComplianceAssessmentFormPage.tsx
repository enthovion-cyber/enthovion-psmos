'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryComplianceAssessmentWizard } from './RegulatoryComplianceAssessmentWizard';

export function RegulatoryComplianceAssessmentFormPage({ initial }: { initial?: Record<string, unknown> | undefined }) {
  return <RegulatoryLayout current="Compliance Status"><div className="space-y-5"><RegulatoryHeader title="New Compliance Assessment" subtitle="Create a backend-controlled compliance status assessment for a real regulatory item or obligation." /><RegulatoryComplianceAssessmentWizard initial={initial} /></div></RegulatoryLayout>;
}
