'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Badge, EmptyState, PSSRCard, riskTone, statusTone } from '../pssr-ui';

export function LinkedMOCCard({ pssr }: { pssr: any }) {
  const moc = pssr.linkedMoc?.moc;

  // Render original empty fallback state structure
  if (!moc) {
    return (
      <PSSRCard title="Linked Management of Change (MOC)">
        <EmptyState 
          title="No linked MOC" 
          detail="This PSSR was created manually or from a non-MOC trigger source." 
        />
      </PSSRCard>
    );
  }

  return (
    <PSSRCard
      title="Linked MOC Information"
      action={
        <Link 
          href={`/moc/${moc.id}`} 
          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 px-2.5 py-1.5 rounded-lg"
        >
          <span>Open MOC</span> 
          <ArrowUpRight size={13} className="opacity-80" />
        </Link>
      }
    >
      <div className="space-y-4">
        
        {/* Metabar Badges Row Layout */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
          <Badge tone="blue">
            {moc.moc_number}
          </Badge>
          <Badge tone={statusTone(moc.status)}>
            {moc.status}
          </Badge>
          <Badge tone={riskTone(moc.risk_level)}>
            {moc.risk_level}
          </Badge>
        </div>

        {/* MOC Title Header Profile Block */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white tracking-tight leading-snug">
            {moc.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            {moc.description ?? 'No MOC description provided.'}
          </p>
        </div>

        {/* Grid Meta Information Grid Blocks */}
        <div className="grid gap-2.5 text-xs sm:grid-cols-2">
          <Row 
            label="Change Type" 
            value={moc.change_type ?? '-'} 
          />
          <Row 
            label="Target Implementation" 
            value={moc.target_implementation_date ? new Date(moc.target_implementation_date).toLocaleDateString() : '-'} 
          />
          <Row 
            label="Trigger Reason" 
            value={pssr.linkedMoc.trigger_reason ?? '-'} 
          />
          
          {/* Highlight Blocker Status Rows dynamically */}
          <Row 
            label="Open Startup Blockers" 
            value={pssr.summary?.linkedMocStartupBlockers ?? 0}
            highlightValue={(pssr.summary?.linkedMocStartupBlockers ?? 0) > 0}
          />
        </div>

      </div>
    </PSSRCard>
  );
}

/**
 * Enhanced Sub-Row Component Block
 */
function Row({ 
  label, 
  value, 
  highlightValue = false 
}: { 
  label: string; 
  value: any; 
  highlightValue?: boolean 
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-slate-900/40 px-3.5 py-2.5 transition-colors hover:bg-slate-900/60">
      <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider select-none">
        {label}
      </span>
      <span className={`font-mono text-xs font-bold ${
        highlightValue ? 'text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/10' : 'text-slate-200'
      }`}>
        {value}
      </span>
    </div>
  );
}