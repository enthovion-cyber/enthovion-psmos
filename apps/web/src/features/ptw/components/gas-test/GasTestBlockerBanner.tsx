import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export function GasTestBlockerBanner({ blockers }: { blockers: string[] }) {
  if (!blockers.length) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
        <div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={17} /> Gas test controls are clear for activation.</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/10 p-4">
      <div className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle size={17} /> Activation Blocker</div>
      <ul className="mt-2 space-y-1 text-sm text-[var(--psm-text)]">
        {blockers.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  );
}
