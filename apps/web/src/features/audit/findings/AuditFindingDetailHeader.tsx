"use client";
import Link from "next/link";
import type { AuditFindingDetail } from "../types/audit-finding.types";
import { AuditButton, AuditCard } from "../shared/AuditUi";
import { AuditFindingCapaReadinessBadge } from "../shared/AuditFindingCapaReadinessBadge";
import { AuditFindingCriticalityBadge } from "../shared/AuditFindingCriticalityBadge";
import { AuditFindingEvidenceStatusBadge } from "../shared/AuditFindingEvidenceStatusBadge";
import { AuditFindingReviewStatusBadge } from "../shared/AuditFindingReviewStatusBadge";
import { AuditFindingStatusBadge } from "../shared/AuditFindingStatusBadge";

const tabs = [
  ["overview", "Overview"],
  ["source", "Source"],
  ["classification", "Classification"],
  ["evidence", "Evidence"],
  ["ownership", "Ownership"],
  ["linked-records", "Linked Records"],
  ["review", "Review"],
  ["capa-foundation", "CAPA Foundation"],
  ["history", "History"],
] as const;

export function AuditFindingDetailHeader({ detail, activeTab = "overview" }: { detail: AuditFindingDetail; activeTab?: string }) {
  const finding = detail.finding;
  return (
    <AuditCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{finding.finding_code}</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{finding.finding_title}</h1>
          <p className="mt-2 max-w-4xl text-sm text-[var(--psm-muted)]">{finding.finding_description ?? "No description has been saved yet."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AuditButton href={`/audit-compliance/findings/${finding.id}/edit`} variant="secondary">Edit</AuditButton>
          <AuditButton href="/audit-compliance/findings" variant="secondary">Register</AuditButton>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <AuditFindingStatusBadge value={finding.finding_status} />
        <AuditFindingReviewStatusBadge value={finding.review_status} />
        <AuditFindingCriticalityBadge value={finding.criticality} />
        <AuditFindingEvidenceStatusBadge value={finding.evidence_status} />
        <AuditFindingCapaReadinessBadge value={finding.capa_readiness_status} />
      </div>
      <nav className="mt-5 flex gap-2 overflow-x-auto">
        {tabs.map(([key, label]) => <Link key={key} href={`/audit-compliance/findings/${finding.id}${key === "overview" ? "" : `/${key}`}`} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${activeTab === key ? "border-primary bg-primary/10 text-primary" : "border-[var(--psm-line)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"}`}>{label}</Link>)}
      </nav>
    </AuditCard>
  );
}
