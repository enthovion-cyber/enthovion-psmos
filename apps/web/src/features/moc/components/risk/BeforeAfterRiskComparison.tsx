'use client';

import type { UseFormWatch } from 'react-hook-form';
import { DetailCard, ProgressBar, riskTone } from '../moc-detail-ui';
import { riskLevel, type MOCRiskValues } from '../../schemas/moc-risk.schema';

export function BeforeAfterRiskComparison({ watch, risk }: { watch: UseFormWatch<MOCRiskValues>; risk: any }) {
  const before = Number(watch('beforeScore') ?? risk?.before_score ?? 0);
  const after = Number(watch('safetyScore') ?? 0) + Number(watch('environmentalScore') ?? 0) + Number(watch('productionScore') ?? 0);
  return (
    <DetailCard title="Before / After Risk Comparison">
      <div className="grid gap-4 md:grid-cols-2">
        <RiskLane title="Before Change" score={before} level={risk?.before_level ?? riskLevel(before)} />
        <RiskLane title="After Change" score={after} level={riskLevel(after)} />
      </div>
    </DetailCard>
  );
}

function RiskLane({ title, score, level }: { title: string; score: number; level: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
      <div className="mb-3 flex items-center justify-between"><p className="text-sm font-black text-white">{title}</p><p className={`text-2xl font-black ${riskTone(level) === 'red' ? 'text-red-300' : riskTone(level) === 'amber' ? 'text-amber-300' : riskTone(level) === 'purple' ? 'text-violet-300' : 'text-emerald-300'}`}>{score}/9</p></div>
      <ProgressBar value={score * 11.11} tone={level === 'Critical' || level === 'High' ? 'red' : level === 'Medium' ? 'amber' : 'green'} />
      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">{level}</p>
    </div>
  );
}
