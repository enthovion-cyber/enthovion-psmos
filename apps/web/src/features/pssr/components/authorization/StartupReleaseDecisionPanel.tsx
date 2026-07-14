'use client';
import { PSSRCard } from '../pssr-ui';
export function StartupReleaseDecisionPanel({ onReadiness, onMarkReady, onAuthorize, onRelease, onReturn, onCancel }: { onReadiness: () => void; onMarkReady: () => void; onAuthorize: () => void; onRelease: () => void; onReturn: () => void; onCancel: () => void }) {
  const cls = 'rounded-lg border px-3 py-2 text-sm font-bold';
  return <PSSRCard title="Startup Release Decision Panel"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"><button onClick={onReadiness} className={`${cls} border-blue-300/20 text-blue-100`}>Run Final Readiness Check</button><button onClick={onMarkReady} className={`${cls} border-amber-300/20 text-amber-100`}>Mark Ready</button><button onClick={onAuthorize} className={`${cls} border-emerald-300/20 text-emerald-100`}>Authorize Startup</button><button onClick={onRelease} className={`${cls} border-emerald-300/20 text-emerald-100`}>Release Startup</button><button onClick={onReturn} className={`${cls} border-orange-300/20 text-orange-100`}>Return For Correction</button><button onClick={onCancel} className={`${cls} border-red-300/20 text-red-100`}>Cancel Authorization</button></div></PSSRCard>;
}
