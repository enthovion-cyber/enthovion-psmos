import Link from 'next/link';
import { ArrowRight, CheckCircle2, Network, ShieldCheck } from 'lucide-react';
import { StartTrialButton } from '../cta/StartTrialButton';
import { ContactSalesButton } from '../cta/ContactSalesButton';
import { visualSignals } from './marketing-content';

export function HeroSection() {
  return (
    <section id="overview" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(20,184,166,.18),transparent_30%),linear-gradient(180deg,var(--psm-surface),var(--psm-bg))]" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
            <ShieldCheck size={14} /> AI-powered Process Safety Management Operating System
          </div>
          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-[var(--psm-text)] sm:text-6xl lg:text-7xl">
            One operating system for Process Safety Management.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--psm-muted)]">
            Enthovion PSM OS helps industrial teams manage MOC, PSSR, HAZOP/PHA, LOPA/SIL, incidents, actions, documents, and audit-ready workflows in one secure workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <StartTrialButton />
            <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-4 text-sm font-bold hover:bg-[var(--psm-surface-2)]">View pricing</Link>
            <ContactSalesButton />
          </div>
          <div className="mt-7 grid gap-2 text-sm text-[var(--psm-muted)] sm:grid-cols-2">
            {['No credit card required for trial', 'Built for multi-site industrial teams', 'Company/site data isolation', 'Audit-ready workflows'].map((item) => (
              <div key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> {item}</div>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-full rounded-2xl border border-[var(--psm-line)] bg-[color-mix(in_srgb,var(--psm-surface)_82%,transparent)] p-4 shadow-2xl backdrop-blur">
            <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[.18em] text-[var(--psm-muted)]">Marketing dashboard preview</div>
                  <div className="mt-1 text-xl font-black">PSM Command Workspace</div>
                </div>
                <Network className="text-blue-500" size={26} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {visualSignals.map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
                    <item.icon size={18} className="text-blue-500" />
                    <div className="mt-3 text-xs font-bold uppercase text-[var(--psm-muted)]">{item.label}</div>
                    <div className="text-sm font-black">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
                <div className="text-sm font-black">Company - Site - Module hierarchy</div>
                <div className="mt-3 grid gap-2 text-xs text-[var(--psm-muted)]">
                  {['Company workspace', 'Site / plant scope', 'Process unit / area', 'MOC, PSSR, HAZOP, LOPA, Incident workflows', 'Action, evidence, approval, report'].map((step, index) => (
                    <div key={step} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-black text-white">{index + 1}</span>{step}</div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--psm-muted)]">Illustrative product visual. Operational values are not customer data.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
