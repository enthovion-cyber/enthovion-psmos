'use client';

import Link from 'next/link';
import { ExternalLink, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AsBuiltStatusBadge } from '../shared/AsBuiltStatusBadge';
import { RedlineStatusBadge } from '../shared/RedlineStatusBadge';
import { PsiButton, PsiCard } from '../shared/PsiUi';
import type { DrawingMocRedline } from '../types/drawing.types';

export function MocRedlinePanel({ value }: { value?: DrawingMocRedline | null }) {
  if (!value) {
    return (
      <PsiCard
        title="MOC / Redline Status"
        subtitle="MOC drawing update status, redline control, as-built status, field walkdown, and PSSR blocker context."
      >
        <p className="text-sm text-[var(--psm-muted)]">No active MOC redline or as-built modification recorded for this drawing.</p>
      </PsiCard>
    );
  }

  const isLocked = value.moc_required || value.drawing_update_required_by_moc || value.redline_status === 'Redlined - Pending MOC';

  return (
    <PsiCard
      title="MOC / Redline Status & Change Spine Gate"
      subtitle="OSHA 1910.119(l) redline controls: Tracks field updates, as-built verification, and MOC closure promotion."
    >
      <div className="space-y-4">
        {/* Status Callout Banner */}
        <div
          className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
            isLocked
              ? 'border-amber-300 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
              : 'border-emerald-300 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {isLocked ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                <Lock className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">
                {isLocked ? 'Drawing Locked for Active MOC Implementation' : 'Drawing Baseline is In Sync & Approved'}
              </p>
              <p className="text-xs text-[var(--psm-muted)]">
                {isLocked
                  ? 'Redlines pending field installation walkdown and PSSR pre-startup authorization.'
                  : 'No active MOC redlines or pending baseline updates.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PsiButton
              href="/process-safety-information/integrations/moc"
              variant="secondary"
              className="text-xs"
            >
              MOC Integration Center <ExternalLink className="ml-1.5 h-3 w-3" />
            </PsiButton>
          </div>
        </div>

        {/* Structured Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Redline Status</p>
            <div className="mt-1.5">
              <RedlineStatusBadge value={value.redline_status ?? null} />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">MOC Update Status</p>
            <p className="mt-1 text-sm font-semibold text-[var(--psm-fg)]">
              {value.moc_update_status ?? (value.drawing_update_required_by_moc ? 'Update Required' : 'Not Required')}
            </p>
          </div>

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">As-Built Verification</p>
            <div className="mt-1.5">
              <AsBuiltStatusBadge verified={value.as_built_verified} required={value.as_built_required} />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Linked MOC ID</p>
            <p className="mt-1 font-mono text-xs text-[var(--psm-fg)]">
              {value.linked_moc_id ?? 'None'}
            </p>
          </div>

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Field Walkdown</p>
            <p className="mt-1 text-sm font-medium text-[var(--psm-fg)]">
              {value.field_walkdown_status ?? 'Not Scheduled'}
            </p>
          </div>

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Notes / Comments</p>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              {value.comments || 'No comments recorded.'}
            </p>
          </div>
        </div>
      </div>
    </PsiCard>
  );
}
