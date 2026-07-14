import { AlertTriangle } from 'lucide-react';
import type { ConflictSummary } from '../../services/ptw-conflict.service';

export function ConflictBlockerBanner({ summary }: { summary?: ConflictSummary | undefined }) {
  if (!summary?.activationBlocked) return null;
  return <section className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger"><div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Activation Blocked</div>{summary.blockers.map((item) => <div key={item}>- {item}</div>)}</section>;
}
