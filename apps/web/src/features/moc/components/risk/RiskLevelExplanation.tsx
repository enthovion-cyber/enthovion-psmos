'use client';

import { Badge, DetailCard } from '../moc-detail-ui';

export function RiskLevelExplanation() {
  return (
    <DetailCard title="Risk Level Explanation">
      <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-4">
        <Band tone="green" label="Low" range="0-2" text="Standard controls and normal workflow." />
        <Band tone="amber" label="Medium" range="3-4" text="Overall rationale and focused review required." />
        <Band tone="red" label="High" range="5-7" text="HSE Director and VP Operations approval path." />
        <Band tone="purple" label="Critical" range="8-9" text="Management acceptance, HAZOP, PSSR, alert, and startup controls." />
      </div>
    </DetailCard>
  );
}

function Band({ tone, label, range, text }: { tone: 'green' | 'amber' | 'red' | 'purple'; label: string; range: string; text: string }) {
  return <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3"><div className="flex items-center justify-between"><Badge tone={tone}>{label}</Badge><span className="text-xs font-black text-slate-400">{range}</span></div><p className="mt-3 text-xs leading-5 text-slate-400">{text}</p></div>;
}
