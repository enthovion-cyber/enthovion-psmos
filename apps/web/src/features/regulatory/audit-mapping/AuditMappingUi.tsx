'use client';

import Link from 'next/link';
import { RegulatoryAuditCoverageStatusBadge } from '../shared/RegulatoryAuditCoverageStatusBadge';
import { RegulatoryAuditMappingStatusBadge } from '../shared/RegulatoryAuditMappingStatusBadge';
import { RegulatoryAuditReadinessBadge } from '../shared/RegulatoryAuditReadinessBadge';
import { RegulatoryAuditStaleStatusBadge } from '../shared/RegulatoryAuditStaleStatusBadge';
import { RegulatoryAuditVerificationStatusBadge } from '../shared/RegulatoryAuditVerificationStatusBadge';
import { RegulatoryCard, RegulatoryEmptyState } from '../shared/RegulatoryUi';
import type { RegulatoryAuditMappingRow } from '../types/regulatory-audit-mapping.types';

export function valueText(value: unknown, fallback = 'Not Set') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function countOf(summary: Record<string, any> | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = summary?.[key];
    if (typeof value === 'number') return value;
  }
  return 0;
}

export function AuditMappingMiniList({ rows, empty = 'No backend rows for this panel.' }: { rows?: RegulatoryAuditMappingRow[] | undefined; empty?: string | undefined }) {
  if (!rows?.length) return <p className="text-sm text-[var(--psm-muted)]">{empty}</p>;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Link key={row.id} href={`/regulatory/audit-mapping/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-[var(--psm-fg)]">{valueText(row.mapping_code)} - {valueText(row.mapping_title, 'Untitled audit mapping')}</div>
              <div className="mt-1 text-xs text-[var(--psm-muted)]">{valueText(row.regulatory_source_type)} to {valueText(row.audit_target_type)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <RegulatoryAuditCoverageStatusBadge value={row.coverage_status} />
              <RegulatoryAuditVerificationStatusBadge value={row.verification_status} />
            </div>
          </div>
          {row.restricted ? <div className="mt-2 text-xs font-semibold text-danger">{row.restrictedReason}</div> : null}
        </Link>
      ))}
    </div>
  );
}

export function AuditMappingKeyValueGrid({ data, keys }: { data?: Record<string, any>; keys: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {keys.map(([label, key]) => (
        <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
          <div className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{label}</div>
          <div className="mt-2 text-sm font-semibold text-[var(--psm-fg)]">{valueText(data?.[key])}</div>
        </div>
      ))}
    </div>
  );
}

export function AuditMappingStatusStrip({ row }: { row?: RegulatoryAuditMappingRow | undefined }) {
  return (
    <div className="flex flex-wrap gap-2">
      <RegulatoryAuditMappingStatusBadge value={row?.mapping_status} />
      <RegulatoryAuditCoverageStatusBadge value={row?.coverage_status} />
      <RegulatoryAuditVerificationStatusBadge value={row?.verification_status} />
      <RegulatoryAuditReadinessBadge value={row?.audit_readiness_status} />
      <RegulatoryAuditStaleStatusBadge value={row?.stale_status} />
    </div>
  );
}

export function AuditMappingRecordTable({ rows }: { rows?: Record<string, any>[] | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No records" message="No backend records were returned for this audit mapping view." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]">
          <tr>
            {['Reference', 'Type', 'Status', 'Coverage', 'Readiness', 'Updated'].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row, index) => (
            <tr key={row.id ?? index} className="align-top">
              <td className="px-3 py-3 font-semibold text-[var(--psm-fg)]">{valueText(row.mapping_code ?? row.gap_code ?? row.snapshot_title ?? row.id)}</td>
              <td className="px-3 py-3 text-[var(--psm-muted)]">{valueText(row.audit_target_type ?? row.gap_type ?? row.link_type ?? row.snapshot_status)}</td>
              <td className="px-3 py-3"><RegulatoryAuditMappingStatusBadge value={row.mapping_status ?? row.gap_status ?? row.link_status ?? row.snapshot_status} /></td>
              <td className="px-3 py-3"><RegulatoryAuditCoverageStatusBadge value={row.coverage_status} /></td>
              <td className="px-3 py-3"><RegulatoryAuditReadinessBadge value={row.audit_readiness_status} /></td>
              <td className="px-3 py-3 text-[var(--psm-muted)]">{valueText(row.updated_at ?? row.created_at ?? row.calculated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditMappingJsonPanel({ title, value }: { title: string; value?: unknown }) {
  return (
    <RegulatoryCard title={title}>
      <pre className="max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">{JSON.stringify(value ?? {}, null, 2)}</pre>
    </RegulatoryCard>
  );
}
