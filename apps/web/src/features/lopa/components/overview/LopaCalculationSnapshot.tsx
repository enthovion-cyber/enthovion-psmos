import { Calculator } from 'lucide-react';
import { FieldGrid, LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaCalculationSnapshot({ calculation }: { calculation: Record<string, any> }) {
  return (
    <LopaPanel title="Calculation Snapshot" action={<TonePill tone={calculation.status === 'Complete' ? 'success' : 'warning'}>{calculation.status}</TonePill>}>
      <div className="mb-3 rounded-lg border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-100">
        <div className="flex items-center gap-2 font-bold"><Calculator size={14} /> Formula</div>
        <div className="mt-1">{calculation.formula}</div>
      </div>
      <FieldGrid items={[
        ['Last version / by', [calculation.lastVersion, calculation.lastCalculatedBy].filter(Boolean).join(' / ')],
        ['Last calculated at', calculation.lastCalculatedAt ? new Date(calculation.lastCalculatedAt).toLocaleString() : null],
        ['IE frequency', calculation.initiatingEventFrequency],
        ['Conditional modifiers', calculation.conditionalModifiers],
        ['Total PFDavg', calculation.totalPfdavg],
        ['Total RRF', calculation.totalRrf],
        ['Mitigated frequency', calculation.mitigatedEventFrequency],
        ['Tolerable frequency', calculation.tolerableFrequency],
        ['Required RRF', calculation.requiredRrf],
        ['Risk gap', calculation.riskGap],
        ['Pass / fail', calculation.passFail],
        ['Locked', calculation.locked ? 'Yes' : 'No']
      ]} />
      {!!calculation.warnings?.length && <div className="mt-3 space-y-2">{calculation.warnings.map((warning: string) => <div key={warning} className="rounded-md border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">{warning}</div>)}</div>}
    </LopaPanel>
  );
}
