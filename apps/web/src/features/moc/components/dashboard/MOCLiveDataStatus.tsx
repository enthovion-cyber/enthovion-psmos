'use client';

import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function MOCLiveDataStatus({ generatedAt, realtime, onRefresh }: { generatedAt?: string | undefined; realtime?: Record<string, any> | undefined; onRefresh: () => void }) {
  const connected = Boolean(realtime?.connected);
  return (
    <div className={`rounded-xl border p-3 ${connected ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : 'border-amber-300/20 bg-amber-500/10 text-amber-100'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black">{connected ? <Wifi size={16} /> : <WifiOff size={16} />}{connected ? 'Live connected' : 'Live refresh mode'}</div>
        <button onClick={onRefresh} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-xs font-black"><RefreshCw size={14} /> Refresh now</button>
      </div>
      <p className="mt-1 text-xs opacity-80">Last refreshed: {generatedAt ? new Date(generatedAt).toLocaleString() : 'Waiting for API'}{connected ? '' : ` - ${realtime?.warning ?? 'Realtime is not connected.'}`}</p>
    </div>
  );
}
