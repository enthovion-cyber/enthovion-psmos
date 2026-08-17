import { Sparkles } from 'lucide-react';

export function MiUpgradeRequiredState() {
  return (
    <div className="psm-card grid min-h-80 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-warning/10 text-warning"><Sparkles size={22} /></div>
        <h2 className="mt-4 text-lg font-semibold">Mechanical Integrity is not enabled</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--psm-muted)]">Upgrade or enable the MI module entitlement for this company workspace.</p>
      </div>
    </div>
  );
}
