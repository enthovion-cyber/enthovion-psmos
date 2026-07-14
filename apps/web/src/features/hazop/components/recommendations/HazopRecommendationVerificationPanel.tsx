'use client';

import { useState } from 'react';
import { ShieldCheck, XCircle } from 'lucide-react';
import { RecommendationPanel } from './HazopRecommendationStatusBadge';

export function HazopRecommendationVerificationPanel({ recommendation, canVerify, onRequest, onVerify, onReject }: { recommendation: any; canVerify?: boolean | undefined; onRequest: () => void; onVerify: (values: Record<string, any>) => void; onReject: (values: Record<string, any>) => void }) {
  const [comment, setComment] = useState('');
  return <RecommendationPanel title="Verification"><div className="space-y-2 text-sm"><div>Status: <strong>{recommendation.verification_status ?? 'Not Required'}</strong></div><div>Required: <strong>{recommendation.verification_required ? 'Yes' : 'No'}</strong></div><div>Verifier: <strong>{recommendation.verified_by ?? '-'}</strong></div></div>{canVerify ? <div className="mt-3 grid gap-2"><textarea className="input min-h-20" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Verification comment / rejection reason" /><div className="flex flex-wrap gap-2"><button onClick={onRequest} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Request Verification</button><button onClick={() => onVerify({ decision: 'Accepted', verificationComment: comment })} className="rounded-lg border border-emerald-500/30 px-3 py-2 text-sm font-semibold text-emerald-300"><ShieldCheck size={15} className="mr-2 inline" />Verify Close</button><button onClick={() => onReject({ decision: 'Rejected', reason: comment })} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300"><XCircle size={15} className="mr-2 inline" />Reject</button></div></div> : null}</RecommendationPanel>;
}
