'use client';

import React from 'react';
import {
  FileCheck2,
  Sliders,
  History,
  ShieldCheck,
  CheckCircle2,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import {
  useExecutiveTrendMethodology,
  useExecutiveTrendSettings,
} from '../hooks/useExecutiveTrends';

export function ExecutiveTrendMethodologyPage() {
  const query = useExecutiveTrendMethodology();
  const versions = query.data?.versions ?? [
    {
      version_code: '2026.1-Phase7',
      version_title: 'Phase 7 Auditable Trend & Repeat Issue Standard',
      is_active: true,
      published_at: '2026-10-16',
      methodology_notes: 'Enforces linear regression slope calculation, 3-period worsening validation, fair denominator normalization per operating hours, and Levenshtein/Jaccard composite similarity matching for repeat issues.',
    },
  ];

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="PSM Trend Methodology & Audit Versions"
        subtitle="Transparent, deterministic statistical formulas and versioned criteria used for executive analytics."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      <section className="space-y-4">
        {versions.map((ver, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="text-[var(--psm-primary)]" size={18} />
                <h3 className="text-sm font-bold text-[var(--psm-text)]">{ver.version_title}</h3>
                <span className="font-mono text-xs font-semibold text-[var(--psm-primary)]">
                  {ver.version_code}
                </span>
              </div>
              {ver.is_active && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500">
                  Active Standard
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-[var(--psm-text)] leading-relaxed">
              {ver.methodology_notes}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <span className="font-bold text-[var(--psm-text)]">Directionality Rules:</span>
                <p className="mt-1 text-[var(--psm-muted)]">
                  Slope &gt; +0.05 is improving for positive metrics (Health Index, Readiness). Increasing values in risk, overdue, and escalations indicate degradation.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <span className="font-bold text-[var(--psm-text)]">Data Quality Guard:</span>
                <p className="mt-1 text-[var(--psm-muted)]">
                  Zero synthetic interpolation. If an observation is missing from source modules, the point is recorded as "Missing/Insufficient History".
                </p>
              </div>
              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <span className="font-bold text-[var(--psm-text)]">Fair Denominators:</span>
                <p className="mt-1 text-[var(--psm-muted)]">
                  Cross-site comparisons must normalize by active equipment count or operating hours. Disparate units are flagged as "Non-Comparable".
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export function ExecutiveTrendSettingsPage() {
  const query = useExecutiveTrendSettings();

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Trend Intelligence & Detection Settings"
        subtitle="Global parameters governing repeat issue detection thresholds, cooldown intervals, and calculation schedules."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm max-w-2xl">
        <h3 className="text-sm font-bold text-[var(--psm-text)] border-b border-[var(--psm-line)] pb-3">
          Governance Configuration
        </h3>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[var(--psm-text)]">Repeat Weakness Detection Sensitivity</label>
            <p className="text-[var(--psm-muted)]">Minimum similarity match score required to flag candidate repeat occurrences.</p>
            <div className="mt-1.5 flex items-center gap-3">
              <input type="range" min="50" max="95" defaultValue="70" className="w-48" />
              <span className="font-bold text-[var(--psm-primary)]">70% (Standard)</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[var(--psm-text)]">Consecutive Period Degradation Trigger</label>
            <p className="text-[var(--psm-muted)]">Number of consecutive worsening periods before an executive alert is generated.</p>
            <input
              type="number"
              defaultValue="2"
              className="mt-1 block w-24 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs text-[var(--psm-text)]"
            />
          </div>

          <div>
            <label className="font-semibold text-[var(--psm-text)]">Executive Alert Cooldown</label>
            <p className="text-[var(--psm-muted)]">Days to suppress repeated alert notifications after acknowledgment.</p>
            <input
              type="number"
              defaultValue="7"
              className="mt-1 block w-24 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs text-[var(--psm-text)]"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
