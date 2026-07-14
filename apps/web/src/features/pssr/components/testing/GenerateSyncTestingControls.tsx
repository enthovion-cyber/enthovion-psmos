'use client';

import { PSSRCard } from '../pssr-ui';

export function GenerateSyncTestingControls({ busy, onGenerate, onSyncMoc, onSyncEngineering }: { busy?: boolean; onGenerate: () => void; onSyncMoc: () => void; onSyncEngineering: () => void }) {
  const cls = 'rounded-lg border border-blue-300/20 bg-blue-500/10 px-3 py-2 text-sm font-bold text-blue-100 disabled:opacity-50';
  return <PSSRCard title="Generate / Sync Testing Controls"><div className="grid gap-2 sm:grid-cols-3"><button disabled={busy} onClick={onGenerate} className={cls}>Generate Required Tests</button><button disabled={busy} onClick={onSyncMoc} className={cls}>Sync From MOC</button><button disabled={busy} onClick={onSyncEngineering} className={cls}>Sync Engineering Package</button></div></PSSRCard>;
}
