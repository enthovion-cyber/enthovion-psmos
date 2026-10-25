'use client';

import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function MOCLiveDataStatus({
  generatedAt,
  realtime,
  onRefresh
}: {
  generatedAt?: string | undefined;
  realtime?: Record<string, any> | undefined;
  onRefresh: () => void;
}) {
  const connected = Boolean(realtime?.connected);

  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        connected
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
          <span>{connected ? 'Realtime Database Subscription Active' : 'Polling Sync Mode Active'}</span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 bg-current/5 px-2.5 py-1 text-xs font-bold hover:bg-current/10 transition-colors"
        >
          <RefreshCw size={12} /> Refresh Stream
        </button>
      </div>
      <p className="mt-1 text-[11px] opacity-85">
        Last synchronized: {generatedAt ? new Date(generatedAt).toLocaleString() : 'Connecting to API...'}
        {connected ? '' : ` — ${realtime?.warning ?? 'Polling mode active for low-latency updates.'}`}
      </p>
    </div>
  );
}
