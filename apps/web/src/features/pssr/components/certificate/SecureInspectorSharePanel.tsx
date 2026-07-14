'use client';

import { Link2, X } from 'lucide-react';
import { EmptyState, PSSRCard } from '../pssr-ui';

export function SecureInspectorSharePanel({ shares = [], onCreate, onRevoke, busy }: { shares?: any[]; onCreate?: () => void; onRevoke?: (id: string) => void; busy?: boolean }) {
  return (
    <PSSRCard title="Secure OSHA Inspector Sharing" action={<button disabled={busy} onClick={onCreate} className="inline-flex items-center gap-2 rounded-md border border-cyan-300/15 px-3 py-1.5 text-xs font-black text-slate-200 hover:border-blue-300/40"><Link2 size={14} /> New Link</button>}>
      {shares.length ? (
        <div className="space-y-2">
          {shares.map((share) => (
            <div key={share.id} className="rounded-lg border border-cyan-300/10 bg-slate-950/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-white">{share.access_scope}</p>
                  <p className="mt-1 text-xs text-slate-500">Expires {share.expires_at ? new Date(share.expires_at).toLocaleString() : 'No expiry'} · {share.revoked_at ? 'Revoked' : 'Active'}</p>
                  {share.url ? <p className="mt-2 break-all text-xs text-blue-200">{share.url}</p> : null}
                </div>
                {!share.revoked_at ? <button onClick={() => onRevoke?.(share.id)} className="rounded-md border border-red-300/20 p-2 text-red-200 hover:bg-red-500/10"><X size={14} /></button> : null}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No secure inspector links" detail="Create a read-only, revocable certificate share after the startup certificate is issued." />}
    </PSSRCard>
  );
}
