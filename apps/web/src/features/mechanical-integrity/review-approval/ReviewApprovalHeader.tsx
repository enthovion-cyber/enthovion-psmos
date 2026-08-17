'use client';

import Link from 'next/link';
import { ReviewButton } from './ReviewApprovalPrimitives';

export function ReviewApprovalHeader({ lastUpdated, onRefresh }: { lastUpdated?: string | undefined; onRefresh: () => void }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--psm-muted)]">Mechanical Integrity</p>
          <h1 className="mt-1 text-2xl font-bold">Review & Approval</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Central approval inbox for MI equipment changes, inspections, readiness, bypasses, deficiencies, work orders, document waivers, and safety-critical records.</p>
          {lastUpdated ? <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mechanical-integrity/review-approval/inbox"><ReviewButton>My Inbox</ReviewButton></Link>
          <Link href="/mechanical-integrity/review-approval/pending"><ReviewButton>Pending</ReviewButton></Link>
          <Link href="/mechanical-integrity/review-approval/overdue"><ReviewButton>Overdue</ReviewButton></Link>
          <Link href="/mechanical-integrity/review-approval/config"><ReviewButton>Configure Rules</ReviewButton></Link>
          <ReviewButton onClick={onRefresh} variant="primary">Refresh</ReviewButton>
        </div>
      </div>
    </header>
  );
}
