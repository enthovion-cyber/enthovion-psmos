'use client';

import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, ArrowRight } from 'lucide-react';
import { HazopAvatar } from './HazopAvatarGroup';

interface ActivityEvent {
  id: string | number;
  safety_critical?: boolean;
  severity?: 'Info' | 'Warning' | 'Critical' | string;
  event_title?: string;
  title?: string;
  event_type?: string;
  created_at?: string;
  event_description?: string;
  description?: string;
  related_section?: string;
  event_category?: string;
  actor?: any;
}

export function HazopRecentActivityTimeline({ 
  events = [], 
  onNavigate 
}: { 
  events: ActivityEvent[]; 
  onNavigate: (tab?: string) => void; 
}) {
  // Enforce the 4-event display cap safely
  const visibleEvents = (events ?? []).slice(0, 4);
  const hasMoreEvents = events.length > 4;

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-lg backdrop-blur-sm select-none">
      {/* Header Panel */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Activity
          </h3>
          <p className="text-[11px] text-[var(--psm-muted)] mt-0.5">
            Real-time audit trails and safety metrics change logs.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('History')} 
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-150 flex items-center gap-1 group bg-slate-800/40 px-2.5 py-1 rounded-md border border-slate-700/30"
        >
          <span>View full history</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Timeline Stream Container */}
      <div className="relative space-y-0.5">
        {visibleEvents.map((event, index) => {
          // Dynamic safety icons & color assignment based on risk type
          const isCritical = event.safety_critical || event.severity === 'Critical';
          const Icon = isCritical ? AlertTriangle : event.severity === 'Info' ? Activity : CheckCircle2;
          
          return (
            <div key={event.id} className="grid grid-cols-[28px_1fr] gap-3 group relative">
              {/* Left Timeline Track and Bullet Icon */}
              <div className="flex flex-col items-center relative">
                {/* Visual Connector Track line (hidden on the last element if no "view all" block follows) */}
                {(index < visibleEvents.length - 1 || hasMoreEvents) && (
                  <div className="absolute top-7 bottom-0 w-[2px] bg-slate-800/80 group-hover:bg-slate-700 transition-colors" />
                )}
                
                <div className={`mt-1.5 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
                  isCritical 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 group-hover:bg-red-500/20' 
                    : event.severity === 'Info'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 group-hover:bg-blue-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20'
                }`}>
                  <Icon size={14} className="shrink-0" />
                </div>
              </div>

              {/* Event Meta Blocks */}
              <div className={`${
                index === visibleEvents.length - 1 && !hasMoreEvents ? '' : 'border-b border-[var(--psm-line)]'
              } pb-4 pt-1.5 pr-1`}>
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors">
                    {event.event_title ?? event.title ?? event.event_type ?? 'System Event'}
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--psm-muted)] tabular-nums mt-0.5">
                    <Clock3 size={11} className="shrink-0 text-slate-500" />
                    {event.created_at 
                      ? new Date(event.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) 
                      : '—'}
                  </span>
                </div>

                {/* Event Summary Description */}
                <p className="mt-1 text-xs text-[var(--psm-muted)] leading-relaxed max-w-[95%]">
                  {event.event_description ?? event.description ?? event.related_section ?? 'No details provided.'}
                </p>

                {/* Actor Profile Label */}
                <div className="mt-3 flex items-center">
                  <HazopAvatar 
                    profile={event.actor} 
                    label={event.related_section ?? event.event_category ?? 'General Log'} 
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* View All Redirection Footer Anchor */}
        {hasMoreEvents && (
          <div className="grid grid-cols-[28px_1fr] gap-3 pt-2">
            <div className="flex justify-center items-center">
              <div className="h-2 w-2 rounded-full bg-slate-700 ring-4 ring-slate-800/40" />
            </div>
            <button
              onClick={() => onNavigate('History')}
              className="w-full text-left rounded-lg border border-slate-800/80 bg-slate-900/30 hover:bg-slate-800/40 border-dashed px-4 py-3 text-xs font-medium text-blue-400 hover:text-blue-300 transition-all duration-150 flex items-center justify-between group shadow-sm"
            >
              <span>Show {events.length - 4} more activities...</span>
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <span className="text-[11px] text-[var(--psm-muted)] mr-1">View All History</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* Dynamic Empty State Fallback */}
        {!events?.length && (
          <Empty text="No PHA or HAZOP activity logs have been captured yet." />
        )}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/10 p-7 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/40 text-slate-500 mb-2">
        <Activity size={16} />
      </div>
      <p className="text-xs text-[var(--psm-muted)] font-medium max-w-[240px] mx-auto leading-normal">
        {text}
      </p>
    </div>
  );
}