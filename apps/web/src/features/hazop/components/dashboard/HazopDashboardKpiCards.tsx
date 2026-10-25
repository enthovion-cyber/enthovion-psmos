import { AlertTriangle, CheckCircle2, Clock, FileCheck2, GitPullRequest, ListChecks, RefreshCw, ShieldAlert, ShieldCheck, Target, Users, Workflow } from 'lucide-react';

const defaultTone = {
  border: 'border-blue-500/25',
  bg: 'bg-blue-500/5',
  icon: 'text-blue-600 dark:text-blue-400',
  count: 'text-[var(--psm-text)]'
};

const tones: Record<string, { border: string; bg: string; icon: string; count: string }> = {
  blue: defaultTone,
  green: {
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/5',
    icon: 'text-emerald-600 dark:text-emerald-400',
    count: 'text-[var(--psm-text)]'
  },
  amber: {
    border: 'border-amber-500/25',
    bg: 'bg-amber-500/5',
    icon: 'text-amber-600 dark:text-amber-400',
    count: 'text-[var(--psm-text)]'
  },
  red: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    icon: 'text-rose-600 dark:text-rose-400',
    count: 'text-rose-600 dark:text-rose-400'
  },
  purple: {
    border: 'border-purple-500/25',
    bg: 'bg-purple-500/5',
    icon: 'text-purple-600 dark:text-purple-400',
    count: 'text-[var(--psm-text)]'
  },
  cyan: {
    border: 'border-cyan-500/25',
    bg: 'bg-cyan-500/5',
    icon: 'text-cyan-600 dark:text-cyan-400',
    count: 'text-[var(--psm-text)]'
  }
};

export function HazopDashboardKpiCards({ kpis, onFilter }: { kpis: Record<string, number>; onFilter: (key: string, value: any) => void }) {
  const cards = [
    { key: 'total', label: 'Total Studies', value: kpis.total, helper: 'All accessible studies', icon: ListChecks, tone: 'blue' },
    { key: 'draft', label: 'Draft Studies', value: kpis.draft, helper: 'Not released', icon: FileCheck2, tone: 'cyan', filter: ['status', 'Draft'] },
    { key: 'inProgress', label: 'In Progress', value: kpis.inProgress, helper: 'Preparation / active', icon: RefreshCw, tone: 'blue', filter: ['status', 'In Progress'] },
    { key: 'pendingApproval', label: 'In Review', value: kpis.pendingApproval, helper: 'Approval pipeline', icon: GitPullRequest, tone: 'amber', filter: ['status', 'Pending Approval'] },
    { key: 'closed', label: 'Closed', value: kpis.closed, helper: 'Approved and archived', icon: CheckCircle2, tone: 'green', filter: ['status', 'Closed'] },
    { key: 'overdue', label: 'Overdue Studies', value: kpis.overdue, helper: 'Past target completion', icon: Clock, tone: 'red', filter: ['overdue', true] },
    { key: 'highRiskOpenScenarios', label: 'High / Critical Risks', value: kpis.highRiskOpenScenarios, helper: 'Open scenarios', icon: AlertTriangle, tone: 'red', filter: ['riskPriority', 'High'] },
    { key: 'recommendationsOpen', label: 'Open Recommendations', value: kpis.recommendationsOpen, helper: 'Awaiting closure', icon: Target, tone: 'amber' },
    { key: 'recommendationsOverdue', label: 'Overdue Recommendations', value: kpis.recommendationsOverdue, helper: 'Past due date', icon: Clock, tone: 'red' },
    { key: 'openActions', label: 'Open Actions', value: kpis.openActions ?? 0, helper: 'Linked action engine', icon: Workflow, tone: 'cyan' },
    { key: 'lopaRequired', label: 'LOPA Required', value: kpis.lopaRequired, helper: 'Pending LOPA/SIL', icon: ShieldAlert, tone: 'purple', filter: ['lopaRequired', true] },
    { key: 'pendingSignoffs', label: 'Pending Sign-Offs', value: kpis.pendingSignoffs ?? 0, helper: 'Review matrix', icon: Users, tone: 'amber', filter: ['pendingSignoff', true] },
    { key: 'revalidationDue', label: 'Revalidation Due Soon', value: kpis.revalidationDue, helper: 'Within watch window', icon: ShieldCheck, tone: 'cyan', filter: ['revalidationDue', true] },
    { key: 'mocLinked', label: 'Linked MOC/PSSR', value: kpis.mocLinked, helper: 'Triggered studies', icon: GitPullRequest, tone: 'blue' }
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => {
        const Icon = card.icon;
        const toneStyle = tones[card.tone] ?? defaultTone;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => card.filter && onFilter(card.filter[0] as string, card.filter[1])}
            className={`group rounded-xl border ${toneStyle.border} ${toneStyle.bg} p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-98`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-[var(--psm-muted)]">
              <span className="truncate">{card.label}</span>
              <Icon size={14} className={`shrink-0 ${toneStyle.icon}`} />
            </div>
            <div className={`mt-2 text-xl font-bold tracking-tight sm:text-2xl ${toneStyle.count}`}>
              {Number(card.value ?? 0)}
            </div>
            <div className="mt-1 truncate text-[10px] text-[var(--psm-muted)]">
              {card.helper}
            </div>
          </button>
        );
      })}
    </div>
  );
}
