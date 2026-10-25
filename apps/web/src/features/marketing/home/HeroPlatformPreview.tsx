'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  FileCheck2,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  HardHat,
  Layers,
  Lock,
  Radio,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Maximize2
} from 'lucide-react';

type TabKey = 'overview' | 'moc' | 'hazop' | 'ptw';

export function HeroPlatformPreview() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl transition-all duration-300">
      {/* Top Application Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)]/90 px-4 py-2.5 sm:px-5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Pulsing Live Operational Beacon */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>LIVE TELEMETRY</span>
          </div>

          <span className="text-xs text-[var(--psm-line)]">|</span>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--psm-text)]">
            <Radio size={13} className="text-[var(--psm-primary)] animate-pulse" />
            <span className="hidden sm:inline">Gulf Coast Olefins Complex</span>
            <span className="sm:hidden">Gulf Coast</span>
            <span className="rounded-md bg-[var(--psm-surface)] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[var(--psm-muted)] border border-[var(--psm-line)]">
              Plant #03
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg bg-[var(--psm-surface)] px-2.5 py-1 text-[11px] font-mono text-[var(--psm-text)] border border-[var(--psm-line)] md:flex shadow-xs">
            <Clock size={12} className="text-emerald-500" />
            <span className="font-bold">1,428 SAFE DAYS</span>
          </div>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase text-blue-500">
            DEFCON: NORMAL
          </span>
        </div>
      </div>

      {/* Module Navigation Tabs with sleek indicator */}
      <div className="flex items-center border-b border-[var(--psm-line)] bg-[var(--psm-surface)] px-2 overflow-x-auto custom-scrollbar">
        {[
          { key: 'overview', label: 'Command Overview', icon: Gauge, badge: 'Active' },
          { key: 'moc', label: 'MOC & PSSR Gateway', icon: GitBranch, badge: '2 In Review' },
          { key: 'hazop', label: 'HAZOP / LOPA Studio', icon: ShieldAlert, badge: 'SIL 2' },
          { key: 'ptw', label: 'PTW / Control of Work', icon: HardHat, badge: '14 Active' }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-xs font-bold transition-all ${
                isActive
                  ? 'border-[var(--psm-primary)] text-[var(--psm-primary)] bg-[var(--psm-surface-2)]/60'
                  : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]/40'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-[var(--psm-primary)]' : 'text-[var(--psm-muted)]'} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                  isActive
                    ? 'bg-[var(--psm-primary)] text-white shadow-xs'
                    : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border border-[var(--psm-line)]'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Content View */}
      <div className="p-4 sm:p-6 bg-[var(--psm-bg)]/40 min-h-[390px]">
        {activeTab === 'overview' && <OverviewTabContent />}
        {activeTab === 'moc' && <MocTabContent />}
        {activeTab === 'hazop' && <HazopTabContent />}
        {activeTab === 'ptw' && <PtwTabContent />}
      </div>

      {/* High-Tech Animated Telemetry Footer Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--psm-line)] bg-[var(--psm-surface-2)]/90 px-4 py-2.5 text-xs text-[var(--psm-muted)]">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[var(--psm-primary)] animate-pulse" />
          <span className="font-bold text-[var(--psm-text)]">Continuous Barrier Health:</span>
          <span>149 of 149 Instrumented Safeguards Verified • Scan Interval: 10s</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-[var(--psm-text)]">Audit Cryptograph: #TX-98421-E</span>
        </div>
      </div>
    </div>
  );
}

function OverviewTabContent() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'PSM Health Index', val: '96.8%', sub: '+2.4% vs last month', color: 'text-emerald-500', barColor: 'bg-emerald-500', pct: 96, icon: Activity },
          { label: 'Safeguard Integrity', val: '99.2%', sub: '148/149 IPLs Active', color: 'text-blue-500', barColor: 'bg-blue-500', pct: 99, icon: ShieldCheck },
          { label: 'Open MOCs', val: '6', sub: '0 overdue • 2 in PSSR', color: 'text-[var(--psm-primary)]', barColor: 'bg-[var(--psm-primary)]', pct: 75, icon: GitBranch },
          { label: 'Active Field Permits', val: '14', sub: '3 Hot • 8 Cold • 3 CSE', color: 'text-amber-500', barColor: 'bg-amber-500', pct: 60, icon: HardHat }
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 shadow-xs transition hover:border-[var(--psm-primary)]/50"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <span>{kpi.label}</span>
              <kpi.icon size={15} className={kpi.color} />
            </div>
            <div className={`mt-2 text-2xl font-black ${kpi.color}`}>{kpi.val}</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--psm-surface-2)] overflow-hidden">
              <div
                className={`h-full rounded-full ${kpi.barColor} transition-all duration-1000`}
                style={{ width: `${kpi.pct}%` }}
              />
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-[var(--psm-muted)]">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: 5x5 Hazard Matrix & Live Feeds */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: 5x5 Hazard Matrix */}
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--psm-text)]">
                Dynamic 5x5 Hazard Risk Matrix
              </h4>
              <p className="text-[11px] text-[var(--psm-muted)]">
                Live operational risk profile mapped across unit deviations
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ALARP Verified
            </span>
          </div>

          {/* 5x5 Matrix Representation */}
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-black">
            {/* Row 5 - Catastrophic */}
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:scale-105 transition cursor-pointer">L5 (0)</div>
            <div className="rounded-lg bg-orange-500/30 p-2 text-orange-600 dark:text-orange-300 border border-orange-500/40 hover:scale-105 transition cursor-pointer">H5 (0)</div>
            <div className="rounded-lg bg-red-500/30 p-2 text-red-600 dark:text-red-300 border border-red-500/40 hover:scale-105 transition cursor-pointer">VH (0)</div>
            <div className="rounded-lg bg-red-600/40 p-2 text-red-100 border border-red-600/60 font-black hover:scale-105 transition cursor-pointer">EXT (0)</div>
            <div className="rounded-lg bg-red-800/50 p-2 text-red-100 border border-red-700 font-black hover:scale-105 transition cursor-pointer">EXT (0)</div>

            {/* Row 4 - Major */}
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">M4 (2)</div>
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:scale-105 transition cursor-pointer">M4 (1)</div>
            <div className="rounded-lg bg-orange-500/30 p-2 text-orange-600 dark:text-orange-300 border border-orange-500/40 hover:scale-105 transition cursor-pointer">H4 (0)</div>
            <div className="rounded-lg bg-red-500/30 p-2 text-red-600 dark:text-red-300 border border-red-500/40 hover:scale-105 transition cursor-pointer">VH (0)</div>
            <div className="rounded-lg bg-red-600/40 p-2 text-red-100 border border-red-600/60 font-black hover:scale-105 transition cursor-pointer">EXT (0)</div>

            {/* Row 3 - Moderate */}
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">L3 (8)</div>
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">M3 (4)</div>
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:scale-105 transition cursor-pointer">M3 (1)</div>
            <div className="rounded-lg bg-orange-500/30 p-2 text-orange-600 dark:text-orange-300 border border-orange-500/40 hover:scale-105 transition cursor-pointer">H3 (0)</div>
            <div className="rounded-lg bg-red-500/30 p-2 text-red-600 dark:text-red-300 border border-red-500/40 hover:scale-105 transition cursor-pointer">VH (0)</div>

            {/* Row 2 - Minor */}
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">L2 (19)</div>
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">L2 (12)</div>
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">M2 (3)</div>
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:scale-105 transition cursor-pointer">M2 (0)</div>
            <div className="rounded-lg bg-orange-500/30 p-2 text-orange-600 dark:text-orange-300 border border-orange-500/40 hover:scale-105 transition cursor-pointer">H2 (0)</div>

            {/* Row 1 - Negligible */}
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">L1 (42)</div>
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">L1 (27)</div>
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">L1 (8)</div>
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:scale-105 transition cursor-pointer">L1 (1)</div>
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:scale-105 transition cursor-pointer">M1 (0)</div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-[var(--psm-muted)]">
            <span>Consequence Severity ▲</span>
            <span>Likelihood Frequency ▶</span>
          </div>
        </div>

        {/* Right: Live Safety Audit & Barrier Activity */}
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-xs lg:col-span-5">
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--psm-text)] mb-3">
            Live Safety Event & Audit Stream
          </h4>
          <div className="space-y-2.5 text-xs">
            {[
              {
                time: '10:42 AM',
                title: 'MOC-2026-088 PSSR Stage 3 Verified',
                desc: 'Operations & Process Safety sign-offs recorded',
                tag: 'MOC / PSSR',
                color: 'text-emerald-500'
              },
              {
                time: '09:15 AM',
                title: 'PTW-4921 Hot Work Gas Test Passed',
                desc: 'LEL: 0.0%, O2: 20.9%, H2S: 0 ppm (Safe to work)',
                tag: 'PTW',
                color: 'text-blue-500'
              },
              {
                time: '08:30 AM',
                title: 'SIS-042 Proof-Test Calibration Uploaded',
                desc: 'Pressure switch response time: 820ms (Target < 1.5s)',
                tag: 'Mechanical Integrity',
                color: 'text-[var(--psm-primary)]'
              }
            ].map((ev, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/50 p-2.5 transition hover:border-[var(--psm-primary)]/50"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-[var(--psm-text)]">{ev.title}</span>
                  <span className="font-mono text-[var(--psm-muted)]">{ev.time}</span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--psm-muted)]">{ev.desc}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--psm-primary)]">{ev.tag}</span>
                  <CheckCircle2 size={13} className={ev.color} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MocTabContent() {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-300">
      {/* MOC Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--psm-line)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-[var(--psm-primary)]">MOC-2026-088</span>
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/20">
              Technical Change (Facility)
            </span>
          </div>
          <h3 className="mt-1 text-sm sm:text-base font-black text-[var(--psm-text)]">
            Crude Distillation Column Reflux Pump P-102B Impeller Metallurgy Upgrade
          </h3>
          <p className="text-xs text-[var(--psm-muted)]">
            Initiated by J. Martinez (Sr. Reliability Engineer) • Site: Texas Complex • Unit: Crude Distillation
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} /> Stage: PSSR Authorization
          </span>
        </div>
      </div>

      {/* 5-Stage Visual Workflow Stepper */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-center text-xs font-bold">
        {[
          { num: '1', title: 'Initiation', status: 'Approved', done: true },
          { num: '2', title: 'Risk Screening', status: 'Completed', done: true },
          { num: '3', title: 'PHA / LOPA', status: 'Verified', done: true },
          { num: '4', title: 'PSSR Readiness', status: 'In Progress', active: true },
          { num: '5', title: 'Final Authorization', status: 'Pending', done: false }
        ].map((step) => (
          <div
            key={step.num}
            className={`rounded-xl border p-2.5 transition ${
              step.active
                ? 'border-[var(--psm-primary)] bg-[var(--psm-primary)]/10 text-[var(--psm-text)] ring-1 ring-[var(--psm-primary)]/40'
                : step.done
                ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--psm-text)]'
                : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[11px]">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-black ${
                  step.active
                    ? 'bg-[var(--psm-primary)] text-white shadow-xs'
                    : step.done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[var(--psm-surface)] text-[var(--psm-muted)]'
                }`}
              >
                {step.num}
              </span>
              <span>{step.title}</span>
            </div>
            <div className="mt-1 text-[10px] text-[var(--psm-muted)]">{step.status}</div>
          </div>
        ))}
      </div>

      {/* PSSR Verification Checklist Items */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/60 p-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--psm-text)] mb-3 flex items-center justify-between">
          <span>Mandatory PSSR Verification Gates</span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">4 of 5 Gates Approved</span>
        </h4>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          {[
            { label: 'Mechanical & Hydrostatic Pressure Test Certificate', status: 'Verified by Lead Inspector', pass: true },
            { label: 'Hazardous Area Classification & Electrical Sealoffs', status: 'Verified by Electrical Lead', pass: true },
            { label: 'DCS Interlock & High Discharge Pressure Alarms Tested', status: 'Verified by I&C Engineer', pass: true },
            { label: 'Operating Procedures & Training Sign-off Complete', status: 'Verified by Training Lead', pass: true },
            { label: 'Pre-Commissioning Multi-Discipline Field Walkdown', status: 'Scheduled for Today 14:00', pass: false }
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2.5 shadow-2xs"
            >
              <CheckCircle2
                size={16}
                className={item.pass ? 'mt-0.5 text-emerald-500 shrink-0' : 'mt-0.5 text-amber-500 shrink-0'}
              />
              <div className="min-w-0">
                <div className="font-bold text-[var(--psm-text)] leading-snug">{item.label}</div>
                <div className="text-[11px] text-[var(--psm-muted)]">{item.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HazopTabContent() {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--psm-line)]">
        <div>
          <span className="font-mono text-xs font-black text-blue-500">HAZOP / LOPA STUDY #HZ-2026-14</span>
          <h3 className="mt-1 text-sm sm:text-base font-black text-[var(--psm-text)]">
            Node 03: High Pressure Hydrocarbon Separator (V-103) Inlet Piping
          </h3>
          <p className="text-xs text-[var(--psm-muted)]">
            Design Conditions: 45 barg @ 180°C • Deviation: Pressure More Than Design (High Pressure)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[var(--psm-primary)]/15 border border-[var(--psm-primary)]/30 px-3 py-1 text-xs font-black text-[var(--psm-primary)]">
            Target SIL 2 Required
          </span>
          <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
            Achieved: SIL 2 (RRF 240)
          </span>
        </div>
      </div>

      {/* Cause, Consequence & Safeguards Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-[var(--psm-line)] rounded-xl overflow-hidden">
          <thead className="bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="p-3 border-b border-[var(--psm-line)]">Hazard Deviation</th>
              <th className="p-3 border-b border-[var(--psm-line)]">Root Cause</th>
              <th className="p-3 border-b border-[var(--psm-line)]">Unmitigated Consequence</th>
              <th className="p-3 border-b border-[var(--psm-line)]">Validated Safeguards / IPLs</th>
              <th className="p-3 border-b border-[var(--psm-line)]">Residual Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)] text-[var(--psm-text)]">
            <tr>
              <td className="p-3 font-bold text-red-500">More Pressure (Overpressure)</td>
              <td className="p-3 text-[var(--psm-muted)]">
                Downstream flare isolation valve inadvertently closed during maintenance
              </td>
              <td className="p-3 text-[var(--psm-muted)]">
                Vessel overpressure exceeding test pressure (70 barg). Potential LOPC & flammable vapor cloud.
              </td>
              <td className="p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} /> IPL-1: Instrumented High Pressure Trip (PT-1032 / XV-1001)
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-blue-500">
                    <CheckCircle2 size={13} /> IPL-2: Dual Certified Relief Valves (PSV-103A/B)
                  </div>
                </div>
              </td>
              <td className="p-3">
                <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ALARP (Low)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 font-medium">
          <Sparkles size={15} />
          <span>AI Copilot Analysis: All IPL safeguards cross-referenced with IEC 61511 PFD limits.</span>
        </div>
        <span className="font-mono text-[10px] font-bold text-blue-500">PFD_avg = 4.16E-03</span>
      </div>
    </div>
  );
}

function PtwTabContent() {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--psm-line)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-amber-500">PERMIT #PTW-2026-771</span>
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-500 border border-red-500/20 uppercase flex items-center gap-1">
              <Flame size={11} /> Hot Work (Class 1)
            </span>
          </div>
          <h3 className="mt-1 text-sm sm:text-base font-black text-[var(--psm-text)]">
            Pipe Spool Cutting & Welding at Unit 02 Flare Knockout Drum (V-201)
          </h3>
          <p className="text-xs text-[var(--psm-muted)]">
            Performing Contractor: Apex Piping Services • Authorized Isolator: R. Davis (Operations)
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} /> Active & Field Authorized
          </span>
        </div>
      </div>

      {/* Gas Telemetry Grid */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--psm-text)] mb-2 flex items-center gap-1.5">
          <Radio size={13} className="text-emerald-500 animate-pulse" />
          <span>Continuous Gas Detection Readings (Calibrated Sensor #G-441)</span>
        </h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { gas: 'LEL (Combustibles)', val: '0.0%', status: 'SAFE (< 1%)', pass: true },
            { gas: 'Oxygen (O2)', val: '20.9%', status: 'NORMAL (19.5 - 23.5%)', pass: true },
            { gas: 'Hydrogen Sulfide (H2S)', val: '0.0 ppm', status: 'SAFE (< 5 ppm)', pass: true },
            { gas: 'Carbon Monoxide (CO)', val: '0.0 ppm', status: 'SAFE (< 25 ppm)', pass: true }
          ].map((item) => (
            <div
              key={item.gas}
              className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-center shadow-2xs"
            >
              <div className="text-[10px] font-bold text-[var(--psm-muted)]">{item.gas}</div>
              <div className="my-1 font-mono text-xl font-black text-emerald-500">{item.val}</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{item.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LOTO and SIMOPS Conflict Check */}
      <div className="grid gap-3 sm:grid-cols-2 text-xs">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/60 p-3">
          <div className="flex items-center gap-2 font-bold text-[var(--psm-text)]">
            <Lock size={14} className="text-amber-500" />
            <span>Lockout / Tagout (LOTO) Energy Isolation</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">
            Double Block & Bleed applied on lines FL-201A & FL-201B. Padlock Box #L-8821 verified zero pressure.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/60 p-3">
          <div className="flex items-center gap-2 font-bold text-[var(--psm-text)]">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Spatial SIMOPS Conflict Check</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">
            Zero overlapping concurrent tasks detected within 50m radius. Safe separation confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
