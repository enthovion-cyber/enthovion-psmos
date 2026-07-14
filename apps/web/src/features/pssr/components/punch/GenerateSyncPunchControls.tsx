'use client';

import { PSSRCard } from '../pssr-ui';

export function GenerateSyncPunchControls({ busy, onSync, onRefresh }: { busy?: boolean; onSync: () => void; onRefresh: () => void }) {
  const cls = 'rounded-lg border border-blue-300/20 bg-blue-500/10 px-3 py-2 text-sm font-bold text-blue-100 disabled:opacity-50';
  return <PSSRCard title="Generate / Sync Punch Items Controls"><div className="grid gap-2 sm:grid-cols-2"><button disabled={busy} onClick={onSync} className={cls}>Sync From All Blockers</button><button disabled={busy} onClick={onRefresh} className={cls}>Refresh Action Statuses</button></div></PSSRCard>;
}
