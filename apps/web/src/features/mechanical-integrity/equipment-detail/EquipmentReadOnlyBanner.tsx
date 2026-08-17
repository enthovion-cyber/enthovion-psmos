import { Lock } from 'lucide-react';

export function EquipmentReadOnlyBanner({ reason }: { reason?: string | null | undefined }) {
  if (!reason) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
      <Lock size={18} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold">Read-only equipment record</div>
        <p className="mt-1">{reason}</p>
      </div>
    </div>
  );
}
