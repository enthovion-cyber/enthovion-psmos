'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { RecommendationPanel } from './HazopRecommendationStatusBadge';

export function HazopRecommendationEvidencePanel({ recommendation, canUpload, onUpload }: { recommendation: any; canUpload?: boolean | undefined; onUpload: (values: Record<string, any>) => void }) {
  const [form, setForm] = useState({ evidenceType: 'Photo', fileName: '', comment: '' });
  const evidence = recommendation?.evidence ?? [];
  return (
    <RecommendationPanel title="Evidence">
      <div className="space-y-2">{evidence.map((item: any) => <div key={item.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm"><div className="font-semibold">{item.evidence_type}</div><div className="text-xs text-[var(--psm-muted)]">{item.file_name ?? item.document_id ?? item.comment ?? 'Evidence submitted'} · {item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : ''}</div></div>)}{!evidence.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">No evidence uploaded.</div> : null}</div>
      {canUpload ? <div className="mt-3 grid gap-2"><select className="input" value={form.evidenceType} onChange={(e) => setForm({ ...form, evidenceType: e.target.value })}><option>Photo</option><option>PDF</option><option>Calculation</option><option>Procedure update</option><option>P&ID update</option><option>Training record</option><option>Test record</option><option>Inspection record</option><option>Meeting minutes</option><option>Management approval</option><option>Other</option></select><input className="input" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="File name / reference" /><input className="input" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Evidence comment" /><button onClick={() => onUpload(form)} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold"><Upload size={15} className="mr-2 inline" />Upload Evidence</button></div> : null}
    </RecommendationPanel>
  );
}
