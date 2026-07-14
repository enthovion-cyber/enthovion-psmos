'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Clock, MapPin, ShieldAlert, TestTube2 } from 'lucide-react';
import type { PTWMapPermitItem } from '../../services/ptw-map.service';
import { formatDateTime, statusTone } from './map-utils';

export function SelectedPermitPreview({ permit }: { permit: PTWMapPermitItem | null | undefined }) {
  if (!permit) {
    return (
      <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3 text-sm text-slate-400">
        Click a permit marker to open the permit preview. Use Open Detail for the full PTW record.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-blue-300/20 bg-blue-500/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-200">Selected Permit</p>
          <h3 className="mt-1 text-lg font-black text-white">{permit.permit_number}</h3>
          <p className="text-sm text-slate-300">{permit.permit_title}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusTone(permit.status)}`}>{permit.status}</span>
      </div>
      <div className="mt-4 space-y-2 text-xs text-slate-300">
        <Row icon={<MapPin size={14} />} label="Area" value={`${permit.unit_name ?? '-'} / ${permit.area_name ?? '-'}`} />
        <Row icon={<ShieldAlert size={14} />} label="Risk" value={`${permit.risk_level}${permit.has_conflict ? ' / Conflict' : ''}`} />
        <Row icon={<TestTube2 size={14} />} label="Gas / Isolation" value={`${permit.gas_status} / ${permit.isolation_status}`} />
        <Row icon={<Clock size={14} />} label="Window" value={`${formatDateTime(permit.planned_start)} - ${formatDateTime(permit.planned_end)}`} />
      </div>
      <Link href={`/ptw/${permit.permit_id}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-blue-300/30 bg-blue-500/15 px-3 py-2 text-sm font-bold text-blue-100 transition hover:bg-blue-500/25">
        Open Detail <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5">
      <span className="inline-flex items-center gap-2 text-slate-400">{icon}{label}</span>
      <span className="text-right font-semibold text-slate-100">{value}</span>
    </div>
  );
}
