'use client';

import { Badge, PSSRCard } from '../pssr-ui';

export function TrafficLightStartupPunchChecklist({ lights }: { lights: any[] }) {
  const tone = (status: string) => status === 'Green' ? 'green' : status === 'Red' ? 'red' : status === 'Amber' ? 'amber' : 'slate';
  return <PSSRCard title="Traffic Light Startup Punch Checklist"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{lights.map((item) => <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="font-bold text-white">{item.label}</p><Badge tone={tone(item.status) as any}>{item.status}</Badge></div>)}</div></PSSRCard>;
}
