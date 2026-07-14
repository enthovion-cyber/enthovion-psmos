'use client';

import { RefreshCw } from 'lucide-react';
import { EmptyState, PSSRCard } from '../pssr-ui';
import { AutoVerificationStatusBadge } from './AutoVerificationStatusBadge';

export function AutoVerificationLinksPanel({ links = [], onSync, busy }: { links?: any[]; onSync?: () => void; busy?: boolean }) {
  return (
    <PSSRCard title="Live Auto-Verification Links" action={onSync ? <button onClick={onSync} className="inline-flex items-center gap-2 rounded-md border border-cyan-300/15 px-3 py-1.5 text-xs font-black text-slate-200 hover:border-blue-300/40"><RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Sync</button> : null}>
      {links.length ? (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="rounded-lg border border-cyan-300/10 bg-slate-950/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-white">{link.verification_type}</p>
                  <p className="mt-1 text-xs text-slate-500">{link.source_module} · required {link.required_status} · current {link.current_status ?? '-'}</p>
                  {link.verification_message ? <p className="mt-2 text-xs text-slate-400">{link.verification_message}</p> : null}
                </div>
                <AutoVerificationStatusBadge status={link.verification_status} />
              </div>
              <p className="mt-2 text-xs text-slate-600">Last synced {link.last_synced_at ? new Date(link.last_synced_at).toLocaleString() : 'never'}</p>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No auto-verification links yet" detail="Sync from linked systems to create P&ID, SOP, SDS/PSI, Training, MI, HAZOP, Action, and field verification links." />}
    </PSSRCard>
  );
}
