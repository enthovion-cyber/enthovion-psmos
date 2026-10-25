'use client';

import React from 'react';
import { Users, UserCheck, UserX, Clock, CheckCircle } from 'lucide-react';

interface Props {
  totalExpected?: number;
  presentCount?: number;
  absentCount?: number;
  apologyCount?: number;
  quorumSatisfied?: boolean;
}

export function ManagementReviewMeetingAttendanceChart({
  totalExpected = 0,
  presentCount = 0,
  absentCount = 0,
  apologyCount = 0,
  quorumSatisfied = true,
}: Props) {
  const recorded = presentCount + absentCount + apologyCount;
  const unrecorded = Math.max(0, totalExpected - recorded);
  const attendanceRate = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 100;

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-blue-500/10 p-1.5 text-blue-500">
            <Users size={16} />
          </span>
          <h3 className="text-base font-bold text-[var(--psm-text)]">
            Leadership Attendance &amp; Quorum
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            quorumSatisfied
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
          }`}
        >
          {quorumSatisfied ? 'Quorum Satisfied' : 'Quorum Not Met'}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 items-center">
        {/* Left: Overall Attendance Circle */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-24 w-24 items-center justify-center shrink-0">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-[var(--psm-surface-2)]"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={quorumSatisfied ? '#10b981' : '#f59e0b'}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - attendanceRate / 100)}`}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-[var(--psm-text)]">{attendanceRate}%</span>
              <span className="text-[8px] font-semibold uppercase text-[var(--psm-muted)]">Attendance</span>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="font-semibold text-[var(--psm-text)]">
              {presentCount} of {totalExpected || recorded || 1} Present
            </div>
            <p className="text-[11px] text-[var(--psm-muted)]">
              Requires chairperson, site PSM lead, and key operations heads.
            </p>
          </div>
        </div>

        {/* Right: Participant breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs border-t border-[var(--psm-line)] pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
          <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5">
            <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <UserCheck size={14} /> Present
            </div>
            <div className="mt-1 text-lg font-bold text-[var(--psm-text)]">{presentCount}</div>
          </div>

          <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5">
            <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
              <Clock size={14} /> Apology
            </div>
            <div className="mt-1 text-lg font-bold text-[var(--psm-text)]">{apologyCount}</div>
          </div>

          <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5">
            <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
              <UserX size={14} /> Absent
            </div>
            <div className="mt-1 text-lg font-bold text-[var(--psm-text)]">{absentCount}</div>
          </div>

          <div className="rounded-lg bg-[var(--psm-surface-2)] p-2.5">
            <div className="flex items-center gap-1.5 text-[var(--psm-muted)] font-semibold">
              <Users size={14} /> Unrecorded
            </div>
            <div className="mt-1 text-lg font-bold text-[var(--psm-text)]">{unrecorded}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
