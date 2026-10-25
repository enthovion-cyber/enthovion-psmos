'use client';

import { CalendarDays, MapPin, UserRound } from 'lucide-react';
import { HazopAvatar } from './HazopAvatarGroup';

function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function Field({ label, value }: { label: string; value?: any }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium text-[var(--psm-muted)]">{label}</div>
      <div className="mt-1 text-xs sm:text-sm font-medium text-[var(--psm-text)] break-words">{value || '-'}</div>
    </div>
  );
}

export function HazopStudyOverviewCard({ overview }: { overview: Record<string, any> }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4 min-w-0">
      <h3 className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--psm-text)]">1. Study Overview</h3>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] min-w-0">
        <div className="space-y-3.5 min-w-0">
          <div className="grid gap-2.5 sm:grid-cols-2 min-w-0">
            <Field label="Study Type" value={overview.studyType} />
            <Field label="Study Number" value={overview.studyNumber} />
            <Field label="Site" value={overview.site} />
            <Field label="Process Unit" value={overview.processUnit} />
            <Field label="Area / Location" value={overview.area || overview.location} />
            <Field label="P&ID References" value={(overview.pidReferences ?? []).slice(0, 3).join(', ')} />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5"><UserRound size={14} className="mb-1 text-primary" /><HazopAvatar profile={overview.leader} label="Study Leader" /></div>
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5"><UserRound size={14} className="mb-1 text-primary" /><HazopAvatar profile={overview.scribe} label="Scribe" /></div>
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5"><UserRound size={14} className="mb-1 text-primary" /><HazopAvatar profile={overview.facilitator} label="Facilitator" /></div>
          </div>
        </div>
        <div className="space-y-3.5 border-t border-[var(--psm-line)] pt-3.5 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0 min-w-0">
          <div className="grid gap-2.5 sm:grid-cols-2 min-w-0">
            <Field label="Start Date" value={<span><CalendarDays size={13} className="mr-1 inline text-[var(--psm-muted)]" />{date(overview.startDate)}</span>} />
            <Field label="Target End Date" value={date(overview.targetEndDate)} />
            <Field label="Completion Date" value={date(overview.completionDate)} />
            <Field label="Revalidation Due" value={date(overview.revalidationDueDate)} />
            <Field label="Linked MOC" value={overview.linkedMocId} />
            <Field label="Linked PSSR" value={overview.linkedPssrId} />
          </div>
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-3 min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--psm-text)]"><MapPin size={14} className="text-primary shrink-0" />Objective</div>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--psm-muted)] break-words">{overview.objective || 'No objective captured.'}</p>
          </div>
        </div>
      </div>
      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
        {['scopeSummary', 'boundaries', 'assumptions', 'exclusions'].map((key) => (
          <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5 min-w-0">
            <div className="mb-1 text-[11px] font-semibold uppercase text-[var(--psm-muted)]">{key.replace(/([A-Z])/g, ' $1')}</div>
            <p className="line-clamp-4 text-xs text-[var(--psm-text)] leading-relaxed">{overview[key] || 'Not captured'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
