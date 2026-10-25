'use client';

import Link from 'next/link';
import { AlertTriangle, Lock, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PsiMocLockBannerProps {
  isLocked?: boolean | undefined;
  mocId?: string | null | undefined;
  mocNumber?: string | null | undefined;
  mocTitle?: string | null | undefined;
  lockReason?: string | null | undefined;
  onApplyBaseline?: (() => void) | undefined;
  isApplying?: boolean | undefined;
  allowManualSync?: boolean | undefined;
}

export function PsiMocLockBanner({
  isLocked = false,
  mocId,
  mocNumber,
  mocTitle,
  lockReason,
  onApplyBaseline,
  isApplying = false,
  allowManualSync = false
}: PsiMocLockBannerProps) {
  if (!isLocked) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm transition-all dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                <AlertTriangle className="h-3 w-3" /> Active MOC Baseline Lock
              </span>
              {mocNumber && (
                <span className="font-mono text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {mocNumber}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {mocTitle ? `Modification in Progress: ${mocTitle}` : 'This technical baseline record is currently affected by an active Management of Change.'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {lockReason || 'Direct edits are restricted while change commissioning is in progress. The baseline will automatically update upon PSSR approval and MOC closure.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end md:self-center">
          {allowManualSync && onApplyBaseline && (
            <button
              onClick={onApplyBaseline}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/80 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isApplying ? 'animate-spin' : ''}`} />
              {isApplying ? 'Syncing...' : 'Sync Baseline from MOC'}
            </button>
          )}

          {mocId && (
            <Link
              href={`/moc/${mocId}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-amber-700 dark:hover:bg-amber-600"
            >
              <span>View Parent MOC</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
