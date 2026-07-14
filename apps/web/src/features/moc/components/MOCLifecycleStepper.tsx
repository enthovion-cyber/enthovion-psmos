'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';

const lifecycle = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Implementation', 'Pending PSSR', 'Ready For Startup', 'Closed'];

export function MOCLifecycleStepper({ status }: { status: string }) {
  const activeIndex = Math.max(0, lifecycle.indexOf(status));
  return (
    <section className="border-b border-cyan-300/10 bg-[#04101f] px-5 py-4">
      <div className="grid gap-2 lg:grid-cols-8">
        {lifecycle.map((item, index) => {
          const complete = index < activeIndex || status === 'Closed';
          const active = index === activeIndex;
          return (
            <div key={item} className={`rounded-lg border p-3 ${active ? 'border-blue-300/60 bg-blue-500/15' : complete ? 'border-emerald-300/30 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="flex items-center gap-2">
                {complete ? <CheckCircle2 size={16} className="text-emerald-300" /> : active ? <Clock size={16} className="text-blue-300" /> : <Circle size={16} className="text-slate-500" />}
                <span className="text-xs font-black text-white">{item}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
