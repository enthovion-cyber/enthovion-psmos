'use client';

export function TechnicalDataSummaryCards({ data }: { data: Record<string, any> }) {
  const completeness = data.completeness ?? {};
  const cards = [
    ['Completeness', `${completeness.score ?? 0}%`],
    ['Missing Required Fields', String(Array.isArray(completeness.missing) ? completeness.missing.length : 0)],
    ['Design Basis', data.designData?.designCode ?? 'Not set'],
    ['Material', data.materialsCorrosion?.materialOfConstruction ?? 'Not set'],
    ['Service Fluid', data.processFluidChemical?.serviceFluid ?? 'Not set'],
    ['Safety Critical', data.safetyCriticalAttributes?.safetyCritical ? 'Yes' : 'No']
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm"><p className="text-xs font-bold uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-2 text-xl font-bold text-[var(--psm-text)]">{String(value)}</p></div>)}</div>;
}
