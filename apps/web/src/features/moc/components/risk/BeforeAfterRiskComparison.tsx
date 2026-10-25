'use client';

import type { UseFormWatch } from 'react-hook-form';
import { DetailCard, ProgressBar, riskTone } from '../moc-detail-ui';
import { riskLevel, type MOCRiskValues } from '../../schemas/moc-risk.schema';

export function BeforeAfterRiskComparison({ watch, risk }: { watch: UseFormWatch<MOCRiskValues>; risk: any }) {
  const before = Number(watch('beforeScore') ?? risk?.before_score ?? 0);
  const after = Number(watch('safetyScore') ?? 0) + Number(watch('environmentalScore') ?? 0) + Number(watch('productionScore') ?? 0);

  return (
    <DetailCard title="Before vs. After Modification Risk Delta">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RiskLane title="Pre-Change Baseline Risk" score={before} level={risk?.before_level ?? riskLevel(before)} />
        <RiskLane title="Post-Change Residual Risk" score={after} level={riskLevel(after)} />
      </div>
    </DetailCard>
  );
}

function RiskLane({ title, score, level }: { title: string; score: number; level: string }) {
  const tone = riskTone(level);
  const toneText =
    tone === 'red'
      ? 'text-rose-600 dark:text-rose-400'
      : tone === 'amber'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'purple'
      ? 'text-violet-600 dark:text-violet-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 transition-colors">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">{title}</p>
        <p className={`font-mono text-xl font-black ${toneText}`}>{score} / 9</p>
      </div>
      <ProgressBar
        value={score * 11.11}
        tone={level === 'Critical' || level === 'High' ? 'red' : level === 'Medium' ? 'amber' : 'green'}
      />
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="font-bold text-[var(--psm-fg)]">{level} Risk Tier</span>
        <span className="text-[var(--psm-muted)] font-mono">{Math.round(score * 11.11)}% saturation</span>
      </div>
    </div>
  );
}
