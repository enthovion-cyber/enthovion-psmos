"use client";
import Link from "next/link";
import { AuditButton, AuditCard } from "../shared/AuditUi";
import { AuditMappingHealthBadge } from "../components/shared/AuditMappingHealthBadge";
import { AuditMappingStatusBadge } from "../components/shared/AuditMappingStatusBadge";
import { AuditMappingStaleBadge } from "../components/shared/AuditMappingStaleBadge";
import { useAuditMappingMutations } from "../hooks/useAuditMappingMutations";
import type { AuditStandardMappingDetail } from "../types/audit-standard-mapping.types";

export function AuditMappingDetailHeader({ detail }: { detail: AuditStandardMappingDetail }) {
  const mutations = useAuditMappingMutations();
  const blockers = detail.readiness?.blockers ?? [];
  const verifyReason = blockers.length ? blockers.map((b: Record<string, any>) => b.title).join(", ") : "Verify mapping";
  return <AuditCard><div className="flex flex-wrap items-start justify-between gap-4">
    <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Standards Mapping</p><h1 className="mt-2 text-2xl font-bold">{detail.mapping.mapping_code} - {detail.mapping.mapping_title}</h1><div className="mt-3 flex flex-wrap gap-2"><AuditMappingStatusBadge value={detail.mapping.mapping_status} /><AuditMappingHealthBadge value={detail.mapping.mapping_health_status} /><AuditMappingStaleBadge value={detail.mapping.stale_status} /></div></div>
    <div className="flex flex-wrap gap-2"><AuditButton href={`/audit-compliance/standards-mapping/${detail.mapping.id}/edit`} variant="secondary">Edit</AuditButton><AuditButton onClick={() => mutations.recalculate.mutate(detail.mapping.id)} disabled={mutations.recalculate.isPending} title="Recalculate coverage from backend linked records" variant="secondary">Recalculate</AuditButton><AuditButton onClick={() => mutations.transition.mutate({ id: detail.mapping.id, action: "verify" })} disabled={Boolean(blockers.length) || mutations.transition.isPending} title={verifyReason}>Verify</AuditButton><AuditButton onClick={() => mutations.snapshotTraceability.mutate(detail.mapping.id)} disabled={mutations.snapshotTraceability.isPending} title="Generate immutable traceability snapshot" variant="secondary">Snapshot</AuditButton></div>
  </div><nav className="mt-5 flex flex-wrap gap-2 text-sm">{["overview", "source", "linked-records", "coverage", "evidence", "findings", "capa", "scoring", "traceability", "history"].map((tab) => <Link key={tab} href={`/audit-compliance/standards-mapping/${detail.mapping.id}/${tab}`} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 capitalize hover:bg-[var(--psm-surface-2)]">{tab.replace("-", " ")}</Link>)}</nav></AuditCard>;
}
