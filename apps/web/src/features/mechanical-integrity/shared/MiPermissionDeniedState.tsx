import { Lock } from 'lucide-react';

export function MiPermissionDeniedState() {
  return (
    <div className="psm-card grid min-h-80 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-danger/10 text-danger"><Lock size={22} /></div>
        <h2 className="mt-4 text-lg font-semibold">Mechanical Integrity access denied</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--psm-muted)]">Your role does not include the Mechanical Integrity permissions required for this view.</p>
      </div>
    </div>
  );
}
