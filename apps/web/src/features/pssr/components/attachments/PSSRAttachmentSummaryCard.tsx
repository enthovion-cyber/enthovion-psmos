'use client';
import { Badge, PSSRCard } from '../pssr-ui';

export function PSSRAttachmentSummaryCard({ summary }: { summary: any }) {
  // Format storage size dynamically based on scale
  const formatStorage = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${Math.round(kb)} KB`;
  };

  const totalStorageSize = summary?.totalSize ? formatStorage(Number(summary.totalSize)) : '0 KB';

  return (
    <PSSRCard title="System Attachment Executive Summary">
      <div className="space-y-4">
        
        {/* Core Operational KPI Metric Dashboard Layout Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric 
            label="Total Attachments" 
            value={summary?.totalAttachments} 
            icon="📁" 
          />
          <Metric 
            label="Linked Documents" 
            value={summary?.linkedDocumentCount} 
            icon="🔗" 
            highlight={!!summary?.linkedDocumentCount}
          />
          <Metric 
            label="Cloud Storage Footprint" 
            value={totalStorageSize} 
            icon="☁️" 
          />
        </div>

        {/* Categorization Segment Mapping Section Footer block */}
        {summary?.byType && Object.keys(summary.byType).length > 0 && (
          <div className="pt-2">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Distribution by Extension Context
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(summary.byType).map(([key, value]) => (
                <Badge key={key} tone="slate" className="bg-slate-950/40 border border-white/5 px-2.5 py-1">
                  <span className="text-slate-400 font-medium uppercase mr-1">{key}:</span>
                  <span className="text-white font-bold">{String(value)}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

      </div>
    </PSSRCard>
  );
}

// Inner Component optimized for crisp data-dense layout presentation
function Metric({ 
  label, 
  value, 
  icon, 
  highlight = false 
}: { 
  label: string; 
  value: any; 
  icon?: string; 
  highlight?: boolean; 
}) { 
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
      highlight 
        ? 'border-emerald-500/20 bg-emerald-500/5' 
        : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {icon && <span className="text-sm opacity-70 select-none">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">
        {value ?? 0}
      </p>
    </div>
  ); 
}