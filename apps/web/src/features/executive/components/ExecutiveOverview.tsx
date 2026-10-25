import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckSquare,
  CircleGauge,
  Clock3,
  Database,
  History,
  Layers,
  LayoutDashboard,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import type {
  ExecutiveDashboard,
  ExecutiveStatus,
} from "../types/executive-kpi.types";
import { ExecutiveStatusBadge } from "./shared/ExecutiveStatusBadge";
import { ExecutiveThemeToggle } from "./shared/ExecutiveThemeToggle";

type Icon = ComponentType<{ size?: number; className?: string }>;

const navigation = [
  {
    label: "Overview",
    href: "/executive",
    permission: "executive.dashboard.view",
    icon: LayoutDashboard,
  },
  {
    label: "Aggregation Runs",
    href: "/executive/aggregation/runs",
    permission: "executive.aggregation.history.view",
    icon: History,
  },
  {
    label: "Module Health",
    href: "/executive/modules",
    permission: "executive.module_health.view",
    icon: Layers,
  },
  {
    label: "Critical Alerts",
    href: "/executive/critical-alerts",
    permission: "executive.critical_alert.view",
    icon: AlertCircle,
  },
  {
    label: "Site Performance",
    href: "/executive/performance/sites",
    permission: "executive.site_performance.view",
    icon: Building2,
  },
  {
    label: "Unit Performance",
    href: "/executive/performance/units",
    permission: "executive.performance.unit.view",
    icon: Layers,
  },
  {
    label: "Heatmap",
    href: "/executive/performance/heatmap",
    permission: "executive.performance.heatmap.view",
    icon: Activity,
  },
  {
    label: "Rankings",
    href: "/executive/performance/rankings",
    permission: "executive.performance.ranking.view",
    icon: BarChart3,
  },
  {
    label: "Drilldown",
    href: "/executive/performance/drilldown",
    permission: "executive.performance.drilldown.view",
    icon: CircleGauge,
  },
  {
    label: "Snapshots",
    href: "/executive/performance/snapshots",
    permission: "executive.performance.snapshot.view",
    icon: Database,
  },
  {
    label: "Critical Risk",
    href: "/executive/critical-risks",
    permission: "executive.critical_risk.dashboard.view",
    icon: ShieldAlert,
  },
  {
    label: "Overdue Actions",
    href: "/executive/overdue-actions",
    permission: "executive.overdue_action.dashboard.view",
    icon: Clock3,
  },
  {
    label: "Escalations",
    href: "/executive/escalations",
    permission: "executive.escalation.dashboard.view",
    icon: AlertTriangle,
  },
  {
    label: "Leadership Attention",
    href: "/executive/leadership-attention",
    permission: "executive.leadership_attention.view",
    icon: Zap,
  },
  {
    label: "PSM Elements",
    href: "/executive/psm-elements",
    permission: "executive.psm_element.dashboard.view",
    icon: ListChecks,
  },
  {
    label: "Performance",
    href: "/executive/performance",
    permission: "executive.performance.dashboard.view",
    icon: BarChart3,
  },
  {
    label: "Management Review",
    href: "/executive/management-review",
    permission: "executive.management_review.dashboard.view",
    icon: CheckSquare,
  },
  {
    label: "Source Configs",
    href: "/executive/source-configs",
    permission: "executive.source_config.view",
    icon: Sliders,
  },
  {
    label: "Errors",
    href: "/executive/aggregation-errors",
    permission: "executive.aggregation_error.view",
    icon: AlertTriangle,
  },
] as const;

export function ExecutiveOverviewNavigation({
  permissions,
}: {
  permissions: Set<string>;
}) {
  const pathname = usePathname();
  const items = navigation.filter(
    (item) =>
      item.href === "/executive" ||
      permissions.has(item.permission) ||
      permissions.has("executive.dashboard.view") ||
      permissions.size === 0,
  );
  return (
    <nav
      aria-label="Executive dashboard views"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
        {items.map((item) => {
          const ItemIcon = item.icon;
          const active =
            item.href === "/executive"
              ? pathname === "/executive" || pathname === "/executive/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${active ? "bg-[var(--psm-primary)] text-white shadow-sm" : "text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]"}`}
            >
              <ItemIcon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="shrink-0 pl-2">
        <ExecutiveThemeToggle />
      </div>
    </nav>
  );
}

interface PulseItem {
  label: string;
  value: string | number;
  detail: string;
  status: ExecutiveStatus;
  href: string;
  icon: Icon;
}

function countStatus(
  value: number | undefined,
  warning: ExecutiveStatus = "Warning",
): ExecutiveStatus {
  if (value === undefined) return "Unavailable";
  return value === 0 ? "Good" : warning;
}

export function ExecutiveLeadershipPulse({
  header,
}: {
  header: ExecutiveDashboard["header"];
}) {
  const cards: PulseItem[] = [
    {
      label: "Overall PSM health",
      value: header.score ?? "—",
      detail:
        header.score === null
          ? "No calculated score"
          : "Latest permitted aggregation",
      status: header.status,
      href: "/executive/performance",
      icon: CircleGauge,
    },
    {
      label: "Critical open risks",
      value: header.criticalAlertsCount ?? "—",
      detail:
        header.criticalAlertsCount === undefined
          ? "Not reported"
          : "Backend-ranked alerts",
      status: countStatus(header.criticalAlertsCount, "Critical"),
      href: "/executive/critical-risks",
      icon: AlertTriangle,
    },
    {
      label: "Overdue actions",
      value: header.overdueActionCount ?? "—",
      detail:
        header.overdueActionCount === undefined
          ? "Not reported"
          : "Across permitted modules",
      status: countStatus(header.overdueActionCount),
      href: "/executive/overdue-actions",
      icon: Clock3,
    },
    {
      label: "Pending approvals",
      value: header.pendingApprovalCount ?? "—",
      detail:
        header.pendingApprovalCount === undefined
          ? "Not reported"
          : "Awaiting authorized review",
      status: countStatus(header.pendingApprovalCount, "Monitor"),
      href: "/executive/pending-approvals",
      icon: CheckSquare,
    },
    {
      label: "Stale critical records",
      value: header.staleCriticalRecordCount ?? "—",
      detail:
        header.staleCriticalRecordCount === undefined
          ? "Not reported"
          : "Freshness review required",
      status: countStatus(header.staleCriticalRecordCount),
      href: "/executive/stale-records",
      icon: Database,
    },
    {
      label: "Data quality",
      value: header.dataQualityStatus ?? (header.stale ? "Stale" : "Current"),
      detail: header.lastAggregationRun
        ? `Updated ${new Date(header.lastAggregationRun).toLocaleString()}`
        : "No completed aggregation",
      status: header.dataQualityStatus ?? (header.stale ? "Warning" : "Good"),
      href: "/executive/source-health",
      icon: ShieldCheck,
    },
  ];

  return (
    <section aria-labelledby="leadership-pulse-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="leadership-pulse-title"
            className="text-base font-semibold text-[var(--psm-text)]"
          >
            Leadership pulse
          </h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Live values from the latest permitted Executive aggregation.
          </p>
        </div>
        <p className="text-xs font-medium text-[var(--psm-muted)]">
          No illustrative values
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const CardIcon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-[var(--psm-primary)] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-md bg-[var(--psm-surface-2)] p-2 text-[var(--psm-primary)]">
                  <CardIcon size={18} />
                </span>
                <ExecutiveStatusBadge status={card.status} />
              </div>
              <p className="mt-4 text-2xl font-bold text-[var(--psm-text)]">
                {card.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--psm-text)]">
                {card.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--psm-muted)]">
                {card.detail}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
