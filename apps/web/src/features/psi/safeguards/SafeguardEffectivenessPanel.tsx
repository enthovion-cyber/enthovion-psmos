import { PsiCard } from '../shared/PsiUi';
import { IplQualificationBadge, SafeguardEffectivenessBadge } from '../shared/SafeguardBadges';
import { DetailGrid } from './SafeguardPrimitives';

export function SafeguardEffectivenessPanel({ effectiveness }: { effectiveness?: Record<string, any> | null | undefined }) {
  return <PsiCard title="Effectiveness / IPL Foundation" subtitle="PSI records effectiveness and independence basis only; actual IPL credit remains in LOPA/SIL.">
    <div className="mb-3 flex flex-wrap gap-2"><SafeguardEffectivenessBadge value={effectiveness?.effectiveness_status} /><IplQualificationBadge value={effectiveness?.ipl_qualification_status} /></div>
    <DetailGrid rows={['effectiveness_basis','independence_required','independence_basis','ipl_candidate','ipl_claimed_in_lopa','demand_mode_foundation','human_response_dependency','shared_component_common_cause_note','diagnostic_monitoring_basis','failure_data_source_foundation','reliability_note','limitations_assumptions','conditions_for_credit','not_creditable_reason','engineering_review_required','approved_exception','exception_reason'].map((key) => [key.replaceAll('_', ' '), String(effectiveness?.[key] ?? ''), !effectiveness?.[key]])} />
  </PsiCard>;
}
