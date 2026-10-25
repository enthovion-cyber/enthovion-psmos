'use client';

import React from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Layers,
  FileSpreadsheet,
  FileCode,
  Sliders,
  Presentation,
  Archive,
  Ban,
  Download,
} from 'lucide-react';
import type {
  ExecutiveReportStatus,
  ExecutiveReportReadinessStatus,
  ExecutiveReportApprovalStatus,
  ExecutiveReportPublicationStatus,
  ExecutiveReportConfidentiality,
  ExecutiveReportFormat,
} from '../types/executive-report.types';

export function ReportStatusBadge({
  status,
  size = 'md',
}: {
  status?: ExecutiveReportStatus | string | null;
  size?: 'sm' | 'md';
}) {
  const s = status || 'Draft';
  const py = size === 'sm' ? 'py-0.5 text-[10px]' : 'py-1 text-xs';

  if (/published/i.test(s)) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 font-bold text-emerald-500 ${py}`}>
        <CheckCircle2 size={size === 'sm' ? 12 : 14} />
        <span>Published</span>
      </span>
    );
  }

  if (/approved/i.test(s)) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 font-bold text-blue-400 ${py}`}>
        <ShieldCheck size={size === 'sm' ? 12 : 14} />
        <span>Approved</span>
      </span>
    );
  }

  if (/under review|review/i.test(s)) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 font-semibold text-purple-400 ${py}`}>
        <Clock size={size === 'sm' ? 12 : 14} />
        <span>Under Review</span>
      </span>
    );
  }

  if (/stale/i.test(s)) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 font-semibold text-amber-500 ${py}`}>
        <AlertTriangle size={size === 'sm' ? 12 : 14} />
        <span>Stale</span>
      </span>
    );
  }

  if (/archived/i.test(s)) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-zinc-500/25 bg-zinc-500/10 px-2.5 font-medium text-zinc-400 ${py}`}>
        <Archive size={size === 'sm' ? 12 : 14} />
        <span>Archived</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-zinc-500/25 bg-zinc-500/10 px-2.5 font-medium text-zinc-400 ${py}`}>
      <FileText size={size === 'sm' ? 12 : 14} />
      <span>Draft</span>
    </span>
  );
}

export function ReportReadinessBadge({
  readiness,
}: {
  readiness?: ExecutiveReportReadinessStatus | string | null;
}) {
  const r = readiness || 'Not Validated';
  const color =
    /ready$/i.test(r)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /warning/i.test(r)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /missing|not ready/i.test(r)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {/ready$/i.test(r) ? <CheckCircle2 size={12} /> : /warning/i.test(r) ? <AlertTriangle size={12} /> : null}
      <span>{r}</span>
    </span>
  );
}

export function ReportApprovalBadge({
  status,
}: {
  status?: ExecutiveReportApprovalStatus | string | null;
}) {
  const s = status || 'Not Requested';
  const color =
    /approved/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /pending/i.test(s)
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : /rejected/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function ReportPublicationBadge({
  status,
}: {
  status?: ExecutiveReportPublicationStatus | string | null;
}) {
  const s = status || 'Not Published';
  const color =
    /published$/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /superseded/i.test(s)
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : /withdrawn/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}

export function ReportConfidentialityBadge({
  level,
}: {
  level?: ExecutiveReportConfidentiality | string | null;
}) {
  const l = level || 'Internal';
  const color =
    /board/i.test(l)
      ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
      : /restricted/i.test(l)
      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
      : /confidential/i.test(l)
      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${color}`}>
      <Lock size={11} />
      <span>{l}</span>
    </span>
  );
}

export function ReportFormatBadge({
  format,
}: {
  format?: ExecutiveReportFormat | string | null;
}) {
  const f = (format || 'PDF').toUpperCase();
  const Icon =
    f === 'PDF'
      ? FileText
      : f === 'XLSX' || f === 'CSV'
      ? FileSpreadsheet
      : f === 'PPTX'
      ? Presentation
      : Layers;

  return (
    <span className="inline-flex items-center gap-1 rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--psm-text)]">
      <Icon size={12} className="text-[var(--psm-primary)]" />
      <span>{f}</span>
    </span>
  );
}

export function ReportArtifactStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const s = status || 'Queued';
  const color =
    /completed/i.test(s)
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : /generating/i.test(s)
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : /failed/i.test(s)
      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {s}
    </span>
  );
}
