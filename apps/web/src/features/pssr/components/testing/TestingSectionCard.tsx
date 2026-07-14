'use client';

import { Badge, PSSRCard } from '../pssr-ui';

export function TestingSectionCard({ title, section }: { title: string; section: any }) {
  return <PSSRCard title={title}><div className="flex items-center justify-between"><div><p className="text-3xl font-black text-white">{section?.completed ?? 0}/{section?.required ?? 0}</p><p className="text-sm text-slate-400">Completed required tests</p></div><Badge tone={section?.failed ? 'red' : section?.completed >= section?.required && section?.required ? 'green' : 'amber'}>{section?.failed ? `${section.failed} Failed` : 'In Control'}</Badge></div><div className="mt-3 space-y-2">{(section?.records ?? []).slice(0, 4).map((item: any) => <div key={item.id} className="flex items-center justify-between rounded-md bg-slate-950/30 px-3 py-2 text-sm"><span className="font-bold text-slate-200">{item.test_title}</span><Badge tone={item.status === 'Passed' ? 'green' : item.status === 'Failed' ? 'red' : 'blue'}>{item.status}</Badge></div>)}</div></PSSRCard>;
}
