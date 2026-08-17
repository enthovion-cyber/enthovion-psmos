import { X } from 'lucide-react';
import { useEquipmentImport } from '../hooks/useEquipmentImport';

export function EquipmentImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { templateColumns } = useEquipmentImport();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Import Equipment</h2><p className="mt-1 text-sm text-[var(--psm-muted)]">CSV/XLSX import foundation. Backend validation and commit endpoints are reserved for the import workflow.</p></div><button onClick={onClose} className="rounded p-2 hover:bg-[var(--psm-surface-2)]"><X size={18} /></button></div>
        <div className="mt-4 rounded-lg border border-[var(--psm-line)] p-3">
          <div className="text-sm font-semibold">Template columns</div>
          <div className="mt-2 flex flex-wrap gap-2">{templateColumns.map((column) => <span key={column} className="rounded border border-[var(--psm-line)] px-2 py-1 text-xs">{column}</span>)}</div>
        </div>
      </div>
    </div>
  );
}
