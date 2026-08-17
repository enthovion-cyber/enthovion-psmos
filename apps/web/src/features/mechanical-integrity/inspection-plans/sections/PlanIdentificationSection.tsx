import type { PlanSectionProps } from '../../types/inspection-plan.types';

export function PlanIdentificationSection({ value, onChange }: PlanSectionProps) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">Plan Identification</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input value={value.planTitle} onChange={(e) => onChange({ planTitle: e.target.value })} placeholder="Plan title" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <select value={value.planType} onChange={(e) => onChange({ planType: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-[var(--psm-text)]"><option value="">Plan type</option><option>Visual Inspection Plan</option><option>External Inspection Plan</option><option>Internal Inspection Plan</option><option>Thickness Monitoring / UT Plan</option><option>CML/TML Inspection Plan</option><option>NDT Inspection Plan</option><option>Pressure Test Plan</option><option>Hydrotest Plan</option><option>Leak Test Plan</option><option>PSV / Relief Device Test Plan</option><option>SIS / SIF Proof Test Plan foundation</option><option>Custom Inspection Plan</option></select>
        <select value={value.inspectionMethod} onChange={(e) => onChange({ inspectionMethod: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-[var(--psm-text)]"><option value="">Inspection method</option><option>Visual</option><option>UT Thickness</option><option>Radiography</option><option>Magnetic Particle</option><option>Dye Penetrant</option><option>Hydrotest</option><option>Leak Test</option><option>Functional Test</option><option>Proof Test</option><option>Calibration Check</option><option>Custom</option></select>
        <select value={value.priority ?? 'Normal'} onChange={(e) => onChange({ priority: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-[var(--psm-text)]"><option>Low</option><option>Normal</option><option>High</option><option>Critical</option></select>
        <input type="date" value={value.effectiveDate ?? ''} onChange={(e) => onChange({ effectiveDate: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <input type="date" value={value.expiryReviewDate ?? ''} onChange={(e) => onChange({ expiryReviewDate: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <textarea value={value.planDescription ?? ''} onChange={(e) => onChange({ planDescription: e.target.value })} placeholder="Plan description, criticality basis, notes" className="md:col-span-2 rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
      </div>
    </section>
  );
}
