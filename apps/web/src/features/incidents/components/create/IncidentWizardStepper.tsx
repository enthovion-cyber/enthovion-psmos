'use client';
import type { IncidentWizardStep } from '../../types/incident-create.types';
export function IncidentWizardStepper({ steps, step, completed, onStep }: { steps: IncidentWizardStep[]; step: number; completed: number[]; onStep: (n: number) => void }) {
  return <nav className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-cyan-300/10 dark:bg-[#071525] md:grid-cols-2 xl:grid-cols-4">{steps.map((s) => <button key={s.id} type="button" onClick={() => onStep(s.id)} className={`rounded-lg border p-3 text-left ${s.id === step ? 'border-blue-500 bg-blue-500/10' : completed.includes(s.id) ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-slate-200 dark:border-cyan-300/10'}`}><div className="text-xs font-bold text-blue-600 dark:text-cyan-300">Step {s.id}</div><div className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.title}</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.description}</div></button>)}</nav>;
}
