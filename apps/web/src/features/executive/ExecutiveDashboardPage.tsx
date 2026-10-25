"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { executiveApi } from "./services/executive-api";
import {
  useExecutiveAggregation,
  useExecutiveDashboard,
} from "./hooks/useExecutiveDashboard";
import { ExecutiveDashboardHeader } from "./components/ExecutiveDashboardHeader";
import { ExecutiveSummaryCards } from "./components/ExecutiveSummaryCards";
import { ExecutiveCriticalAttentionPanel } from "./components/ExecutiveCriticalAttentionPanel";
import { ExecutiveModuleHealthGrid } from "./components/ExecutiveModuleHealthGrid";
import { ExecutiveSitePerformanceTable } from "./components/ExecutiveSitePerformanceTable";
import { ExecutiveOpenCriticalActionsPanel } from "./components/ExecutiveOpenCriticalActionsPanel";
import { ExecutivePendingApprovalsPanel } from "./components/ExecutivePendingApprovalsPanel";
import { ExecutiveStaleRecordsPanel } from "./components/ExecutiveStaleRecordsPanel";
import { ExecutiveRegulatoryAuditComplianceSummary } from "./components/ExecutiveRegulatoryAuditComplianceSummary";
import { ExecutiveIncidentMiTrainingSummary } from "./components/ExecutiveIncidentMiTrainingSummary";
import { ExecutiveManagementReviewPreview } from "./components/ExecutiveManagementReviewPreview";
import { ExecutiveSourceHealthPanel } from "./components/ExecutiveSourceHealthPanel";
import { ExecutivePresentationPreview } from "./components/ExecutivePresentationPreview";
import { useMyPermissions } from "@/features/iam/hooks/useIam";
import {
  ExecutiveLeadershipPulse,
  ExecutiveOverviewNavigation,
} from "./components/ExecutiveOverview";
import {
  ExecutiveHealthRadarInfographic,
  ExecutiveCrossModuleChart,
  ExecutiveAlertDonutChart,
  ExecutiveSiteBenchmarkChart,
  ExecutiveTrendAreaChart,
} from "./components/charts";

import { hasLocalSession } from "@/services/api";
import { RefreshCw } from "lucide-react";

function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const loggedIn = hasLocalSession();
  const defaultPermissions = new Set([
    "executive.dashboard.view",
    "executive.aggregation.history.view",
    "executive.module_health.view",
    "executive.critical_alert.view",
    "executive.site_performance.view",
    "executive.critical_risk.dashboard.view",
    "executive.psm_element.dashboard.view",
    "executive.performance.dashboard.view",
    "executive.management_review.dashboard.view",
    "executive.source_config.view",
    "executive.aggregation_error.view",
  ]);

  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={defaultPermissions} />
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[var(--psm-primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--psm-primary)]">
                Executive Command Center
              </span>
              <span className="text-xs text-[var(--psm-muted)]">Phase 1 Foundation</span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-[var(--psm-text)]">
              {!loggedIn
                ? "PSM OS Executive KPI Cockpit"
                : status === 403
                ? "Executive Dashboard Access Restricted"
                : "Executive Dashboard Connection"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--psm-muted)] leading-relaxed">
              {!loggedIn
                ? "Sign in with an authorized account to load live cross-module metrics, site performance, and regulatory health from plant databases."
                : status === 403
                ? "Your active user role does not include the executive.dashboard.view permission for this tenant scope."
                : "Unable to reach the Executive API service. Please verify database connectivity or retry."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!loggedIn ? (
              <a
                href="/login"
                className="inline-flex items-center rounded-lg bg-[var(--psm-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 transition"
              >
                Sign In
              </a>
            ) : (
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
      <ExecutivePresentationPreview />
    </main>
  );
}
function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 rounded-lg bg-[var(--psm-surface-2)]" />
      <div className="grid gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 rounded-lg bg-[var(--psm-surface-2)]"
          />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-[var(--psm-surface-2)]" />
    </div>
  );
}

export function ExecutiveDashboardPage({
  scope,
}: {
  scope?: Record<string, unknown>;
}) {
  const [activeScope, setActiveScope] = useState<Record<string, unknown>>(
    scope ?? {},
  );
  const [viewMode, setViewMode] = useState<"cockpit" | "preview">("cockpit");
  useEffect(() => setActiveScope(scope ?? {}), [scope]);
  const dashboard = useExecutiveDashboard(activeScope);
  const aggregation = useExecutiveAggregation(activeScope);
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const client = useQueryClient();
  const snapshot = useMutation({
    mutationFn: () => executiveApi.createSnapshot(activeScope),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["executive"] }),
  });
  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.isError || !dashboard.data)
    return (
      <ErrorState
        error={dashboard.error}
        retry={() => void dashboard.refetch()}
      />
    );
  const data = dashboard.data;
  const noRun = data.summaryCards.length === 0;
  const canRefresh =
    granted.has("executive.aggregation.run") ||
    granted.has("executive.kpi.refresh") ||
    granted.size === 0;
  const canCreateSnapshot =
    granted.has("executive.kpi.snapshot.create") || granted.size === 0;

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ExecutiveOverviewNavigation permissions={granted} />
        <div className="flex items-center gap-1 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-1 text-xs font-semibold self-start lg:self-auto shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("cockpit")}
            className={`rounded-md px-3 py-1.5 transition ${viewMode === "cockpit" ? "bg-[var(--psm-primary)] text-white shadow-sm" : "text-[var(--psm-muted)] hover:text-[var(--psm-text)]"}`}
          >
            Live PSM Cockpit
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`rounded-md px-3 py-1.5 transition ${viewMode === "preview" ? "bg-[var(--psm-primary)] text-white shadow-sm" : "text-[var(--psm-muted)] hover:text-[var(--psm-text)]"}`}
          >
            Illustrative System View
          </button>
        </div>
      </div>

      <ExecutiveDashboardHeader
        header={data.header}
        sites={data.sitePerformance}
        refreshing={aggregation.isPending}
        snapshotting={snapshot.isPending}
        canRefresh={canRefresh}
        canCreateSnapshot={canCreateSnapshot}
        onRefresh={() => aggregation.mutate()}
        onSnapshot={() => snapshot.mutate()}
        onSiteChange={(siteId) =>
          setActiveScope((current) =>
            siteId
              ? { ...current, siteId }
              : Object.fromEntries(
                  Object.entries(current).filter(([key]) => key !== "siteId"),
                ),
          )
        }
      />

      {aggregation.isError || snapshot.isError ? (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-300">
          The operation could not be completed. Please retry; no dashboard value was fabricated.
        </div>
      ) : null}

      {viewMode === "preview" ? (
        <ExecutivePresentationPreview />
      ) : (
        <>
          {noRun ? (
            <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      Awaiting Initial Aggregation
                    </span>
                    <span className="text-xs text-[var(--psm-muted)]">Phase 1 Foundation</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-[var(--psm-text)]">
                    Cross-Module Executive Aggregation
                  </h2>
                  <p className="mt-1 text-sm text-[var(--psm-muted)] leading-relaxed">
                    {data.aggregationWarning ??
                      "The Executive KPI engine connects directly to operational modules (Universal Actions, Incidents, Regulatory Register, Audit Findings, Mechanical Integrity, PTW, and MOC) to aggregate tenant-scoped indicators and compute real-time health scores. Click below to execute the first aggregation run for this scope."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("preview")}
                    className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition"
                  >
                    View Architecture Preview
                  </button>
                  <button
                    type="button"
                    disabled={aggregation.isPending}
                    onClick={() => aggregation.mutate()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-95 disabled:opacity-60"
                  >
                    <RefreshCw
                      size={16}
                      className={aggregation.isPending ? "animate-spin" : ""}
                    />
                    {aggregation.isPending
                      ? "Aggregating Modules..."
                      : "Run Aggregation Now"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <ExecutiveHealthRadarInfographic header={data.header} moduleHealth={data.moduleHealth} />
          <ExecutiveLeadershipPulse header={data.header} />
          <ExecutiveModuleHealthGrid modules={data.moduleHealth} />
          <ExecutiveCrossModuleChart modules={data.moduleHealth} />
          <section>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-[var(--psm-text)]">
                Enterprise KPI results
              </h2>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">
                Calculated results from connected, permitted source modules.
              </p>
            </div>
            <ExecutiveSummaryCards cards={data.summaryCards} />
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <ExecutiveAlertDonutChart alerts={data.criticalAlerts} />
            <ExecutiveTrendAreaChart currentScore={data.header.score} />
          </div>
          <div className="grid gap-5 2xl:grid-cols-[1.2fr_.8fr]">
            <ExecutiveCriticalAttentionPanel alerts={data.criticalAlerts} />
            <ExecutiveSourceHealthPanel rows={data.sourceHealth} />
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <ExecutiveOpenCriticalActionsPanel
              rows={data.openCriticalActions ?? []}
            />
            <ExecutivePendingApprovalsPanel rows={data.pendingApprovals ?? []} />
            <ExecutiveStaleRecordsPanel rows={data.staleRecords ?? []} />
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <ExecutiveRegulatoryAuditComplianceSummary
              rows={data.regulatoryAuditCompliance ?? []}
            />
            <ExecutiveIncidentMiTrainingSummary
              rows={data.incidentMiTraining ?? []}
            />
          </div>
          <ExecutiveSiteBenchmarkChart sites={data.sitePerformance} />
          <ExecutiveSitePerformanceTable sites={data.sitePerformance} />
          <ExecutiveManagementReviewPreview
            rows={data.managementReview ?? []}
            snapshot={data.recentSnapshot}
          />
        </>
      )}
    </main>
  );
}
