'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryButton } from '../shared/RegulatoryUi';
import { regulatoryApplicabilityService } from '../services/regulatory-applicability.service';
import { ApplicabilityItemSelectionSection } from './sections/ApplicabilityItemSelectionSection';
import { ApplicabilityJurisdictionSection } from './sections/ApplicabilityJurisdictionSection';
import { ApplicabilityScopeSection } from './sections/ApplicabilityScopeSection';
import { ApplicabilityProfileCriteriaSection } from './sections/ApplicabilityProfileCriteriaSection';
import { ApplicabilityQuestionsSection } from './sections/ApplicabilityQuestionsSection';
import { ApplicabilityGapsSection } from './sections/ApplicabilityGapsSection';
import { ApplicabilityDecisionSection } from './sections/ApplicabilityDecisionSection';

export function RegulatoryApplicabilityAssessmentWizard() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  async function submit() {
    setSaving(true); setError(null);
    try {
      const detail = await regulatoryApplicabilityService.create(values);
      if (values.applicabilityStatus && values.applicabilityStatus !== 'Not Assessed') await regulatoryApplicabilityService.saveDecision(detail.assessment.id, { decision: values.applicabilityStatus, rationale: values.rationale, includedScope: values.includedScope, excludedScope: values.excludedScope });
      router.push(`/regulatory/applicability/assessments/${detail.assessment.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Assessment save failed.'); }
    finally { setSaving(false); }
  }
  return <div className="space-y-4">{error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}<ApplicabilityItemSelectionSection values={values} set={set} /><ApplicabilityJurisdictionSection values={values} set={set} /><ApplicabilityScopeSection values={values} set={set} /><ApplicabilityProfileCriteriaSection values={values} set={set} /><ApplicabilityQuestionsSection /><ApplicabilityGapsSection /><ApplicabilityDecisionSection values={values} set={set} /><div className="flex justify-end gap-2"><RegulatoryButton variant="secondary" href="/regulatory/applicability/assessments">Cancel</RegulatoryButton><RegulatoryButton onClick={submit} disabled={saving || !values.regulatoryItemId} title={!values.regulatoryItemId ? 'Regulatory item ID is required.' : saving ? 'Saving assessment...' : undefined}>{saving ? 'Saving...' : 'Review & Save Assessment'}</RegulatoryButton></div></div>;
}
