'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PunchActionDetailDrawer({ item }: { item?: any }) {
  return <PSSRCard title="Action Detail Drawer">{item ? <div className="space-y-2 text-sm"><p className="text-xl font-black text-white">{item.punch_number} · {item.title}</p><p className="text-slate-400">{item.description}</p><div className="flex flex-wrap gap-2"><Badge>Action {item.linked_action_id ?? 'Not linked'}</Badge><Badge tone={item.category === 'A' ? 'red' : 'amber'}>Category {item.category}</Badge><Badge>{item.status}</Badge></div></div> : <EmptyState title="Select a punch item" detail="Details, evidence, comments, history, and risk acceptance appear here." />}</PSSRCard>;
}
