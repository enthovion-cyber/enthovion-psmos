'use client';

import { FileUp } from 'lucide-react';
import { EmptyState, PSSRCard } from '../pssr-ui';

export function ChecklistEvidenceUploadPanel({ evidence, onQuickEvidence }: { evidence: any[]; onQuickEvidence: () => void }) {
  return (
    <PSSRCard title="Evidence Upload Panel" action={<button onClick={onQuickEvidence} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white"><FileUp size={14} /> Add Evidence</button>}>
      {evidence.length ? <div className="space-y-2">{evidence.slice(0, 6).map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="font-black text-white">{item.file_name}</p><p className="text-xs text-slate-500">{item.evidence_type} · {item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : '-'}</p><p className="mt-1 text-sm text-slate-400">{item.note}</p></div>)}</div> : <EmptyState title="No evidence uploaded" detail="Upload photo, PDF, checklist document, linked Document Control reference, or note against a checklist item." />}
    </PSSRCard>
  );
}
