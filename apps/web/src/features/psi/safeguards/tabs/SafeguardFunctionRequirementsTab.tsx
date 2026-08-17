import { PsiCard } from '../../shared/PsiUi';
import type { SafeguardDetail } from '../../types/safeguard.types';
import { DetailGrid } from '../SafeguardPrimitives';

const fields = ['function_description','design_intent','required_action','required_response_time','activation_condition','safe_state','trip_action_setpoint','alarm_priority_foundation','operator_response_requirement','required_availability','required_reliability_foundation','required_proof_test_interval','required_inspection_frequency','required_maintenance_requirement','required_competence_training','failure_mode','failure_consequence','common_cause_concern','human_factor_dependency','bypass_override_allowed','maximum_allowed_bypass_duration','temporary_impairment_controls','notes'];
export function SafeguardFunctionRequirementsTab({ detail }: { detail: SafeguardDetail }) {
  const row = detail.functionRequirements ?? {};
  return <PsiCard title="Function & Requirements" subtitle="Backend source of truth for safety function, response, setpoint/safe state, reliability/availability, proof-test, inspection, maintenance, competence, failure modes, common cause, human factors, and bypass controls."><DetailGrid rows={fields.map((key) => [key.replaceAll('_', ' '), String(row[key] ?? ''), !row[key]])} /></PsiCard>;
}
