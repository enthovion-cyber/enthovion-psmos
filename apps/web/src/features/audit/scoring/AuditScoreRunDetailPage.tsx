"use client";
import Link from "next/link";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditScoreRunDetailHeader } from "./AuditScoreRunDetailHeader";
import { ScoreRunOverviewTab } from "./tabs/ScoreRunOverviewTab";
import { useAuditScoreRunDetail } from "../hooks/useAuditScoreRunDetail";

const tabs = ["overview", "input-snapshot", "results", "explainability", "traceability", "adjustments", "history"] as const;
export function AuditScoreRunDetailPage({ runId, activeTab = "overview" }: { runId: string; activeTab?: typeof tabs[number] }) {
  const query = useAuditScoreRunDetail(runId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  return <AuditLayout><div className="space-y-5"><AuditScoreRunDetailHeader run={data.scoreRun} /><AuditCard><div className="flex flex-wrap gap-2">{tabs.map((tab) => <Link key={tab} className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === tab ? "bg-primary text-white" : "bg-[var(--psm-surface-2)] text-[var(--psm-muted)]"}`} href={`/audit-compliance/scoring/runs/${runId}${tab === "overview" ? "" : `/${tab}`}`}>{tab.replaceAll("-", " ")}</Link>)}</div></AuditCard><ScoreRunOverviewTab detail={data} activeTab={activeTab} /></div></AuditLayout>;
}
