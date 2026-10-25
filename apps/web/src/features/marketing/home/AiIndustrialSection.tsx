'use client';

import { BrainCircuit, CheckCircle2, ShieldCheck, Sparkles, UserCheck, AlertOctagon, Terminal } from 'lucide-react';
import { aiFeatures } from './marketing-content';

export function AiIndustrialSection() {
  return (
    <section id="ai" className="relative bg-[var(--psm-surface)]/70 backdrop-blur-md px-4 py-20 sm:px-6 lg:px-8 border-y border-black/[0.06] dark:border-white/[0.06] transition-colors">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 items-center">
        {/* Left Column: AI Narrative & Safety Mandate */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Sparkles size={13} />
            <span>Industrial Safety Intelligence</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--psm-text)] leading-[1.14]">
            AI-Assisted Decision Support for{' '}
            <span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">
              Qualified Engineers.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--psm-muted)] font-normal">
            Enthovion applies intelligent automation with rigorous industrial safety guardrails. AI accelerates documentation, chemical hazard screening, and deviation brainstorming—while strictly enforcing mandatory human engineering discretion.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-800 dark:text-amber-200 flex items-start gap-3 shadow-xs">
            <AlertOctagon size={18} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-bold">Human-in-the-Loop Safety Mandate:</span> AI recommendations are strictly advisory decision-support signals. Final study sign-offs, MOC approvals, and permit authorizations mandate qualified human e-signatures.
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity Safety Copilot Terminal Card */}
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-[var(--psm-bg)]/90 p-6 shadow-xl lg:col-span-7">
          {/* Terminal Titlebar */}
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--psm-text)]">Enthovion Safety Copilot Studio</h3>
                <p className="text-[11px] text-[var(--psm-muted)] font-medium">Trained on OSHA 1910.119, CCPS RBPS, and IEC 61511 guidelines</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Live Copilot
            </span>
          </div>

          {/* Simulated Safety Analysis Prompt & Response */}
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-[var(--psm-surface)] p-3.5 mb-4 text-xs font-mono">
            <div className="text-[var(--psm-muted)] flex items-center gap-1.5 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
              <Terminal size={12} className="text-sky-500" />
              <span>Safety Query: &quot;Evaluate benzene reflux pump P-102B seal failure deviation&quot;</span>
            </div>
            <div className="mt-2 text-[var(--psm-text)] text-[11px] leading-relaxed">
              <span className="text-emerald-500 font-bold">Analysis:</span> Cross-referenced with SDS #B-401 &amp; Node 02 HAZOP. Identified 2 required safeguards (IPL-1: High Vibration Switch, IPL-2: Pressurized Dual Barrier Seal). <span className="text-[var(--psm-primary)] font-bold">Recommended: Trigger MOC-Class 2 with PSSR walk-down.</span>
            </div>
          </div>

          {/* AI Features Checklist */}
          <div className="grid gap-2.5">
            {aiFeatures.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-[var(--psm-surface)] p-3 text-xs font-medium text-[var(--psm-text)] shadow-2xs"
              >
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Footer of the card */}
          <div className="mt-5 flex items-center justify-between text-xs text-[var(--psm-muted)] border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
            <span className="flex items-center gap-1.5 font-bold text-[var(--psm-text)]">
              <UserCheck size={14} className="text-emerald-500" /> Human Sign-off Audit Tracked
            </span>
            <span className="font-mono text-[11px]">SOC 2 &amp; ISO 27001 AI Safeguards</span>
          </div>
        </div>
      </div>
    </section>
  );
}
