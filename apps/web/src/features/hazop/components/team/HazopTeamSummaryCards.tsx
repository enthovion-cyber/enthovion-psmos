'use client';

import type { LucideIcon } from 'lucide-react';
import { CalendarClock, CalendarCheck, ClipboardCheck, ShieldAlert, UserCheck, UserRoundCheck, Users, UserPlus, PenLine, Clock3, BriefcaseBusiness } from 'lucide-react';

type SummaryCard = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  hot?: boolean;
  text?: boolean;
  boolean?: boolean;
};

const cards: SummaryCard[] = [
  { key: 'totalTeamMembers', label: 'Total team members', icon: Users, tone: 'blue' },
  { key: 'requiredMembers', label: 'Required members', icon: UserCheck, tone: 'green' },
  { key: 'optionalMembers', label: 'Optional members', icon: UserPlus, tone: 'slate' },
  { key: 'missingRequiredDisciplines', label: 'Missing disciplines', icon: ShieldAlert, tone: 'red', hot: true },
  { key: 'sessionsPlanned', label: 'Sessions planned', icon: CalendarClock, tone: 'blue' },
  { key: 'sessionsCompleted', label: 'Sessions completed', icon: CalendarCheck, tone: 'green' },
  { key: 'attendanceIncomplete', label: 'Attendance incomplete', icon: ClipboardCheck, tone: 'amber', hot: true },
  { key: 'openSessionActions', label: 'Open session actions', icon: ShieldAlert, tone: 'amber', hot: true },
  { key: 'pendingTeamSignoffs', label: 'Pending team sign-offs', icon: UserRoundCheck, tone: 'amber', hot: true },
  { key: 'studyLeader', label: 'Study leader', icon: BriefcaseBusiness, tone: 'blue', text: true },
  { key: 'scribeAssigned', label: 'Scribe assigned', icon: PenLine, tone: 'green', boolean: true },
  { key: 'nextSessionDate', label: 'Next session date', icon: Clock3, tone: 'blue', text: true }
];

const toneClass: Record<string, string> = {
  blue: 'border-blue-400/25 bg-blue-500/10 text-blue-200',
  green: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  red: 'border-red-400/30 bg-red-500/10 text-red-200',
  slate: 'border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-text)]'
};

function displayValue(card: SummaryCard, value: unknown) {
  if (card.boolean) return value ? 'Yes' : 'No';
  if (card.key === 'nextSessionDate' && value) return new Date(String(value)).toLocaleDateString();
  return value ?? (card.text ? '-' : 0);
}

export function HazopTeamSummaryCards({ summary, loading, onFilter }: { summary?: any; loading?: boolean; onFilter?: (key: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = loading ? '...' : displayValue(card, summary?.[card.key]);
        const hot = card.hot && Number(summary?.[card.key] ?? 0) > 0;
        return (
          <button key={card.key} onClick={() => onFilter?.(card.key)} className={`group rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:bg-[var(--psm-surface-2)] ${hot ? toneClass[card.tone] : toneClass[card.tone]}`}>
            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-[var(--psm-muted)]">
              <span className="line-clamp-2">{card.label}</span>
              <Icon size={16} className="shrink-0 transition group-hover:scale-110" />
            </div>
            <div className={`mt-3 truncate font-semibold ${card.text ? 'text-base' : 'text-3xl'}`}>{String(value)}</div>
            {card.hot && <div className="mt-1 text-[11px] text-[var(--psm-muted)]">Click to inspect</div>}
          </button>
        );
      })}
    </div>
  );
}
