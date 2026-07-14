'use client';

import { useFormContext } from 'react-hook-form';
import { riskFromValues, type MOCCreateValues } from '../../schemas/moc.schema';
import { StepShell, ToggleCard } from './create-ui';

const levels = [['None', 0], ['Minor', 1], ['Significant', 2], ['Major', 3]] as const;

export function MOCRiskRankingStep() {
  const { watch, setValue } = useFormContext<MOCCreateValues>();
  const risk = watch('risk');
  const calculated = riskFromValues({ risk });
  return (
    <StepShell eyebrow="Step 4" title="Risk Ranking">
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <RiskRow label="Safety Impact" value={risk.safetyImpact} onChange={(value) => setValue('risk.safetyImpact', value, { shouldDirty: true })} />
          <RiskRow label="Environmental Impact" value={risk.environmentalImpact} onChange={(value) => setValue('risk.environmentalImpact', value, { shouldDirty: true })} />
          <RiskRow label="Production Impact" value={risk.productionImpact} onChange={(value) => setValue('risk.productionImpact', value, { shouldDirty: true })} />
        </div>
        <aside className="rounded-xl border border-blue-300/20 bg-blue-500/10 p-5">
          <p className="text-xs uppercase tracking-wide text-blue-200">Server validated score</p>
          <div className="mt-4 text-6xl font-black text-white">{calculated.score}</div>
          <div className={`mt-4 rounded-lg px-4 py-3 text-center text-xl font-black ${calculated.level === 'Critical' ? 'bg-red-500 text-white' : calculated.level === 'High' ? 'bg-amber-400 text-slate-950' : calculated.level === 'Medium' ? 'bg-yellow-400 text-slate-950' : 'bg-emerald-500 text-white'}`}>{calculated.level}</div>
          <p className="mt-4 text-sm text-slate-300">High risk requires HSE Director and VP Operations. Critical risk requires HAZOP review, PSSR, and Plant Manager alert.</p>
        </aside>
      </div>
    </StepShell>
  );
}

function RiskRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div><h3 className="mb-2 text-sm font-bold text-white">{label}</h3><div className="grid gap-2 md:grid-cols-4">{levels.map(([name, score]) => <ToggleCard key={name} active={Number(value) === score} title={`${name} = ${score}`} onClick={() => onChange(score)} />)}</div></div>;
}
