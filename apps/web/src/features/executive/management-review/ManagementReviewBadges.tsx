'use client';

import React from 'react';

export function ManagementReviewCycleStatusBadge({ status }: { status?: string | null }) {
  const s = status || 'Draft';
  const color =
    /completed/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /active|under review|in progress/i.test(s)
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : /awaiting/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /cancelled|archived/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function ManagementReviewMeetingStatusBadge({ status }: { status?: string | null }) {
  const s = status || 'Draft';
  const color =
    /completed/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /in progress/i.test(s)
      ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
      : /scheduled|ready/i.test(s)
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : /preparing|minutes draft|under approval|adjourned/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /cancelled/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function ManagementReviewReadinessBadge({ status }: { status?: string | null }) {
  const s = status || 'Not Checked';
  const color =
    /ready$/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /warning/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /not ready|missing|conflict/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function ManagementReviewPackageStatusBadge({ status }: { status?: string | null }) {
  const s = status || 'Draft';
  const color =
    /published|approved|locked/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /prepared|ready/i.test(s)
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : /pending|collecting/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /stale|superseded|not ready/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function ManagementReviewMinutesStatusBadge({ status }: { status?: string | null }) {
  const s = status || 'Draft';
  const color =
    /approved|locked/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /pending approval|under review/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /returned/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function ExecutiveDecisionStatusBadge({ status }: { status?: string | null }) {
  const s = status || 'Proposed';
  const color =
    /completed|verified|approved/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /active|in progress/i.test(s)
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : /pending/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /withdrawn|superseded|returned/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function ExecutiveCommitmentStatusBadge({ status }: { status?: string | null }) {
  const s = status || 'Draft';
  const color =
    /completed|verified/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /assigned|accepted|in progress/i.test(s)
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : /pending verification|awaiting/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /overdue|cancelled/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function MeetingAttendanceStatusBadge({ status }: { status?: string | null }) {
  const s = status || 'Not Recorded';
  const color =
    /present/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /joined late/i.test(s)
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : /apology/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /absent/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function MeetingQuorumStatusBadge({ satisfied }: { satisfied: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
        satisfied
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      }`}
    >
      {satisfied ? 'Quorum Met' : 'Quorum Not Met'}
    </span>
  );
}

export function ReviewSourceFreshnessBadge({ freshness }: { freshness?: string | null }) {
  const f = freshness || 'Current';
  const color =
    /current|fresh/i.test(f)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /warning|stale/i.test(f)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {f}
    </span>
  );
}

// Aliases for convenient unified import
export {
  ExecutiveCommitmentStatusBadge as CommitmentStatusBadge,
  ManagementReviewMeetingStatusBadge as MeetingStatusBadge,
  MeetingQuorumStatusBadge as QuorumBadge,
  ManagementReviewReadinessBadge as ReadinessStatusBadge,
};

