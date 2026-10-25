'use client';

import { Flame, Factory, Fuel, Zap, Shield, Atom, Activity, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

export function TrustBar() {
  const sectors = [
    { label: 'Petrochemical Refineries', icon: Flame },
    { label: 'Specialty Chemical Plants', icon: Factory },
    { label: 'Offshore & Midstream Oil & Gas', icon: Fuel },
    { label: 'Fertilizer & Ammonia Complexes', icon: Atom },
    { label: 'Clean Hydrogen & LNG Terminals', icon: Shield },
    { label: 'Power Generation & Utilities', icon: Zap }
  ];

  const metrics = [
    { label: 'Safety Availability', val: '99.98%', sub: 'Zero System Downtime' },
    { label: 'Active Barriers Tracked', val: '14,800+', sub: 'Across Operating Fleets' },
    { label: 'Audit Trail Integrity', val: '100%', sub: 'Cryptographically Immutable' },
    { label: 'Regulatory Standards', val: '14 PSM', sub: 'OSHA • CCPS • IEC 61511' }
  ];

  return (
    <section className="relative border-y border-black/[0.06] dark:border-white/[0.06] bg-[var(--psm-surface)]/70 backdrop-blur-md px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="mx-auto max-w-7xl">
        {/* Top Operational Metrics Ticker */}
        <div className="grid grid-cols-2 gap-4 pb-8 border-b border-black/[0.06] dark:border-white/[0.06] sm:grid-cols-4 text-center">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--psm-text)]">
                {m.val}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--psm-primary)]">
                {m.label}
              </div>
              <div className="text-[11px] text-[var(--psm-muted)] font-medium">
                {m.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Industry Sectors Strip */}
        <div className="pt-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--psm-muted)] mb-5">
            Engineered For Mission-Critical Industrial Operational Facilities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3.5">
            {sectors.map((sector) => (
              <div
                key={sector.label}
                className="group flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--psm-muted)] transition hover:text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]/60 cursor-default"
              >
                <sector.icon size={15} className="text-[var(--psm-primary)] transition-transform group-hover:scale-110" />
                <span>{sector.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
