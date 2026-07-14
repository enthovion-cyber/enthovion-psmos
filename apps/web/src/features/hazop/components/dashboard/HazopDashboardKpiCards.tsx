import { AlertTriangle, CheckCircle2, Clock, FileCheck2, GitPullRequest, ListChecks, RefreshCw, ShieldAlert, ShieldCheck, Target, Users, Workflow } from 'lucide-react';

const tones: Record<string, string> = {
  blue: 'border-blue-400/20 bg-blue-500/10 text-blue-200',
  green: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
  red: 'border-red-400/20 bg-red-500/10 text-red-200',
  purple: 'border-violet-400/20 bg-violet-500/10 text-violet-200',
  cyan: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button key={card.key} type="button" onClick={() => card.filter && onFilter(card.filter[0] as string, card.filter[1])} className={`rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--psm-surface-2)] ${tones[card.tone]}`}>
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--psm-muted)]">
              <span>{card.label}</span>
              <Icon size={16} />
            </div>
            <div className="mt-3 text-3xl font-semibold text-[var(--psm-text)]">{Number(card.value ?? 0)}</div>
            <div className="mt-2 text-xs">{card.helper}</div>
          </button>
        );
      })}
    </div>
  );
}
