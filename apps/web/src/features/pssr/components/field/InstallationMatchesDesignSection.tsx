'use client';

import { PSSRCard } from '../pssr-ui';

export function InstallationMatchesDesignSection() {
  const items = ['P&ID matches field installation', 'Datasheet matches installed equipment', 'Drawing revision used in field', 'Pipe routing matches design', 'Instrument installation matches loop drawing', 'Electrical installation matches approved drawing', 'Safety system installation matches cause & effect', 'Relief system installed correctly', 'Hazardous area requirements met'];
  return <Checklist title="Installation Matches Design" items={items} />;
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return <PSSRCard title={title}><div className="grid gap-2 md:grid-cols-2">{items.map((item) => <div key={item} className="rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2 text-sm font-bold text-slate-300">{item}</div>)}</div></PSSRCard>;
}
