import { AlertTriangle } from 'lucide-react';

export function IsolationBlockerBanner({ blockers }: { blockers: string[] }) {
  if (!blockers.length) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        Isolation requirements are currently clear for permit activation.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-danger/40 bg-danger/10 p-4">
      <div className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle size={18} />Activation Blocker</div>
      <div className="mt-2 grid gap-2 text-sm text-[var(--psm-text)]">
        {blockers.map((item) => <div key={item} className="rounded-lg bg-[var(--psm-surface)] px-3 py-2">{item}</div>)}
      </div>
    </div>
  );
}
