import { Inbox } from 'lucide-react';

export function MiEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-[var(--psm-line)] p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[var(--psm-surface-3)] text-[var(--psm-muted)]"><Inbox size={22} /></div>
        <div className="mt-4 font-semibold">{title}</div>
        <p className="mt-2 max-w-md text-sm text-[var(--psm-muted)]">{description}</p>
      </div>
    </div>
  );
}
