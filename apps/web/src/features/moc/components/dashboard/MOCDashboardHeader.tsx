'use client';

import Link from 'next/link';
import { Activity, Download, FilePlus2, RefreshCw, ShieldAlert } from 'lucide-react';
import { MocButton } from '../moc-detail-ui';

export function MOCDashboardHeader({
  generatedAt,
  onRefresh,
  onExport
}: {
  generatedAt?: string | undefined;
  onRefresh: () => void;
  onExport: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <ShieldAlert size={15} /> OSHA 1910.119(l) Management of Change
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--psm-fg)] sm:text-3xl">
          Management of Change Control Room
        </h1>
        <p className="mt-1.5 max-w-3xl text-xs text-[var(--psm-muted)] sm:text-sm">
          Enterprise operational oversight for technical change baselines, temporary & emergency modifications, multi-discipline approval queues, HAZOP risk exposure, and PSSR startup gating.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <Activity size={14} className="animate-pulse" />
          <span>Live Data Feed {generatedAt ? `· ${new Date(generatedAt).toLocaleTimeString()}` : ''}</span>
        </div>
        <MocButton onClick={onRefresh} variant="secondary">
          <RefreshCw size={14} />
          <span>Refresh</span>
        </MocButton>
        <MocButton onClick={onExport} variant="secondary">
          <Download size={14} />
          <span>Export CSV</span>
        </MocButton>
        <Link
          href="/moc/new"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <FilePlus2 size={15} />
          <span>New MOC</span>
        </Link>
      </div>
    </header>
  );
}
