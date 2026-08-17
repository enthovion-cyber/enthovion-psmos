'use client';

export function TechnicalDataChangeImpactDialog({ open, impact, onClose }: { open: boolean; impact?: Record<string, unknown> | null; onClose: () => void }) {
  if (!open) return null;
  const impacts = Array.isArray(impact?.impacts) ? impact.impacts as string[] : [];
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-xl"><h3 className="text-lg font-bold text-[var(--psm-text)]">Technical Change Impact</h3>{impacts.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--psm-muted)]">{impacts.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-3 text-sm text-[var(--psm-muted)]">No special impact was returned by the backend.</p>}<button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onClose}>Close</button></div></div>;
}
