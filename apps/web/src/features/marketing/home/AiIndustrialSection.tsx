import { BrainCircuit, CheckCircle2 } from 'lucide-react';
import { aiFeatures } from './marketing-content';

export function AiIndustrialSection() {
  return (
    <section id="ai" className="bg-[var(--psm-surface)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[.18em] text-blue-500">AI + Industrial Intelligence</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal">AI-assisted decision support for qualified teams.</h2>
          <p className="mt-4 text-base leading-7 text-[var(--psm-muted)]">Enthovion uses careful, human-centered language and workflow design. AI supports review, drafting, search, and structured analysis. It does not replace engineering or legal compliance judgement.</p>
        </div>
        <div className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-bg)] p-6">
          <BrainCircuit size={28} className="text-blue-500" />
          <div className="mt-5 grid gap-3">
            {aiFeatures.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-[var(--psm-surface)] p-3 text-sm font-semibold">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" /> {item}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-600 dark:text-amber-300">Human review required for safety-critical and compliance decisions.</div>
        </div>
      </div>
    </section>
  );
}
