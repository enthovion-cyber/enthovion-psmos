'use client';

import { CheckCircle2 } from 'lucide-react';

const stages = ['Draft', 'Created', 'In Preparation', 'In Review', 'Field Verification', 'Punch List Open', 'Ready For Authorization', 'Authorized For Startup', 'Startup Released', 'Closed'];

export function PSSRLifecycleStepper({ status }: { status: string }) {
  const current = Math.max(stages.indexOf(status), 0);
  return <section className="overflow-x-auto rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-4"><div className="flex min-w-[980px] items-center gap-2">{stages.map((stage, index) => <div key={stage} className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 ${index <= current ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/[0.03] text-slate-500'}`}><CheckCircle2 size={15} /><span className="text-xs font-black">{stage}</span></div>)}</div></section>;
}
