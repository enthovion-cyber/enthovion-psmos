'use client';

type Props = {
  search: string;
  eventType: string;
  module: string;
  onSearchChange: (value: string) => void;
  onEventTypeChange: (value: string) => void;
  onModuleChange: (value: string) => void;
};

export function MiHistoryFilters({ search, eventType, module, onSearchChange, onEventTypeChange, onModuleChange }: Props) {
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-3">
      <label className="text-sm font-medium text-[var(--psm-text)]">
        Search history
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Equipment, event title, record number"
          className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--psm-accent)]"
        />
      </label>
      <label className="text-sm font-medium text-[var(--psm-text)]">
        Event type
        <input
          value={eventType}
          onChange={(event) => onEventTypeChange(event.target.value)}
          placeholder="Created, updated, approved..."
          className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--psm-accent)]"
        />
      </label>
      <label className="text-sm font-medium text-[var(--psm-text)]">
        Module
        <input
          value={module}
          onChange={(event) => onModuleChange(event.target.value)}
          placeholder="Inspection, PSV, Work order..."
          className="mt-2 w-full rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--psm-accent)]"
        />
      </label>
    </section>
  );
}
