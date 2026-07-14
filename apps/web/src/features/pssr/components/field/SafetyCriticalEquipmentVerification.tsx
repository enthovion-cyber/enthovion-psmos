'use client';

import { PSSRCard } from '../pssr-ui';

export function SafetyCriticalEquipmentVerification() {
  const items = ['PSV installed and tagged', 'Rupture disc installed if applicable', 'ESD valve tested/position verified', 'Fire and gas detectors installed', 'Interlocks available', 'Alarm devices installed', 'Emergency shutdown stations accessible', 'Safety guards installed', 'Relief devices not isolated', 'Safety critical inspection complete'];
  return <PSSRCard title="Safety-Critical Equipment Verification"><div className="grid gap-2 md:grid-cols-2">{items.map((item) => <div key={item} className="rounded-lg border border-red-300/10 bg-red-500/5 px-3 py-2 text-sm font-bold text-red-50">{item}</div>)}</div></PSSRCard>;
}
