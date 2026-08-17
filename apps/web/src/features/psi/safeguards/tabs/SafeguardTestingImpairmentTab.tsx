import { PsiCard } from '../../shared/PsiUi';
import { SafeguardImpairmentBadge, SafeguardTestingStatusBadge } from '../../shared/SafeguardBadges';
import type { SafeguardDetail } from '../../types/safeguard.types';
import { DetailGrid } from '../SafeguardPrimitives';

const fields = ['testing_required','testing_source_module','test_proof_inspection_requirement','last_test_date','next_test_due','monitoring_method','inspection_requirement','maintenance_requirement','active_bypass_impairment_link','bypass_authorization_requirement','impairment_mitigation_required','temporary_control_requirement','readiness_impact','notes'];
export function SafeguardTestingImpairmentTab({ detail }: { detail: SafeguardDetail }) {
  const row = detail.testingStatus ?? {};
  return <PsiCard title="Testing / Monitoring / Impairment" subtitle="Status comes from real source modules where available. Manual status cannot override source lifecycle without controlled permission and reason."><div className="mb-3 flex flex-wrap gap-2"><SafeguardTestingStatusBadge value={row.test_status ?? detail.safeguard.testing_status} /><SafeguardImpairmentBadge value={row.bypass_impairment_status ?? detail.safeguard.impairment_status} /></div><DetailGrid rows={fields.map((key) => [key.replaceAll('_', ' '), String(row[key] ?? ''), !row[key]])} /></PsiCard>;
}
