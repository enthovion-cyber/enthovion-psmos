import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function DialogShell({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <section className="max-h-[92vh] w-full overflow-auto rounded-t-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[var(--psm-surface-2)]" aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export function DialogField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium"><span className="mb-1 block">{label}</span>{children}</label>;
}
