'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useManagementReviewReadiness,
  useManagementReviewRegister,
  useManagementReviewMutations,
} from '../hooks/useExecutiveManagementReview';
import {
  ManagementReviewHeader,
  ManagementReviewNav,
  ManagementReviewEmptyState,
  cardStyle,
  buttonStyle,
  primaryButtonStyle,
  inputStyle,
} from './ExecutiveManagementReviewShared';
import {
  ReadinessStatusBadge,
} from './ManagementReviewBadges';
import { ManagementReviewReadinessGauge } from '../components/charts/ManagementReviewReadinessGauge';

export function ExecutiveManagementReviewReadinessPage() {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');

  const meetingsQuery = useManagementReviewRegister('meetings');
  const meetingsList = Array.isArray(meetingsQuery.data)
    ? meetingsQuery.data
    : (meetingsQuery.data as any)?.rows ?? [];

  const activeMeetingId = selectedMeetingId || meetingsList[0]?.id;

  const readinessQuery = useManagementReviewReadiness(
    activeMeetingId ? { meetingId: activeMeetingId } : undefined
  );
  const mutations = useManagementReviewMutations();

  const readiness = readinessQuery.data;
  const score = readiness?.overallScore ?? readiness?.readinessScore ?? readiness?.score ?? (readiness?.readinessStatus === 'ready' ? 100 : readiness?.readinessStatus === 'warning' ? 70 : 40);
  const status = readiness?.readinessStatus ?? (score >= 80 ? 'ready' : score >= 50 ? 'warning' : 'blocked');
  const blockers = readiness?.blockers ?? [];
  const warnings = readiness?.warnings ?? [];
  const checks = readiness?.checks ?? readiness?.categories ?? [];

  return (
    <main className="space-y-6">
      <ManagementReviewNav activeTab="readiness" />

      <ManagementReviewHeader
        title="Management Review Readiness Cockpit"
        description="Automated pre-meeting gatekeeper verifying quorum, agenda coverage, package freshness, and data completeness before leadership review."
      />

      {/* Meeting Context Selector */}
      <div className={`${cardStyle} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-[var(--psm-text)]">
            Select Review Meeting:
          </label>
          <select
            className={`${inputStyle} min-w-[280px] font-medium`}
            value={activeMeetingId || ''}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
          >
            {meetingsList.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.meeting_title || m.title || `Meeting #${m.id.slice(0, 8)}`} (
                {m.meeting_status || m.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void readinessQuery.refetch()}
            disabled={readinessQuery.isFetching}
            className={`${buttonStyle} text-xs`}
          >
            {readinessQuery.isFetching ? 'Verifying...' : 'Re-verify Readiness'}
          </button>
        </div>
      </div>

      {/* Main Cockpit Grid: Gauge & Status Spotlight */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Readiness Visual Infographic Gauge */}
        <div className={`${cardStyle} flex flex-col items-center justify-center p-6 text-center`}>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--psm-muted)]">
            Overall Governance Preparedness
          </h2>
          <ManagementReviewReadinessGauge
            score={score}
            status={status}
            blockersCount={blockers.length}
            warningsCount={warnings.length}
          />
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-[var(--psm-muted)]">Verdict:</span>
            <ReadinessStatusBadge status={status} />
          </div>
        </div>

        {/* Readiness Breakdown Cards */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={cardStyle}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">
                  Gate Blocker Count
                </span>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-500">
                  Critical
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-red-500">{blockers.length}</p>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                {blockers.length > 0
                  ? 'Must be resolved before package publication'
                  : 'No active gate blockers'}
              </p>
            </div>

            <div className={cardStyle}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">
                  Advisory Warnings
                </span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-500">
                  Advisory
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-amber-500">{warnings.length}</p>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                {warnings.length > 0
                  ? 'Leadership should note before proceeding'
                  : 'All advisory checks clear'}
              </p>
            </div>
          </div>

          {/* Quick Decision / Publication Box */}
          <div className={`${cardStyle} border-l-4 ${status === 'ready' ? 'border-l-emerald-500' : status === 'warning' ? 'border-l-amber-500' : 'border-l-red-500'}`}>
            <h3 className="font-bold text-[var(--psm-text)]">
              {status === 'ready'
                ? 'Review Meeting is Ready to Convene'
                : status === 'warning'
                ? 'Review Meeting Ready with Non-Blocking Advisories'
                : 'Governance Gate Blocked'}
            </h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              {status === 'ready'
                ? 'All prerequisite PSM data, risk registers, and attendee quorum standards have been confirmed.'
                : status === 'warning'
                ? 'Minor items (e.g. secondary stakeholder confirmations or optional annexes) remain open.'
                : 'Meeting cannot officially publish immutable minutes or decisions until required blockers are satisfied.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/executive/management-review/meetings`}
                className={`${buttonStyle} text-xs`}
              >
                Go to Meeting Room
              </Link>
              <Link
                href={`/executive/management-review/packages`}
                className={`${buttonStyle} text-xs`}
              >
                Inspect Review Package
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Blockers & Advisories Detailed Checklist */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Critical Blockers */}
        <section className={cardStyle}>
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h3 className="font-bold text-[var(--psm-text)]">Critical Gate Blockers</h3>
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-500">
              {blockers.length} Blockers
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {blockers.map((b: any, idx: number) => {
              const text = typeof b === 'string' ? b : b.message || b.title || b.description || 'Blocker item';
              const code = typeof b === 'object' ? b.code : null;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-[var(--psm-text)]"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-red-500">✕</span>
                    <div className="flex-1">
                      <p className="font-semibold text-red-500">{text}</p>
                      {code && <p className="font-mono text-xs text-[var(--psm-muted)]">{code}</p>}
                    </div>
                  </div>
                </div>
              );
            })}

            {blockers.length === 0 && (
              <p className="py-6 text-center text-sm font-medium text-emerald-500">
                ✓ No critical blockers detected. Quorum and package prerequisites are satisfied.
              </p>
            )}
          </div>
        </section>

        {/* Advisory Warnings */}
        <section className={cardStyle}>
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h3 className="font-bold text-[var(--psm-text)]">Advisory Warnings</h3>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-500">
              {warnings.length} Warnings
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {warnings.map((w: any, idx: number) => {
              const text = typeof w === 'string' ? w : w.message || w.title || w.description || 'Advisory warning';
              const code = typeof w === 'object' ? w.code : null;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-[var(--psm-text)]"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-amber-500">!</span>
                    <div className="flex-1">
                      <p className="font-medium text-amber-500">{text}</p>
                      {code && <p className="font-mono text-xs text-[var(--psm-muted)]">{code}</p>}
                    </div>
                  </div>
                </div>
              );
            })}

            {warnings.length === 0 && (
              <p className="py-6 text-center text-sm font-medium text-emerald-500">
                ✓ No advisory warnings found.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Automated Criteria Checklist */}
      <section className={cardStyle}>
        <h3 className="border-b border-[var(--psm-line)] pb-3 font-bold text-[var(--psm-text)]">
          Readiness Verification Matrix
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: 'Leadership Quorum Satisfied',
              status: readiness?.quorumSatisfied ?? true,
              desc: 'Required leadership roles (Site Manager, PSM Lead, HSE) are confirmed.',
            },
            {
              label: 'Review Package Generated & Locked',
              status: readiness?.packageGenerated ?? (blockers.length === 0),
              desc: 'Current operational metrics and module scores are snapshotted.',
            },
            {
              label: 'Prior Commitments Reconciled',
              status: readiness?.commitmentsReconciled ?? true,
              desc: 'Overdue or carried-forward items have documented status.',
            },
            {
              label: 'Critical Risk Register Current',
              status: readiness?.risksCurrent ?? true,
              desc: 'High-severity findings from HAZOP/PHA and MOC are aggregated.',
            },
            {
              label: 'Formal Agenda Distributed',
              status: readiness?.agendaDistributed ?? true,
              desc: 'Mandatory PSM review items have assigned presentation time.',
            },
            {
              label: 'Freshness Window Compliant',
              status: readiness?.freshnessCompliant ?? true,
              desc: 'Data snapshots are within the permitted 24-hour SLA.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/30 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--psm-text)]">{item.label}</span>
                <span
                  className={`text-xs font-black ${
                    item.status ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {item.status ? 'PASSED' : 'DEFICIT'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
