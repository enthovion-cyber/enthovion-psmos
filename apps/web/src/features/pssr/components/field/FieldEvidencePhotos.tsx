'use client';

import { Camera } from 'lucide-react';
import { EmptyState, PSSRCard } from '../pssr-ui';

export function FieldEvidencePhotos({ evidence, onUpload }: { evidence: any[]; onUpload: () => void }) {
  return <PSSRCard title="Field Evidence Photos" action={<button onClick={onUpload} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white"><Camera size={14} /> Upload Photo</button>}>{evidence.length ? <div className="grid gap-3 md:grid-cols-2">{evidence.slice(0, 8).map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="font-black text-white">{item.file_name}</p><p className="text-xs text-slate-500">{item.caption ?? 'No caption'} · {item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : '-'}</p></div>)}</div> : <EmptyState title="No field photos uploaded" detail="Upload photos, mobile camera captures, captions, GPS, and timestamped evidence." />}</PSSRCard>;
}
