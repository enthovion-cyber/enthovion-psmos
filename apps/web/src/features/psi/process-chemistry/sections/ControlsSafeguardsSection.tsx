import { PsiCard } from '../../shared/PsiUi';

export function ControlsSafeguardsSection({ controls }: { controls?: Record<string, any>[] | undefined }) {
  return (
    <PsiCard title="Controls / Safeguards" subtitle="Procedures, safe operating limits, alarms, interlocks, SIF/SIS, PSV/relief, vent/scrubber systems, cooling, inerting, feed controls, ESD, quench, containment, detection, training, PTW/LOTO.">
      {!controls?.length ? <p className="text-sm text-[var(--psm-muted)]">No safeguards or control links are recorded for this chemistry.</p> : <div className="grid gap-3 md:grid-cols-2">{controls.map((control) => <div key={String(control.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{control.control_type}</p><p className="mt-1 text-sm text-[var(--psm-muted)]">{control.control_description}</p></div>)}</div>}
    </PsiCard>
  );
}
