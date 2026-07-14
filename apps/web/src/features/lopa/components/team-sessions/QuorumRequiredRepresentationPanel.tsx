import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';
import { ProgressBar } from '../overview/LopaOverviewShared';

export function QuorumRequiredRepresentationPanel({ quorum }: any) {
  const checks = quorum?.checks ?? [];
  return (
    <LopaPanel title="Quorum / Required Representation">
      <div className="space-y-3">
        <div className="flex items-center justify-between"><b className="text-white">{quorum?.status ?? 'Not Evaluated'}</b><span className="text-sm text-slate-400">{quorum?.percent ?? 0}%</span></div>
        <ProgressBar value={quorum?.percent ?? 0} tone={quorum?.status === 'Met' ? 'success' : 'warning'} />
        {checks.map((check: any) => <div key={check.key ?? check.title} className="flex justify-between rounded-lg border border-cyan-300/10 bg-[#03101d] p-2 text-sm"><span className="text-slate-200">{check.title}</span><TonePill tone={check.status === 'Complete' || check.status === 'Met' ? 'success' : check.status === 'Warning' ? 'warning' : 'danger'}>{check.status}</TonePill></div>)}
      </div>
    </LopaPanel>
  );
}
