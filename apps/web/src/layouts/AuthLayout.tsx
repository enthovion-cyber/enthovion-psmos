import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { AuthThemeToggle } from '@/features/auth/components/AuthThemeToggle';
import { BarChart3, Leaf, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-[var(--psm-text)] transition-colors duration-300 dark:bg-[#061329]">
      <div className="fixed right-4 top-4 z-20 sm:right-6 sm:top-6"><AuthThemeToggle /></div>
      <div className="grid min-h-screen w-full overflow-hidden lg:grid-cols-[1.04fr_.96fr]">
        <section className="relative hidden min-h-screen overflow-hidden bg-[var(--brand-navy)] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[url('/auth/refinery-login-panel.png')] bg-cover bg-center opacity-80" />
          <div className="absolute inset-0 bg-[rgba(6,42,82,.72)]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[18px] border-[var(--psm-primary)] opacity-90" />
          <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full border-[16px] border-[var(--psm-primary)] opacity-85" />
          <div className="relative z-10 p-10 text-white"><AuthBrand onDark /></div>
          <div className="relative z-10 max-w-md p-10 pt-0">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-orange-200">Process safety management</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">Safer operations. Stronger tomorrow.</h1>
            <p className="mt-4 text-base leading-7 text-slate-200">A controlled workspace for process safety studies, actions, evidence, assurance, and operational readiness.</p>
          </div>
          <div className="relative z-10 m-10 grid grid-cols-3 gap-2 rounded-xl border border-white/30 bg-slate-950/35 p-4 text-white backdrop-blur-sm">
            <Value icon={ShieldCheck} label="People" value="Safe" />
            <Value icon={Leaf} label="Assets" value="Protected" />
            <Value icon={BarChart3} label="Performance" value="Sustainable" />
          </div>
        </section>
        <section className="flex min-h-screen items-center justify-center bg-white px-5 py-16 transition-colors duration-300 dark:bg-[#0b1730] sm:px-8 lg:px-12">{children}</section>
      </div>
    </main>
  );
}

function Value({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="min-w-0"><Icon size={18} className="mb-2 text-[var(--psm-primary)]" /><div className="text-xs font-semibold">{label}</div><div className="text-[11px] text-slate-300">{value}</div></div>;
}
