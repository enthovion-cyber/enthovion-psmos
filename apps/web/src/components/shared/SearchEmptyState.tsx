import { Search } from 'lucide-react';

export function SearchEmptyState({ title = 'No results found', description = 'Try another tag, action number, person, role, site, unit, or area.' }: { title?: string; description?: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--psm-surface-3)] text-[var(--psm-muted)]">
        <Search size={22} />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--psm-muted)]">{description}</p>
    </div>
  );
}
