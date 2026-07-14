'use client';

import { AlertTriangle, Flame, Moon, ShieldCheck, TestTube2, Wrench } from 'lucide-react';

const items = [
  { label: 'Permit', icon: <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-500 text-[10px] font-black text-white">P</span> },
  { label: 'Equipment', icon: <Wrench size={15} className="text-cyan-300" /> },
  { label: 'Conflict', icon: <AlertTriangle size={15} className="text-red-300" /> },
  { label: 'Gas Warning', icon: <TestTube2 size={15} className="text-amber-300" /> },
  { label: 'Isolation', icon: <ShieldCheck size={15} className="text-emerald-300" /> },
  { label: 'Handover', icon: <Moon size={15} className="text-purple-300" /> },
  { label: 'Hot Work', icon: <Flame size={15} className="text-orange-300" /> }
];

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-cyan-300/10 bg-slate-950/55 p-2 text-xs text-slate-300">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}
