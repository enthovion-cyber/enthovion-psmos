'use client';

export function AssessmentIdentificationSection({ form, onChange }: { form: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">Assessment Identification</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">Equipment ID<input className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" value={form.equipmentId ?? ''} onChange={(e) => onChange({ equipmentId: e.target.value })} /></label>
        <label className="text-sm">Assessment Type<select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" value={form.assessmentType ?? 'Initial'} onChange={(e) => onChange({ assessmentType: e.target.value })}>{['Initial','Periodic Review','Change-driven Review','Post-incident Review','MOC Review','Manual Revision'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm md:col-span-2">Assessment Reason<textarea className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" rows={3} value={form.assessmentReason ?? ''} onChange={(e) => onChange({ assessmentReason: e.target.value })} /></label>
      </div>
    </section>
  );
}
