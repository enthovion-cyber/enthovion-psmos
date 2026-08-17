export function NfpaDiamondMini({ health, fire, reactivity, special }: { health?: number | string | null; fire?: number | string | null; reactivity?: number | string | null; special?: string | null }) {
  return (
    <div className="grid w-20 grid-cols-3 grid-rows-3 text-center text-[10px] font-bold">
      <span />
      <span className="rounded border border-[var(--psm-line)] bg-danger/15 p-1 text-danger">{fire ?? '-'}</span>
      <span />
      <span className="rounded border border-[var(--psm-line)] bg-info/15 p-1 text-info">{health ?? '-'}</span>
      <span className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-1">{special ?? '-'}</span>
      <span className="rounded border border-[var(--psm-line)] bg-warning/15 p-1 text-warning">{reactivity ?? '-'}</span>
      <span />
      <span />
      <span />
    </div>
  );
}
