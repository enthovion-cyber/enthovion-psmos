import { AlertTriangle, Calculator, CheckCircle2, Layers, ShieldCheck, Sigma } from 'lucide-react';
import { FrequencyDisplay } from '../shared/FrequencyDisplay';
import { RiskGapBadge } from '../shared/RiskGapBadge';

export function RiskCalculationSummaryCards({ summary }: { summary: Record<string, any> }) {
  const cards = [
    ['IE Frequency', <FrequencyDisplay key="ie" value={summary.ieFrequency} />, Calculator],
    ['Modifier Factor', summary.combinedModifierFactor ? Number(summary.combinedModifierFactor).toPrecision(3) : '-', Sigma],
    ['Credited IPLs', summary.creditedIplCount ?? 0, ShieldCheck],
    ['Combined PFDavg', <FrequencyDisplay key="pfd" value={summary.combinedIplPfdavg} unit="" />, Layers],
    ['Mitigated Frequency', <FrequencyDisplay key="mit" value={summary.mitigatedEventFrequency} />, CheckCircle2],
    ['Risk Gap', <RiskGapBadge key="gap" value={summary.riskGapFactor} meets={summary.meetsRiskCriteria} />, AlertTriangle]
  ] as const;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(([label, value, Icon]) => (
        <div key={label} className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
          <div className="flex items-center justify-between"><span className="text-[11px] uppercase text-slate-500">{label}</span><Icon size={16} className="text-cyan-300" /></div>
          <div className="mt-3 text-lg font-black text-white">{value}</div>
        </div>
      ))}
    </div>
  );
}
