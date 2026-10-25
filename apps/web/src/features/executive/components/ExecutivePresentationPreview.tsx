"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExecutivePanel } from "./ExecutivePanel";
import {
  ExecutiveHealthRadarInfographic,
  ExecutiveCrossModuleChart,
  ExecutiveAlertDonutChart,
  ExecutiveSiteBenchmarkChart,
  ExecutiveTrendAreaChart,
} from "./charts";

const previewHeader = {
  companyId: "sample-co",
  score: 87,
  status: "Healthy",
  criticalAlertsCount: 6,
  overdueActionCount: 35,
  pendingApprovalCount: 14,
  staleCriticalRecordCount: 4,
  dataQualityStatus: "Current",
};

const previewModules = [
  { moduleKey: "psi", moduleName: "Process Safety Information", healthStatus: "Healthy", healthScoreFoundation: 94, criticalOpenItems: 0, overdueItems: 1, pendingApprovals: 0, staleRecords: 0, dataQuality: "Good", reason: "PSI baseline synchronized" },
  { moduleKey: "training", moduleName: "Training & Competency", healthStatus: "Healthy", healthScoreFoundation: 91, criticalOpenItems: 0, overdueItems: 3, pendingApprovals: 1, staleRecords: 1, dataQuality: "Good", reason: "Refresher compliance 96%" },
  { moduleKey: "incidents", moduleName: "Incident Investigation", healthStatus: "Healthy", healthScoreFoundation: 90, criticalOpenItems: 0, overdueItems: 2, pendingApprovals: 1, staleRecords: 0, dataQuality: "Good", reason: "0 open Tier 1/2 process events" },
  { moduleKey: "ptw", moduleName: "Permit to Work", healthStatus: "Healthy", healthScoreFoundation: 92, criticalOpenItems: 0, overdueItems: 1, pendingApprovals: 0, staleRecords: 0, dataQuality: "Good", reason: "Hot work & isolation verified" },
  { moduleKey: "pssr", moduleName: "Pre-Startup Safety Review", healthStatus: "Healthy", healthScoreFoundation: 89, criticalOpenItems: 0, overdueItems: 1, pendingApprovals: 1, staleRecords: 0, dataQuality: "Good", reason: "Hydrocracker restart punchlist" },
  { moduleKey: "lopa-sil", moduleName: "LOPA / SIL", healthStatus: "Healthy", healthScoreFoundation: 93, criticalOpenItems: 0, overdueItems: 0, pendingApprovals: 0, staleRecords: 0, dataQuality: "Good", reason: "SIF proof testing current" },
  { moduleKey: "reports-export", moduleName: "Reports & Export", healthStatus: "Healthy", healthScoreFoundation: 95, criticalOpenItems: 0, overdueItems: 0, pendingApprovals: 0, staleRecords: 0, dataQuality: "Good", reason: "Executive reports generated" },
  { moduleKey: "mechanical-integrity", moduleName: "Mechanical Integrity", healthStatus: "Monitor", healthScoreFoundation: 88, criticalOpenItems: 1, overdueItems: 5, pendingApprovals: 2, staleRecords: 2, dataQuality: "Good", reason: "Relief valve tests pending" },
  { moduleKey: "regulatory-register", moduleName: "Regulatory Register", healthStatus: "Monitor", healthScoreFoundation: 86, criticalOpenItems: 0, overdueItems: 4, pendingApprovals: 1, staleRecords: 0, dataQuality: "Good", reason: "4 compliance actions tracked" },
  { moduleKey: "hazop", moduleName: "HAZOP / PHA", healthStatus: "Monitor", healthScoreFoundation: 85, criticalOpenItems: 1, overdueItems: 3, pendingApprovals: 0, staleRecords: 1, dataQuality: "Good", reason: "Revalidation cycle current" },
  { moduleKey: "review-approval", moduleName: "Review & Approval", healthStatus: "Monitor", healthScoreFoundation: 88, criticalOpenItems: 0, overdueItems: 2, pendingApprovals: 3, staleRecords: 0, dataQuality: "Good", reason: "Multi-stage signoffs on schedule" },
  { moduleKey: "moc", moduleName: "Management of Change", healthStatus: "Monitor", healthScoreFoundation: 82, criticalOpenItems: 1, overdueItems: 6, pendingApprovals: 4, staleRecords: 1, dataQuality: "Good", reason: "Pre-startup reviews active" },
  { moduleKey: "audit", moduleName: "Audit & Assurance", healthStatus: "Monitor", healthScoreFoundation: 84, criticalOpenItems: 1, overdueItems: 4, pendingApprovals: 2, staleRecords: 1, dataQuality: "Good", reason: "Annual PSM audit findings open" },
  { moduleKey: "actions", moduleName: "Universal Actions / CAPA", healthStatus: "Attention Required", healthScoreFoundation: 79, criticalOpenItems: 2, overdueItems: 8, pendingApprovals: 3, staleRecords: 3, dataQuality: "Good", reason: "8 actions past original SLA" },
];

const previewSites = [
  { siteId: "ALKY", siteName: "Alkylation Plant (ALKY)", overallHealth: "Healthy", criticalItems: 2, overdueActions: 6, regulatoryGaps: 1, trainingCompliance: 96, miOverdue: 2, pendingReviews: 1, staleRecords: 1, route: "/executive/site-performance" },
  { siteId: "JIC", siteName: "Jubail Industrial City (JIC)", overallHealth: "Monitor", criticalItems: 3, overdueActions: 11, regulatoryGaps: 2, trainingCompliance: 91, miOverdue: 4, pendingReviews: 3, staleRecords: 2, route: "/executive/site-performance" },
  { siteId: "SMF", siteName: "Specialty Monomers Facility (SMF)", overallHealth: "Healthy", criticalItems: 1, overdueActions: 3, regulatoryGaps: 0, trainingCompliance: 98, miOverdue: 1, pendingReviews: 0, staleRecords: 0, route: "/executive/site-performance" },
  { siteId: "MIC", siteName: "Midland Intermediates Complex (MIC)", overallHealth: "Warning", criticalItems: 4, overdueActions: 15, regulatoryGaps: 3, trainingCompliance: 84, miOverdue: 5, pendingReviews: 2, staleRecords: 2, route: "/executive/site-performance" },
];

const previewAlerts = [
  { severity: "Critical", dueDate: new Date(Date.now() - 5 * 86400000).toISOString(), title: "High-pressure relief inspection overdue", age_days: 5 },
  { severity: "Critical", dueDate: new Date(Date.now() - 12 * 86400000).toISOString(), title: "Toxic gas isolation valve bypass unverified", age_days: 12 },
  { severity: "High", dueDate: new Date(Date.now() - 8 * 86400000).toISOString(), title: "MOC effectiveness sign-off pending", age_days: 8 },
  { severity: "High", dueDate: new Date(Date.now() - 18 * 86400000).toISOString(), title: "Audit finding: Flare header inspection gap", age_days: 18 },
  { severity: "Medium", dueDate: new Date(Date.now() - 2 * 86400000).toISOString(), title: "Refresher training overdue for operators", age_days: 2 },
  { severity: "Low", dueDate: new Date(Date.now() + 4 * 86400000).toISOString(), title: "Regulatory submission package in review", age_days: 0 },
];

const healthTrend = [
  { period: "May", health: 78, risk: 12 },
  { period: "Jun", health: 80, risk: 11 },
  { period: "Jul", health: 79, risk: 13 },
  { period: "Aug", health: 83, risk: 9 },
  { period: "Sep", health: 85, risk: 8 },
  { period: "Oct", health: 87, risk: 6 },
];

const siteComparison = [
  { site: "ALKY", health: 87, actions: 6, risk: 4 },
  { site: "JIC", health: 82, actions: 11, risk: 7 },
  { site: "SMF", health: 91, actions: 3, risk: 2 },
  { site: "MIC", health: 76, actions: 15, risk: 9 },
];

const psmElements = [
  { name: "Process safety information", score: 94, status: "Good" },
  { name: "Mechanical integrity", score: 88, status: "Monitor" },
  { name: "Management of change", score: 82, status: "Monitor" },
  { name: "Incident investigation", score: 79, status: "Attention" },
  { name: "Training and competency", score: 91, status: "Good" },
  { name: "Regulatory readiness", score: 86, status: "Monitor" },
];

const attentionItems = [
  {
    title: "MI overdue inspection - relief valve circuit",
    site: "JIC",
    owner: "Mechanical Integrity",
    status: "Overdue",
  },
  {
    title: "MOC effectiveness review awaiting approval",
    site: "ALKY",
    owner: "Operations Excellence",
    status: "Approval due",
  },
  {
    title: "Regulatory evidence link needs validation",
    site: "SMF",
    owner: "Compliance",
    status: "Evidence gap",
  },
];

const indicators = [
  { label: "Overall PSM health", value: "87", detail: "Target >= 85", tone: "text-emerald-700 dark:text-emerald-400", icon: TrendingUp },
  { label: "Critical open risks", value: "6", detail: "2 require executive action", tone: "text-rose-700 dark:text-rose-400", icon: ShieldAlert },
  { label: "Overdue actions", value: "35", detail: "11 at Jubail Industrial City", tone: "text-amber-700 dark:text-amber-400", icon: AlertTriangle },
  { label: "PSM elements on target", value: "11 / 14", detail: "3 monitored closely", tone: "text-sky-700 dark:text-sky-400", icon: ClipboardCheck },
  { label: "Evidence completeness", value: "96%", detail: "Across enabled modules", tone: "text-violet-700 dark:text-violet-400", icon: CheckCircle2 },
  { label: "Management actions", value: "8", detail: "Due before next review", tone: "text-orange-700 dark:text-orange-400", icon: BarChart3 },
];

function scoreColor(score: number) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 80) return "bg-sky-500";
  return "bg-amber-500";
}

export function ExecutivePresentationPreview() {
  return (
    <section className="space-y-6" aria-labelledby="presentation-preview-title">
      <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-700 dark:text-amber-300">
            Presentation preview &amp; Architecture Showcase
          </p>
          <h2 id="presentation-preview-title" className="mt-1 text-lg font-bold text-[var(--psm-text)]">
            Executive KPI Cockpit — Interactive Visual Analytics
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-[var(--psm-muted)]">
            Explore the multi-tier radar gauge, 14-module health scoring distribution, severity donut, aging velocity histogram, and multi-site benchmarking.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-[var(--psm-surface)] px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300 shadow-sm">
          <Factory size={17} /> ALKY / JIC sample view
        </div>
      </div>

      {/* 1. Health Radar Infographic Gauge & Barrier Coverage */}
      <ExecutiveHealthRadarInfographic header={previewHeader} moduleHealth={previewModules} />

      {/* 2. Key Indicator Pulse Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {indicators.map((indicator) => {
          const Icon = indicator.icon;
          return (
            <article key={indicator.label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-md bg-[var(--psm-surface-2)] p-2 ${indicator.tone}`}>
                  <Icon size={18} />
                </span>
                <span className="text-xs font-medium text-[var(--psm-muted)]">Sample</span>
              </div>
              <p className="mt-4 text-2xl font-bold text-[var(--psm-text)]">{indicator.value}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--psm-text)]">{indicator.label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--psm-muted)]">{indicator.detail}</p>
            </article>
          );
        })}
      </div>

      {/* 3. Cross-Module Health Scoring Distribution (14 Modules) */}
      <ExecutiveCrossModuleChart modules={previewModules} />

      {/* 4. Analytics Strip: Severity Donut & Trend Area Trajectory */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ExecutiveAlertDonutChart alerts={previewAlerts} />
        <ExecutiveTrendAreaChart currentScore={87} />
      </div>

      {/* 5. Multi-Site PSM Health Benchmarking */}
      <ExecutiveSiteBenchmarkChart sites={previewSites} />

      {/* 6. Legacy / Supplementary Detail Panels */}
      <div className="grid gap-5 2xl:grid-cols-[1.15fr_.85fr]">
        <ExecutivePanel title="PSM health and risk trend" subtitle="Illustrative six-month view for executive review.">
          <div className="h-72" aria-label="Illustrative PSM health and critical risk trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthTrend} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--psm-line)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="period" stroke="var(--psm-muted)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis yAxisId="health" domain={[60, 100]} stroke="var(--psm-muted)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis yAxisId="risk" orientation="right" domain={[0, 20]} stroke="var(--psm-muted)" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--psm-surface)", border: "1px solid var(--psm-line)", borderRadius: 6 }} />
                <Line yAxisId="health" type="monotone" dataKey="health" name="PSM health" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="risk" type="monotone" dataKey="risk" name="Critical risk" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ExecutivePanel>

        <ExecutivePanel title="Critical attention" subtitle="Illustrative queue sorted for executive escalation.">
          <div className="space-y-3">
            {attentionItems.map((item) => (
              <article key={item.title} className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--psm-text)]">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--psm-muted)]">{item.site} - {item.owner}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">{item.status}</span>
                </div>
              </article>
            ))}
            <p className="flex items-center gap-1 text-xs text-[var(--psm-muted)]"><ArrowUpRight size={14} /> Drilldowns activate from live source records after aggregation.</p>
          </div>
        </ExecutivePanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <ExecutivePanel title="Site comparison" subtitle="ALKY, JIC, SMF, and MIC sample portfolio health.">
          <div className="h-72" aria-label="Illustrative site performance bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteComparison} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--psm-line)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="site" stroke="var(--psm-muted)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--psm-muted)" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--psm-surface)", border: "1px solid var(--psm-line)", borderRadius: 6 }} />
                <Bar dataKey="health" name="Health score" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actions" name="Overdue actions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="risk" name="Critical risks" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ExecutivePanel>

        <ExecutivePanel title="PSM element health" subtitle="Illustrative element-level scorecards for management review.">
          <div className="grid gap-3 sm:grid-cols-2">
            {psmElements.map((element) => (
              <article key={element.name} className="rounded-md border border-[var(--psm-line)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[var(--psm-text)]">{element.name}</p>
                  <span className="text-sm font-bold text-[var(--psm-text)]">{element.score}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
                  <div className={`h-full rounded-full ${scoreColor(element.score)}`} style={{ width: `${element.score}%` }} />
                </div>
                <p className="mt-2 text-xs text-[var(--psm-muted)]">{element.status} - sample assessment</p>
              </article>
            ))}
          </div>
        </ExecutivePanel>
      </div>

      <ExecutivePanel title="Operating context" subtitle="Illustrative plant and jurisdiction context; live context is supplied from the selected company and site.">
        <div className="grid gap-3 md:grid-cols-2">
          <article className="flex gap-3 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
            <span className="rounded-md bg-sky-500/10 p-2 text-sky-400"><Factory size={20} /></span>
            <div><p className="font-semibold text-[var(--psm-text)]">Alkylation Plant <span className="text-[var(--psm-muted)]">(ALKY)</span></p><p className="mt-1 text-sm text-[var(--psm-muted)]">Illustrative operating site for unit-level KPI comparison.</p></div>
          </article>
          <article className="flex gap-3 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
            <span className="rounded-md bg-violet-500/10 p-2 text-violet-400"><Building2 size={20} /></span>
            <div><p className="font-semibold text-[var(--psm-text)]">Jubail Industrial City <span className="text-[var(--psm-muted)]">(JIC)</span></p><p className="mt-1 text-sm text-[var(--psm-muted)]">Illustrative jurisdiction and portfolio context.</p></div>
          </article>
        </div>
      </ExecutivePanel>
    </section>
  );
}
