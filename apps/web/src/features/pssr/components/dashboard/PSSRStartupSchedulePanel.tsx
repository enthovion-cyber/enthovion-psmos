'use client';

import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PSSRStartupSchedulePanel({ rows }: { rows: any[] }) {
  return (
    <PSSRCard title="Startup Schedule" action={<CalendarClock size={16} className="text-blue-200" />}>
      <div className="space-y-3">
        {(rows ?? []).length ? rows.map((item) => (
          <div key={item.id} className="rounded-lg border border-cyan-300/10 bg-slate-950/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/pssr/${item.id}`} className="font-black text-blue-200">{item.pssr_number}</Link>
                <p className="mt-1 text-sm font-bold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.unitName} · {item.areaName} · {item.primaryEquipmentTag}</p>
              </div>
              <Badge tone={item.scheduleStatus === 'Overdue' || item.scheduleStatus === 'Startup Blocked' ? 'red' : item.scheduleStatus === 'Within 24 Hours' ? 'amber' : 'blue'}>{item.scheduleStatus}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
              <span>{item.target_startup_at ? new Date(item.target_startup_at).toLocaleString() : '-'}</span>
              <span>{item.readinessStatus} · {item.readinessPercent}%</span>
              <span>{item.openBlockersCount} blockers · {item.authorization_status}</span>
            </div>
          </div>
        )) : <EmptyState title="No scheduled startups" detail="Upcoming, overdue, ready, and authorized PSSRs appear here." />}
      </div>
    </PSSRCard>
  );
}
