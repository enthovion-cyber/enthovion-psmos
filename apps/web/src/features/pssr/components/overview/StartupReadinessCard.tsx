'use client';

import { AlertTriangle, CheckCircle2, ClipboardCheck, FileCheck2, GraduationCap, ShieldCheck, Wrench } from 'lucide-react';
import { Badge, ProgressBar, PSSRCard } from '../pssr-ui';

export function StartupReadinessCard({ pssr }: { pssr: any }) {
  const summary = pssr.summary ?? {};
  const items = [
    { label: 'Checklist', value: summary.checklistCompletion ?? 0, icon: ClipboardCheck },
    { label: 'Documents', value: summary.documentReadiness ?? 0, icon: FileCheck2 },
    { label: 'Training', value: summary.trainingReadiness ?? 0, icon: GraduationCap },
    { label: 'Testing', value: summary.testingReadiness ?? 0, icon: Wrench },
    { label: 'Punch Items', value: summary.punchItemReadiness ?? 0, icon: AlertTriangle },
    { label: 'Authorization', value: summary.authorizationReadiness ?? 0, icon: ShieldCheck }
  ];
  return (
    <PSSRCard title="Startup Readiness">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const tone = item.value >= 90 ? 'green' : item.value >= 70 ? 'amber' : 'red';
          return (
            <div key={item.label} className="rounded-lg border border-white/10 bg-slate-950/30 p-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300"><Icon size={16} /> {item.label}</span>
                <Badge tone={tone}>{item.value}%</Badge>
              </div>
              <div className="mt-3"><ProgressBar value={item.value} tone={tone} /></div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-emerald-300/10 bg-emerald-500/10 p-3 text-sm text-emerald-100">
        <div className="flex items-center gap-2 font-black"><CheckCircle2 size={16} /> Readiness logic</div>
        <p className="mt-1 text-emerald-100/80">Startup release requires required checklist completion, blocker closure, document readiness, training readiness, testing verification, and authorization.</p>
      </div>
    </PSSRCard>
  );
}
