import { PsiCard } from '../../shared/PsiUi';

export function OperatorResponseSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const row = value.operatorResponses?.[0] ?? {};
  const patch = (input: Record<string, unknown>) => onChange({ operatorResponses: [{ ...row, ...input }] });
  return (
    <PsiCard title="5. Operator Response" subtitle="Required operator action, response time, escalation, shutdown/emergency requirements, SOP links, PPE, and training foundation.">
      <div className="grid gap-3 md:grid-cols-3">
        {['required_operator_action','response_time_requirement','initial_action','follow_up_action','escalation_requirement','shutdown_requirement','emergency_response_requirement','required_notification','related_sop_document_id','related_emergency_procedure_id','required_ppe','training_requirement_foundation','notes'].map((key) => <input key={key} value={row[key] ?? ''} onChange={(e) => patch({ [key]: e.target.value })} placeholder={key.replaceAll('_', ' ')} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />)}
      </div>
    </PsiCard>
  );
}
