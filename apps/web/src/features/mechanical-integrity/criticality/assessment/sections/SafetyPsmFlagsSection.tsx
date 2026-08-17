'use client';

export function SafetyPsmFlagsSection({ form, onChange }: { form: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">Safety / PSM Criticality Flags</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.safetyCritical} onChange={(e) => onChange({ safetyCritical: e.target.checked })} /> Safety critical equipment</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.psmCritical} onChange={(e) => onChange({ psmCritical: e.target.checked })} /> PSM critical equipment</label>
        <label className="text-sm">Safety critical reason<input className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" value={form.safetyCriticalReason ?? ''} onChange={(e) => onChange({ safetyCriticalReason: e.target.value })} /></label>
        <label className="text-sm">PSM critical reason<input className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" value={form.psmCriticalReason ?? ''} onChange={(e) => onChange({ psmCriticalReason: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.startupBlockerPotential} onChange={(e) => onChange({ startupBlockerPotential: e.target.checked })} /> Startup blocker potential</label>
      </div>
    </section>
  );
}
