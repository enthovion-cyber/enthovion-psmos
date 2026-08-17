export function EquipmentSavedViews({ views, onSelect }: { views: string[]; onSelect: (view: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {views.map((view) => <button key={view} type="button" className="shrink-0 rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--psm-surface-2)]" onClick={() => onSelect(view)}>{view}</button>)}
    </div>
  );
}
