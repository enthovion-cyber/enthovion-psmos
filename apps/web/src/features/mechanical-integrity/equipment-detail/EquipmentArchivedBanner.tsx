import { Archive } from 'lucide-react';

export function EquipmentArchivedBanner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-400/30 bg-slate-500/10 p-4 text-sm text-slate-700 dark:text-slate-200">
      <Archive size={18} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold">Archived or decommissioned</div>
        <p className="mt-1">This asset remains visible for history, linked records, certificates, and audit traceability. Mutations are disabled until reactivated by an authorized user.</p>
      </div>
    </div>
  );
}
