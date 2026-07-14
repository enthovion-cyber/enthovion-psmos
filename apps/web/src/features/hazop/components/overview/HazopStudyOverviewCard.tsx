'use client';

import { CalendarDays, MapPin, UserRound } from 'lucide-react';
import { HazopAvatar } from './HazopAvatarGroup';

function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function Field({ label, value }: { label: string; value?: any }) {
  return <div><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 text-sm font-medium text-[var(--psm-text)]">{value || '-'}</div></div>;
}

export function HazopStudyOverviewCard({ overview }: { overview: Record<string, any> }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">1. Study Overview</h3>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Study Type" value={overview.studyType} />
            <Field label="Study Number" value={overview.studyNumber} />
            <Field label="Site" value={overview.site} />
            <Field label="Process Unit" value={overview.processUnit} />
            <Field label="Area / Location" value={overview.area || overview.location} />
            <Field label="P&ID References" value={(overview.pidReferences ?? []).slice(0, 3).join(', ')} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--psm-line)] p-3"><UserRound size={15} className="mb-2 text-primary" /><HazopAvatar profile={overview.leader} label="Study Leader" /></div>
            <div className="rounded-lg border border-[var(--psm-line)] p-3"><UserRound size={15} className="mb-2 text-primary" /><HazopAvatar profile={overview.scribe} label="Scribe" /></div>
            <div className="rounded-lg border border-[var(--psm-line)] p-3"><UserRound size={15} className="mb-2 text-primary" /><HazopAvatar profile={overview.facilitator} label="Facilitator" /></div>
          </div>
        </div>
        <div className="space-y-4 border-t border-[var(--psm-line)] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start Date" value={<span><CalendarDays size={14} className="mr-1 inline" />{date(overview.startDate)}</span>} />
            <Field label="Target End Date" value={date(overview.targetEndDate)} />
            <Field label="Completion Date" value={date(overview.completionDate)} />
            <Field label="Revalidation Due" value={date(overview.revalidationDueDate)} />
            <Field label="Linked MOC" value={overview.linkedMocId} />
            <Field label="Linked PSSR" value={overview.linkedPssrId} />
          </div>
          <div className="rounded-lg border border-[var(--psm-line)] p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><MapPin size={15} className="text-primary" />Objective</div>
            <p className="text-sm leading-6 text-[var(--psm-muted)]">{overview.objective || 'No objective captured.'}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {['scopeSummary', 'boundaries', 'assumptions', 'exclusions'].map((key) => (
          <div key={key} className="rounded-lg border border-[var(--psm-line)] p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-[var(--psm-muted)]">{key.replace(/([A-Z])/g, ' $1')}</div>
            <p className="line-clamp-4 text-sm text-[var(--psm-text)]">{overview[key] || 'Not captured'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
