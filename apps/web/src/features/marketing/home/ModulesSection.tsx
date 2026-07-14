import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { modules } from './marketing-content';

export function ModulesSection() {
  return (
    <section id="modules" className="bg-[var(--psm-surface)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[.18em] text-emerald-500">Core PSM Modules</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-normal">The records that control process safety risk, connected.</h2>
          </div>
          <Link href="/features" className="inline-flex h-11 w-fit items-center gap-2 rounded-lg border border-[var(--psm-line)] px-4 text-sm font-bold hover:bg-[var(--psm-surface-2)]">Explore features <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link id={module.href.split('#')[1]} key={module.title} href={module.href} className="group rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-bg)] p-5 transition hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-[var(--psm-shadow)]">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/10 text-blue-500"><module.icon size={22} /></span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-black text-emerald-500">{module.status}</span>
              </div>
              <h3 className="mt-5 text-xl font-black">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--psm-muted)]">{module.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-500">Learn more <ArrowRight size={15} className="transition group-hover:translate-x-1" /></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
