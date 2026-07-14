'use client';

import Link from 'next/link';
import { Info, ArrowRight } from 'lucide-react';
import { EmptyState, PSSRCard } from '../pssr-ui';

interface AuthorizationItem {
  id: string | number;
  pssr_number: string;
  title: string;
  pendingSignatures?: any[];
  authorizationPendingCount?: number;
  openBlockersCount?: number;
  authorization_status?: string;
}

export function PSSRAuthorizationQueuePanel({ rows }: { rows: AuthorizationItem[] }) {
  // Enforce limitation to show maximum of 4 items as requested
  const visibleRows = (rows ?? []).slice(0, 4);

  // Calculate high-level summary telemetry strictly using the incoming component database array properties
  const totalPendingSignatures = (rows ?? []).reduce((acc, curr) => {
    return acc + (curr.pendingSignatures?.length ?? curr.authorizationPendingCount ?? 0);
  }, 0);

  const totalReadyForRelease = (rows ?? []).filter(
    (item) => item.authorization_status?.toLowerCase() === 'ready' || !item.openBlockersCount
  ).length;

  return (
    <PSSRCard 
      title={
        <div className="flex items-center gap-2 text-white font-semibold text-base">
          <span>Authorization Queue</span>
          <Info size={15} className="text-slate-400 cursor-help" />
        </div>
      }
    >
      <div>
        {/* Top Highlight Counters Grid driven purely by code row states */}
        <div className="grid grid-cols-2 text-center pb-4 mb-4 border-b border-slate-900/60 relative">
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-amber-400 leading-none">
              {totalPendingSignatures}
            </span>
            <span className="text-xs text-slate-400 mt-1">Pending Signatures</span>
          </div>

          <div className="absolute left-1/2 top-2 bottom-2 w-[1px] bg-slate-800" />

          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-emerald-500 leading-none">
              {totalReadyForRelease}
            </span>
            <span className="text-xs text-slate-400 mt-1">Ready for Release</span>
          </div>
        </div>

        <h4 className="text-xs font-semibold text-slate-300 mb-3 tracking-wide">
          Top PSSRs Pending Signatures
        </h4>

        {visibleRows.length ? (
          <div className="space-y-3">
            {visibleRows.map((item, index) => {
              const pendingCount = item.pendingSignatures?.length ?? item.authorizationPendingCount ?? 0;
              
              return (
                <div 
                  key={item.id || index} 
                  className="flex items-center justify-between gap-4 py-1 text-sm border-b border-slate-900/20 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Link 
                      href={`/pssr/${item.id}`} 
                      className="font-medium text-sky-400 hover:underline shrink-0"
                    >
                      {item.pssr_number}
                    </Link>
                    
                    <span className="text-slate-300 truncate font-normal">
                      {item.title}
                    </span>
                  </div>

                  {/* Render actual code counters derived from item property states dynamically */}
                  <div className="text-slate-400 text-xs shrink-0 whitespace-nowrap">
                    {pendingCount} Pending · {item.openBlockersCount ?? 0} Blockers
                  </div>
                </div>
              );
            })}

            <div className="mt-5 pt-3 border-t border-slate-900/60 text-center">
              <Link 
                href="/pssr/authorization-queue" 
                className="inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                <span>View Authorization Queue</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState 
            title="No pending authorization queue" 
            detail="Ready-for-authorization and pending-signature PSSRs appear here." 
          />
        )}
      </div>
    </PSSRCard>
  );
}