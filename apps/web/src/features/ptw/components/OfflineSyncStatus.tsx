'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { ptwOfflineStore } from '../offline/ptw-offline-store';

export function OfflineSyncStatus() {
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine);
      setQueued(ptwOfflineStore.queue().length);
    };
    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    window.addEventListener('ptw-offline-queue-change', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.removeEventListener('ptw-offline-queue-change', refresh);
    };
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${online ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>
      {online ? <Wifi size={14} /> : <WifiOff size={14} />}
      {online ? 'Online' : 'Offline'} · {queued} queued
    </div>
  );
}
