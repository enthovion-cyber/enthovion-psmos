'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  IdCard,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench
} from 'lucide-react';
import type { CopilotCardGate, CopilotRecordCard } from '../types';

interface CopilotRecordCardsProps {
  cards?: CopilotRecordCard[] | undefined;
}

function getStatusBadgeClasses(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('SUSPEND') || s.includes('HOLD') || s.includes('REVIEW') || s.includes('PUNCH')) {
    return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
  }
  if (s.includes('REJECT') || s.includes('CANCEL') || s.includes('EXPIRED') || s.includes('BLOCK') || s.includes('FAIL')) {
    return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
  }
  if (s.includes('ACTIVE') || s.includes('ISSUED') || s.includes('APPROVED') || s.includes('RELEASED') || s.includes('AUTHORIZED') || s.includes('SERVICE')) {
    return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
  }
  return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
}

function getRiskBadgeClasses(risk: string): string {
  const r = risk.toUpperCase();
  if (r.includes('CRITICAL') || r.includes('HIGH') || r.includes('EXTREME')) {
    return 'bg-rose-950/90 text-rose-200 border-rose-500/50';
  }
  if (r.includes('MED') || r.includes('MODERATE')) {
    return 'bg-amber-950/80 text-amber-200 border-amber-500/40';
  }
  return 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40';
}

function getGateClasses(tone: CopilotCardGate['tone']): {
  box: string;
  value: string;
} {
  switch (tone) {
    case 'emerald':
      return {
        box: 'bg-[#09221e]/90 border-emerald-500/35 hover:border-emerald-400/50',
        value: 'text-emerald-400'
      };
    case 'rose':
      return {
        box: 'bg-[#2a121b]/90 border-rose-500/40 hover:border-rose-400/60',
        value: 'text-rose-400'
      };
    case 'amber':
      return {
        box: 'bg-[#271d0c]/90 border-amber-500/40 hover:border-amber-400/60',
        value: 'text-amber-300'
      };
    case 'blue':
      return {
        box: 'bg-[#0c1b33]/90 border-blue-500/35 hover:border-blue-400/50',
        value: 'text-blue-300'
      };
    default:
      return {
        box: 'bg-[#0e172a]/90 border-slate-700/70 hover:border-slate-600',
        value: 'text-slate-200'
      };
  }
}

export function CopilotRecordCards({ cards }: CopilotRecordCardsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="space-y-4 mb-4">
      {cards.map((card) => (
        <div
          key={`${card.module}-${card.recordId}`}
          className="rounded-xl border border-slate-800/90 bg-[#080f1e] p-3.5 sm:p-4 shadow-xl space-y-3.5 text-slate-100"
        >
          {/* 1. OVERVIEW & OPERATIONAL STATUS CARD */}
          <div className="rounded-xl border border-slate-800/90 bg-[#0b1324] p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {card.title}
                </h3>
                {card.statusStep && (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {card.module} Operational Telemetry · {card.statusStep}
                  </p>
                )}
              </div>
              <Link
                href={card.url}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20 transition shrink-0"
              >
                <span>Open {card.recordNumber}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Status, Risk, Work/Change Type & Validity Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${getStatusBadgeClasses(
                  card.status
                )}`}
              >
                <Clock className="w-3 h-3" />
                {card.status}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ${getRiskBadgeClasses(
                  card.riskLevel
                )}`}
              >
                {card.riskLevel}
              </span>

              {card.workOrChangeType && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-900/90 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-300 uppercase">
                  <Wrench className="w-2.5 h-2.5 text-sky-400" />
                  {card.workOrChangeType}
                </span>
              )}

              {card.validity && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono font-semibold ${
                    card.validity.toLowerCase().includes('expired')
                      ? 'border-rose-500/40 bg-rose-950/60 text-rose-300'
                      : 'border-slate-700/80 bg-slate-900/80 text-slate-300'
                  }`}
                >
                  {card.validity}
                </span>
              )}
            </div>

            {/* Activity Headline */}
            {card.subtitle && (
              <div className="text-xs sm:text-[13px] font-semibold text-slate-100 pt-0.5">
                Activity: <span className="font-normal text-slate-200">{card.subtitle}</span>
              </div>
            )}

            {/* Structured Bullet List */}
            <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc marker:text-slate-500">
              {card.overviewBullets.map((b, idx) => (
                <li key={idx} className="leading-snug">
                  <strong className="text-white font-semibold">{b.label}:</strong>{' '}
                  <span className="text-slate-300">{b.value}</span>
                </li>
              ))}
            </ul>

            {/* Location & Personnel Sub-section */}
            <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-slate-200 tracking-wide">
                Location &amp; Personnel Details
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-[#1f1610] px-2.5 py-1.5 text-xs text-amber-200/90">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-white">Area:</strong> {card.locationDetails.area}
                    {card.locationDetails.equipment ? ` · ${card.locationDetails.equipment}` : ''}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-[#0f1b31] px-2.5 py-1.5 text-xs text-blue-200/90">
                  <IdCard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>
                    <strong className="text-white">
                      {card.module === 'PTW'
                        ? 'Permit Holder:'
                        : card.module === 'MOC'
                          ? 'Originator:'
                          : 'Lead:'}
                    </strong>{' '}
                    {card.locationDetails.holderOrOwner}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ACTION GATES & SYSTEM CHECKS GRID */}
          <div className="rounded-xl border border-slate-800/90 bg-[#0b1324] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Action Gates &amp; System Checks
              </h4>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Real-Time Interlock Status
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {card.actionGates.map((gate, idx) => {
                const style = getGateClasses(gate.tone);
                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-2.5 transition flex flex-col justify-between ${style.box}`}
                  >
                    <div>
                      <div className="text-[11px] font-medium text-slate-300">{gate.label}</div>
                      <div className={`text-xs sm:text-sm font-bold mt-0.5 ${style.value}`}>
                        {gate.value}
                      </div>
                    </div>
                    {gate.subtext && (
                      <div className="mt-1.5 text-[10px] font-mono leading-tight text-slate-300/90">
                        {gate.subtext}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. REQUIRED ACTIONS BEFORE RESUMING WORK / PROCEEDING */}
          {card.requiredActions && card.requiredActions.length > 0 && (
            <div className="rounded-xl border border-slate-800/90 bg-[#0b1324] p-3.5 space-y-2.5">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {card.module === 'PTW'
                  ? 'Required Actions Before Resuming Work'
                  : card.module === 'MOC'
                    ? 'Required Actions Before Implementation / PSSR'
                    : card.module === 'PSSR'
                      ? 'Required Actions Before Startup Authorization'
                      : 'Required Engineering Actions'}
              </h4>
              <ul className="space-y-2">
                {card.requiredActions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                    {act.severity === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : act.severity === 'warning' ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="text-white font-semibold">{act.title}:</strong>{' '}
                      <span className="text-slate-300">{act.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
