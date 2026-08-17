import type { PlanSectionProps } from '../../types/inspection-plan.types';

export function PlanMethodProcedureSection({ value, onChange }: PlanSectionProps) {
  const scope = value.scope ?? {};
  const patch = (next: Record<string, unknown>) => onChange({ scope: { ...scope, methodProcedure: { ...((scope.methodProcedure as Record<string, unknown>) ?? {}), ...next } } });
  const method = (scope.methodProcedure as Record<string, unknown>) ?? {};
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">Method / Procedure / Checklist Basis</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {['procedureDocument','checklistTemplate','ndtProcedure','acceptanceStandard','inspectorQualification','requiredTools','requiredReportTemplate'].map((field) => <input key={field} value={String(method[field] ?? '')} onChange={(e) => patch({ [field]: e.target.value })} placeholder={field.replace(/[A-Z]/g, (m) => ` ${m}`).trim()} className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />)}
        {['requiredCalibrationCertificate','requiredPhotos','requiredMeasurements','requiredReviewApproval','requiredESignature','requiredAttachments'].map((field) => <label key={field} className="flex items-center gap-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={!!method[field]} onChange={(e) => patch({ [field]: e.target.checked })} /> {field.replace(/[A-Z]/g, (m) => ` ${m}`).trim()}</label>)}
      </div>
    </section>
  );
}
