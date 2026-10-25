'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldAlert,
  Flame,
  Info,
} from 'lucide-react';

export function TrendDirectionBadge({
  direction,
  isFavorable,
  size = 'md',
}: {
  direction?: 'improving' | 'worsening' | 'stable' | 'volatile' | 'insufficient_data' | string | null;
  isFavorable?: boolean | null;
  size?: 'sm' | 'md';
}) {
  const d = (direction || 'insufficient_data').toLowerCase();
  const py = size === 'sm' ? 'py-0.5 text-[10px]' : 'py-1 text-xs';

  if (d === 'improving' || (isFavorable === true && d !== 'insufficient_data')) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 font-semibold text-emerald-500 ${py}`}>
        <TrendingUp size={size === 'sm' ? 12 : 14} />
        <span>Improving</span>
      </span>
    );
  }

  if (d === 'worsening' || (isFavorable === false && d !== 'insufficient_data')) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 font-semibold text-rose-500 ${py}`}>
        <TrendingDown size={size === 'sm' ? 12 : 14} />
        <span>Worsening</span>
      </span>
    );
  }

  if (d === 'volatile') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 font-semibold text-purple-400 ${py}`}>
        <Activity size={size === 'sm' ? 12 : 14} />
        <span>Volatile</span>
      </span>
    );
  }

  if (d === 'stable') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 font-semibold text-blue-400 ${py}`}>
        <Minus size={size === 'sm' ? 12 : 14} />
        <span>Stable</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-zinc-500/25 bg-zinc-500/10 px-2.5 font-medium text-zinc-400 ${py}`}>
      <HelpCircle size={size === 'sm' ? 12 : 14} />
      <span>Insufficient Data</span>
    </span>
  );
}

export function TrendDataQualityBadge({
  quality,
  score,
}: {
  quality?: string | null;
  score?: number | null;
}) {
  const q = quality || 'Verified';
  const color =
    /high|verified|complete|acceptable/i.test(q)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /partial|gap|interpolated|moderate/i.test(q)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /low|insufficient|missing|unavailable|unverified/i.test(q)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      <span>{q}</span>
      {typeof score === 'number' && <span className="opacity-75">({score}%)</span>}
    </span>
  );
}

export function TrendComparabilityBadge({
  comparability,
}: {
  comparability?: 'Comparable' | 'Partially Comparable' | 'Non-Comparable' | 'Fair Denominator Missing' | string | null;
}) {
  const c = comparability || 'Comparable';
  const color =
    /comparable$/i.test(c)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /partial/i.test(c)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : 'bg-rose-500/10 text-rose-500 border-rose-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {c}
    </span>
  );
}

export function RepeatIssueStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const s = status || 'Candidate';
  const color =
    /confirmed|active/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : /action linked|under action|under review/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /resolved|mitigated/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /false positive|rejected|dismissed/i.test(s)
      ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {/confirmed/i.test(s) && <Flame size={12} />}
      {s}
    </span>
  );
}

export function RecurringClusterStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const s = status || 'Detected';
  const color =
    /escalated|governance review|confirmed/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : /investigating|in progress/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /mitigated|closed/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function TrendAlertSeverityBadge({
  severity,
}: {
  severity?: string | null;
}) {
  const s = severity || 'Warning';
  const color =
    /critical|high/i.test(s)
      ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
      : /warning|medium/i.test(s)
      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
      : /watch/i.test(s)
      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
      : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${color}`}>
      {/critical/i.test(s) ? <ShieldAlert size={12} /> : /warning/i.test(s) ? <AlertTriangle size={12} /> : <Info size={12} />}
      {s}
    </span>
  );
}

export function TrendAlertStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const s = status || 'Triggered';
  const color =
    /resolved|closed/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /acknowledged|reviewing/i.test(s)
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : /escalated/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : /suppressed|dismissed/i.test(s)
      ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      : 'bg-rose-500/10 text-rose-500 border-rose-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function TrendRunStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const s = status || 'Pending';
  const color =
    /completed|success/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /running|in progress/i.test(s)
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : /stale/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /failed|error|cancelled/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function InsightCategoryBadge({
  category,
}: {
  category?: string | null;
}) {
  const c = category || 'Trend Insight';
  const color =
    /worsening|degradation/i.test(c)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : /repeat|recurring/i.test(c)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /sla|escalation/i.test(c)
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : /outlier|comparison/i.test(c)
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${color}`}>
      {c}
    </span>
  );
}
