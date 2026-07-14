'use client';

import { Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { PSSRCard } from '../pssr-ui';

export function ChecklistGenerateControls({ onGenerate, onRegenerate, onManualItem, busy }: { onGenerate: () => void; onRegenerate: () => void; onManualItem: () => void; busy?: boolean }) {
  return (
    <PSSRCard title="Generate / Regenerate Controls">
      <div className="grid gap-2 md:grid-cols-3">
        <button disabled={busy} onClick={onGenerate} className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-300/20 bg-blue-500/10 px-3 py-2 text-sm font-black text-blue-100 disabled:opacity-50"><RefreshCw size={15} /> Generate Checklist</button>
        <button disabled={busy} onClick={onRegenerate} className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-sm font-black text-amber-100 disabled:opacity-50"><RotateCcw size={15} /> Regenerate Context</button>
        <button disabled={busy} onClick={onManualItem} className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-sm font-black text-emerald-100 disabled:opacity-50"><Plus size={15} /> Add Manual Item</button>
      </div>
    </PSSRCard>
  );
}
