'use client';

import { useMemo, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock3, 
  FileText, 
  Filter, 
  Flame, 
  GitMerge, 
  History, 
  Search, 
  ShieldCheck, 
  User, 
  Wrench,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import type { EquipmentTimelineEvent } from '@/services/equipment.service';

const pageSize = 8;

export function EquipmentTimeline({ events }: { events: EquipmentTimelineEvent[] }) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');

  // Filtered & sorted events
  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((event) => {
        const matchesSearch = 
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (event.actorName && event.actorName.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (eventTypeFilter === 'ALL') return true;
        if (eventTypeFilter === 'PTW') return /ptw|permit/i.test(`${event.eventType} ${event.title} ${event.sourceType}`);
        if (eventTypeFilter === 'MOC') return /moc|change/i.test(`${event.eventType} ${event.title} ${event.sourceType}`);
        if (eventTypeFilter === 'INSPECTION') return /inspect|test|pm/i.test(`${event.eventType} ${event.title} ${event.sourceType}`);
        if (eventTypeFilter === 'DOCUMENT') return /doc|drawing|p&id/i.test(`${event.eventType} ${event.title} ${event.sourceType}`);
        if (eventTypeFilter === 'ACTION') return /action|capa/i.test(`${event.eventType} ${event.title} ${event.sourceType}`);
        return true;
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [events, searchQuery, eventTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const pageEvents = filteredEvents.slice((page - 1) * pageSize, page * pageSize);

  const filterTabs = [
    { key: 'ALL', label: 'All Events', count: events.length },
    { key: 'PTW', label: 'Permits (PTW)', count: events.filter(e => /ptw|permit/i.test(`${e.eventType} ${e.title}`)).length },
    { key: 'MOC', label: 'Changes (MOC)', count: events.filter(e => /moc|change/i.test(`${e.eventType} ${e.title}`)).length },
    { key: 'INSPECTION', label: 'Inspections', count: events.filter(e => /inspect|test/i.test(`${e.eventType} ${e.title}`)).length },
    { key: 'DOCUMENT', label: 'Documents', count: events.filter(e => /doc|drawing/i.test(`${e.eventType} ${e.title}`)).length },
  ];

  const formatTimelineDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 psm-fade-in">
      {/* Top Filter and Header Card */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-info/10 text-info">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--psm-text)]">Equipment Lifecycle Audit Trail</h2>
              <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
                Immutable chronological log of all changes, permits, inspections, and safety actions.
              </p>
            </div>
          </div>

          <div className="relative w-full max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search audit trail..."
              className="psm-input w-full pl-9 text-xs"
            />
          </div>
        </div>

        {/* Filter Pills and Pagination Controls */}
        <div className="flex flex-col gap-3 border-t border-[var(--psm-line)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setEventTypeFilter(tab.key);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  eventTypeFilter === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'
                }`}
              >
                {tab.label} <span className="ml-1 opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <button
              type="button"
              className="psm-button psm-button-secondary text-xs py-1 px-2.5"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="font-mono text-[var(--psm-muted)]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="psm-button psm-button-secondary text-xs py-1 px-2.5"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-12 text-center text-sm text-[var(--psm-muted)]">
          No audit events found for your search criteria.
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm">
          <div className="relative space-y-6">
            {/* The vertical timeline track line */}
            <div className="absolute bottom-6 left-[19px] top-4 w-0.5 bg-[var(--psm-line)]" />

            {pageEvents.map((event) => {
              const iconAndTone = getTimelineIconAndTone(event);
              return (
                <article key={event.id} className="relative flex items-start gap-4">
                  {/* Timeline Node Icon */}
                  <div className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${iconAndTone.borderClass} ${iconAndTone.bgClass} ${iconAndTone.textClass}`}>
                    {iconAndTone.icon}
                  </div>

                  {/* Context Content Box */}
                  <div className="min-w-0 flex-1 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 shadow-sm hover:border-[var(--psm-line)]/80 transition">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[var(--psm-text)]">{event.title}</h3>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${iconAndTone.badgeClass}`}>
                            {event.eventType.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {event.description && (
                          <p className="mt-1.5 text-xs text-[var(--psm-muted)] leading-relaxed max-w-2xl">
                            {event.description}
                          </p>
                        )}

                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[var(--psm-muted)]">
                          <span className="flex items-center gap-1 font-medium">
                            <User size={12} /> Logged by: <strong className="text-[var(--psm-text)]">{event.actorName ?? 'System Auditor'}</strong>
                          </span>
                          {event.sourceType && (
                            <>
                              <span>•</span>
                              <span className="font-mono">Module: {event.sourceType}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                          {formatTimelineDate(event.occurredAt)}
                        </span>
                        <div className="text-[10px] text-[var(--psm-muted)] mt-0.5">
                          {new Date(event.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getTimelineIconAndTone(event: EquipmentTimelineEvent) {
  const t = `${event.eventType} ${event.title} ${event.sourceType || ''}`.toLowerCase();
  if (/ptw|permit|hot work/i.test(t)) {
    return {
      icon: <Flame size={17} />,
      borderClass: 'border-amber-500/30',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-300'
    };
  }
  if (/moc|change/i.test(t)) {
    return {
      icon: <GitMerge size={17} />,
      borderClass: 'border-purple-500/30',
      bgClass: 'bg-purple-500/10',
      textClass: 'text-purple-400',
      badgeClass: 'bg-purple-500/20 text-purple-300'
    };
  }
  if (/inspect|test|calibration/i.test(t)) {
    return {
      icon: <ShieldCheck size={17} />,
      borderClass: 'border-emerald-500/30',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/20 text-emerald-300'
    };
  }
  if (/doc|drawing|p&id|datasheet/i.test(t)) {
    return {
      icon: <FileText size={17} />,
      borderClass: 'border-teal-500/30',
      bgClass: 'bg-teal-500/10',
      textClass: 'text-teal-400',
      badgeClass: 'bg-teal-500/20 text-teal-300'
    };
  }
  return {
    icon: <Clock3 size={17} />,
    borderClass: 'border-info/30',
    bgClass: 'bg-info/10',
    textClass: 'text-info',
    badgeClass: 'bg-info/20 text-info'
  };
}
