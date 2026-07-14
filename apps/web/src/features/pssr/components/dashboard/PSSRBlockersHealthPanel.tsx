'use client';

import React from 'react';
import { 
  Info, 
  ArrowRight, 
  ClipboardCheck, 
  FileText, 
  GraduationCap, 
  TestTube, 
  Layers, 
  FileCheck 
} from 'lucide-react';
import { PSSRCard } from '../pssr-ui';

// Strict color and icon mapping corresponding to the high-end dashboard spec
const getBlockerConfig = (source: string) => {
  const normalized = source?.toLowerCase() || '';
  if (normalized.includes('checklist')) {
    return { color: 'bg-[#ef4444]', glow: 'shadow-[#ef4444]/20', text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', icon: ClipboardCheck };
  }
  if (normalized.includes('document')) {
    return { color: 'bg-[#f97316]', glow: 'shadow-[#f97316]/20', text: 'text-[#f97316]', bg: 'bg-[#f97316]/10', icon: FileText };
  }
  if (normalized.includes('training')) {
    return { color: 'bg-[#eab308]', glow: 'shadow-[#eab308]/20', text: 'text-[#eab308]', bg: 'bg-[#eab308]/10', icon: GraduationCap };
  }
  if (normalized.includes('test')) {
    return { color: 'bg-[#3b82f6]', glow: 'shadow-[#3b82f6]/20', text: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', icon: TestTube };
  }
  if (normalized.includes('punch')) {
    return { color: 'bg-[#a855f7]', glow: 'shadow-[#a855f7]/20', text: 'text-[#a855f7]', bg: 'bg-[#a855f7]/10', icon: Layers };
  }
  if (normalized.includes('signature')) {
    return { color: 'bg-[#06b6d4]', glow: 'shadow-[#06b6d4]/20', text: 'text-[#06b6d4]', bg: 'bg-[#06b6d4]/10', icon: FileCheck };
  }
  return { color: 'bg-slate-400', glow: 'shadow-slate-400/20', text: 'text-slate-400', bg: 'bg-slate-400/10', icon: Info };
};

export function PSSRBlockersHealthPanel({ 
  rows, 
  onViewAll 
}: { 
  rows: any[];
  onViewAll?: () => void; 
}) {
  // Aggregate real dynamic total values
  const totalOpen = (rows ?? []).reduce((sum, row) => sum + Number(row.open ?? 0), 0);

  // Derive maximum bounds out of active metrics to establish visual chart scalability
  const maxOpen = Math.max(...(rows ?? []).map(r => Number(r.open ?? 0)), 1);

  return (
    <PSSRCard 
      title={
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-tight text-slate-200">Blockers Health</span>
          <Info size={14} className="text-slate-500 cursor-help hover:text-slate-400 transition-colors" />
        </div>
      }
    >
      <div className="flex flex-col justify-between h-full bg-[#070d19]/40 rounded-xl p-4 border border-slate-800/40">
        
        {/* Dynamic Metric Breakdown Stack */}
        <div className="space-y-4 flex-grow">
          {(rows ?? []).map((item) => {
            const config = getBlockerConfig(item.source);
            const Icon = config.icon;
            
            // Calculate progress line accurately based on local environment limits
            const widthPercent = item.total ? (item.open / item.total) * 100 : 0;

            return (
              <div key={item.source} className="group flex items-center justify-between gap-4">
                
                {/* Left: Icon Identity Wrapper */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex items-center justify-center p-2 rounded-lg transition-transform group-hover:scale-105 duration-200 ${config.bg} ${config.text}`}>
                    <Icon size={16} strokeWidth={2.25} />
                  </div>
                  
                  {/* Item Label & Progress Bar Group */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-300 mb-1.5 truncate group-hover:text-white transition-colors">
                      {item.source}
                    </div>
                    {/* Multi-layered track container */}
                    <div className="relative w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/30">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out shadow-sm ${config.color} ${config.glow}`}
                        style={{ width: `${widthPercent}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Counter Metric Balance */}
                <div className="text-sm font-bold text-slate-200 w-6 text-right font-mono tabular-nums tracking-wide">
                  {item.open}
                </div>
                
              </div>
            );
          })}

          {(!rows || rows.length === 0) && (
            <div className="flex items-center justify-center h-24 text-xs text-slate-500 italic">
              No pending blockers identified
            </div>
          )}
        </div>

        {/* Dashboard Aggregate Footer Section */}
        <div className="mt-6 pt-4 border-t border-slate-800/60">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Open Blockers
            </span>
            <span className="text-3xl font-black font-sans tracking-tight text-[#ef4444] drop-shadow-[0_2px_10px_rgba(239,68,68,0.15)]">
              {totalOpen}
            </span>
          </div>

          {/* Interactive Trigger Control Anchor */}
          <button 
            onClick={onViewAll}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/50 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-slate-900/90 hover:border-slate-700/80 transition-all group"
          >
            <span>View All Blockers</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
        
      </div>
    </PSSRCard>
  );
}