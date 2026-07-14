import { AlertTriangle } from 'lucide-react';
import type { SignatureSummary } from '../../services/ptw-signature.service';

export function SignatureBlockerBanner({ summary }: { summary?: SignatureSummary | undefined }) {
  if (!summary?.lifecycleBlocked) return null;
  return (
    <section className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-warning">
      <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Lifecycle Blocker</div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {summary.blockers.map((item) => <div key={item} className="rounded-lg border border-warning/30 bg-[var(--psm-surface)] px-3 py-2 text-sm">{item}</div>)}
      </div>
    </section>
  );
}
