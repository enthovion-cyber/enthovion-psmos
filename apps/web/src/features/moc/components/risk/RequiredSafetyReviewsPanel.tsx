'use client';

import { ShieldCheck } from 'lucide-react';
import { Badge, DetailCard, EmptyState } from '../moc-detail-ui';

export function RequiredSafetyReviewsPanel({ requirements, onApply, applying }: { requirements: any[]; onApply: () => void; applying?: boolean }) {
  return (
    <DetailCard title="Required Safety Reviews" action={<button type="button" onClick={onApply} disabled={applying || !requirements.length} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{applying ? 'Applying...' : 'Apply Requirements'}</button>}>
      {!requirements.length ? <EmptyState title="No generated risk reviews" detail="Save or recalculate the risk ranking to generate review requirements." /> : (
        <div className="space-y-2">
          {requirements.map((item) => (
            <div key={item.id ?? `${item.review_type}-${item.source}`} className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" />{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                </div>
                <Badge tone={item.status === 'Action Created' ? 'green' : item.status === 'Preview' ? 'blue' : 'amber'}>{item.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span>Owner: <b className="text-slate-200">{item.owner_role ?? '-'}</b></span>
                <span>Before approval: <b className="text-slate-200">{item.required_before_approval ? 'Yes' : 'No'}</b></span>
                <span>Before startup: <b className="text-slate-200">{item.required_before_startup ? 'Yes' : 'No'}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DetailCard>
  );
}
