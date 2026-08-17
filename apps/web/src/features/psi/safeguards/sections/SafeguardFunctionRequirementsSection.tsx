import { PsiCard } from '../../shared/PsiUi';
import { FieldGrid, TextArea, TextInput, Toggle } from '../SafeguardPrimitives';

export function SafeguardFunctionRequirementsSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="3. Safeguard Function & Requirements" subtitle="Safety function, required response, setpoint/safe state, reliability/availability basis, testing/inspection foundation, failure modes, common cause, human factors, and bypass rules."><FieldGrid>
    <TextArea label="Safeguard function description" value={value.function_description} onChange={(function_description) => onChange({ function_description })} />
    <TextArea label="Design intent" value={value.design_intent} onChange={(design_intent) => onChange({ design_intent })} />
    <TextInput label="Required action" value={value.required_action} onChange={(required_action) => onChange({ required_action })} />
    <TextInput label="Required response time" value={value.required_response_time} onChange={(required_response_time) => onChange({ required_response_time })} />
    <TextInput label="Required activation condition" value={value.activation_condition} onChange={(activation_condition) => onChange({ activation_condition })} />
    <TextInput label="Safe state" value={value.safe_state} onChange={(safe_state) => onChange({ safe_state })} />
    <TextInput label="Trip / action setpoint" value={value.trip_action_setpoint} onChange={(trip_action_setpoint) => onChange({ trip_action_setpoint })} />
    <TextInput label="Alarm priority foundation" value={value.alarm_priority_foundation} onChange={(alarm_priority_foundation) => onChange({ alarm_priority_foundation })} />
    <TextInput label="Operator response requirement" value={value.operator_response_requirement} onChange={(operator_response_requirement) => onChange({ operator_response_requirement })} />
    <TextInput label="Required availability" value={value.required_availability} onChange={(required_availability) => onChange({ required_availability })} />
    <TextInput label="Required reliability foundation" value={value.required_reliability_foundation} onChange={(required_reliability_foundation) => onChange({ required_reliability_foundation })} />
    <TextInput label="Required proof/test interval foundation" value={value.required_proof_test_interval} onChange={(required_proof_test_interval) => onChange({ required_proof_test_interval })} />
    <TextInput label="Required inspection frequency foundation" value={value.required_inspection_frequency} onChange={(required_inspection_frequency) => onChange({ required_inspection_frequency })} />
    <TextInput label="Required maintenance requirement foundation" value={value.required_maintenance_requirement} onChange={(required_maintenance_requirement) => onChange({ required_maintenance_requirement })} />
    <TextInput label="Required competence / training" value={value.required_competence_training} onChange={(required_competence_training) => onChange({ required_competence_training })} />
    <TextInput label="Failure mode" value={value.failure_mode} onChange={(failure_mode) => onChange({ failure_mode })} />
    <TextInput label="Failure consequence" value={value.failure_consequence} onChange={(failure_consequence) => onChange({ failure_consequence })} />
    <TextInput label="Common cause concern" value={value.common_cause_concern} onChange={(common_cause_concern) => onChange({ common_cause_concern })} />
    <TextInput label="Human factor dependency" value={value.human_factor_dependency} onChange={(human_factor_dependency) => onChange({ human_factor_dependency })} />
    <Toggle label="Bypass / override allowed" checked={value.bypass_override_allowed} onChange={(bypass_override_allowed) => onChange({ bypass_override_allowed })} />
    <TextInput label="Maximum allowed bypass duration" value={value.maximum_allowed_bypass_duration} onChange={(maximum_allowed_bypass_duration) => onChange({ maximum_allowed_bypass_duration })} />
    <TextArea label="Temporary impairment controls / notes" value={value.temporary_impairment_controls ?? value.notes} onChange={(temporary_impairment_controls) => onChange({ temporary_impairment_controls })} />
  </FieldGrid></PsiCard>;
}
