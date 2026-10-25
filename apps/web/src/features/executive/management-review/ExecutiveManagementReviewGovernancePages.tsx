'use client';

import React, { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  useManagementReviewCalendar,
  useManagementReviewTemplates,
  useManagementReviewSettings,
  useManagementReviewRegister,
  useManagementReviewMutations,
} from '../hooks/useExecutiveManagementReview';
import {
  ManagementReviewHeader,
  ManagementReviewNav,
  ManagementReviewEmptyState,
  cardStyle,
  buttonStyle,
  primaryButtonStyle,
  inputStyle,
} from './ExecutiveManagementReviewShared';
import {
  MeetingStatusBadge,
  QuorumBadge,
} from './ManagementReviewBadges';

// ---------------------------------------------------------------------------
// 1. Management Review Calendar Page
// ---------------------------------------------------------------------------
export function ExecutiveManagementReviewCalendarPage() {
  const query = useManagementReviewCalendar();
  const meetings = query.data ?? [];

  const now = new Date().getTime();
  const upcoming = meetings.filter((m: any) => new Date(m.startAt || m.scheduled_start_at || 0).getTime() >= now);
  const past = meetings.filter((m: any) => new Date(m.startAt || m.scheduled_start_at || 0).getTime() < now);

  return (
    <main className="space-y-6">
      <ManagementReviewNav activeTab="calendar" />

      <ManagementReviewHeader
        title="Management Review Governance Calendar"
        description="Chronological schedule of executive and site-level PSM management reviews across active sites and business units."
      />

      {/* Summary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className={cardStyle}>
          <p className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Total Scheduled</p>
          <p className="mt-2 text-3xl font-black text-[var(--psm-text)]">{meetings.length}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Active governance cycles</p>
        </div>
        <div className={cardStyle}>
          <p className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Upcoming Reviews</p>
          <p className="mt-2 text-3xl font-black text-[var(--psm-primary)]">{upcoming.length}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Pending leadership convening</p>
        </div>
        <div className={cardStyle}>
          <p className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Completed / Past</p>
          <p className="mt-2 text-3xl font-black text-emerald-500">{past.length}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Minutes locked or adjourned</p>
        </div>
      </section>

      {/* Upcoming Meetings Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--psm-text)]">Upcoming Scheduled Sessions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((meeting: any) => {
            const startDate = meeting.startAt || meeting.scheduled_start_at;
            const endDate = meeting.endAt || meeting.scheduled_end_at;
            return (
              <div key={meeting.id} className={`${cardStyle} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs text-[var(--psm-muted)]">
                      {meeting.meeting_code || meeting.code || 'MEET'}
                    </span>
                    <MeetingStatusBadge status={meeting.status || meeting.meeting_status || 'scheduled'} />
                  </div>
                  <h3 className="mt-2 text-base font-bold text-[var(--psm-text)]">
                    {meeting.title || meeting.meeting_title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--psm-muted)]">
                    {meeting.site_name ? `Site: ${meeting.site_name} · ` : ''}
                    {startDate ? new Date(startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unscheduled'}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--psm-primary)]">
                    {startDate ? new Date(startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {endDate ? ` – ${new Date(endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--psm-line)] pt-3">
                  <div className="flex items-center gap-2">
                    <QuorumBadge satisfied={meeting.quorum_status === 'satisfied' || meeting.quorum_status === 'quorum_met' || Boolean(meeting.quorum_satisfied)} />
                  </div>
                  <Link
                    href={meeting.route || `/executive/management-review/meetings`}
                    className={`${buttonStyle} text-xs font-semibold`}
                  >
                    Open Workspace
                  </Link>
                </div>
              </div>
            );
          })}

          {upcoming.length === 0 && !query.isLoading && (
            <div className="col-span-2">
              <ManagementReviewEmptyState
                title="No upcoming management reviews"
                message="No upcoming review sessions are scheduled in the calendar for your active site scope."
              />
            </div>
          )}
        </div>
      </section>

      {/* Past Meetings List */}
      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--psm-text)]">Past Review Sessions</h2>
          <div className={`${cardStyle} overflow-x-auto`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
                <tr>
                  <th className="pb-3">Session</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {past.map((meeting: any) => (
                  <tr key={meeting.id}>
                    <td className="py-3">
                      <p className="font-semibold text-[var(--psm-text)]">{meeting.title || meeting.meeting_title}</p>
                      <p className="font-mono text-xs text-[var(--psm-muted)]">{meeting.meeting_code || meeting.code}</p>
                    </td>
                    <td className="py-3 text-xs text-[var(--psm-muted)]">
                      {meeting.startAt || meeting.scheduled_start_at
                        ? new Date(meeting.startAt || meeting.scheduled_start_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3">
                      <MeetingStatusBadge status={meeting.status || meeting.meeting_status || 'completed'} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={meeting.route || `/executive/management-review/meetings`}
                        className={`${buttonStyle} text-xs`}
                      >
                        Review Minutes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// 2. Agenda Templates Page
// ---------------------------------------------------------------------------
export function ExecutiveManagementReviewTemplatesPage() {
  const query = useManagementReviewTemplates();
  const mutations = useManagementReviewMutations();

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const raw = query.data as any;
  const templates: any[] = Array.isArray(raw) ? raw : (raw?.rows ?? []);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    // Use default standard 8 PSM agenda items for enterprise templates
    const defaultSections = [
      { sortOrder: 1, title: 'Follow-up on Previous Commitments & Actions', durationMinutes: 15, presenterRole: 'PSM Lead' },
      { sortOrder: 2, title: 'Changes in Organization & Regulations (MOC / PSI)', durationMinutes: 15, presenterRole: 'Regulatory Lead' },
      { sortOrder: 3, title: 'PSM Element Health Scoring & Scorecards', durationMinutes: 20, presenterRole: 'Process Safety Architect' },
      { sortOrder: 4, title: 'Incidents, Near Misses & Investigation Learnings', durationMinutes: 20, presenterRole: 'HSE Manager' },
      { sortOrder: 5, title: 'Critical Risk Cockpit & Barrier Impairments', durationMinutes: 20, presenterRole: 'Risk Lead' },
      { sortOrder: 6, title: 'Audit & Compliance Assurance Results', durationMinutes: 15, presenterRole: 'Audit Lead' },
      { sortOrder: 7, title: 'Mechanical Integrity & Equipment Reliability', durationMinutes: 15, presenterRole: 'Maintenance Manager' },
      { sortOrder: 8, title: 'Executive Decisions & Management Commitments', durationMinutes: 20, presenterRole: 'Executive Chair' },
    ];

    mutations.saveTemplate.mutate(
      { body: { template_code: code, template_title: title, description, sections: defaultSections } },
      {
        onSuccess: () => {
          setCode('');
          setTitle('');
          setDescription('');
          setShowCreate(false);
        },
      }
    );
  };

  return (
    <main className="space-y-6">
      <ManagementReviewNav activeTab="templates" />

      <ManagementReviewHeader
        title="Standard Agenda & Governance Templates"
        description="Pre-configured PSM management review agendas compliant with OSHA 1910.119, CCPS RBPS, and ISO 45001."
      />

      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={primaryButtonStyle}
        >
          {showCreate ? 'Close Template Creator' : '+ Create Custom Agenda Template'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className={`${cardStyle} space-y-4 border-l-4 border-l-[var(--psm-primary)]`}>
          <h3 className="font-bold text-[var(--psm-text)]">New Management Review Template</h3>
          <p className="text-xs text-[var(--psm-muted)]">
            Includes standard CCPS / OSHA 8-item agenda sequence that will be cloned when scheduling meetings.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[var(--psm-text)]">Template Code *</label>
              <input
                required
                placeholder="e.g. TPL-ANNUAL-PSM"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputStyle} mt-1 w-full`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--psm-text)]">Template Title *</label>
              <input
                required
                placeholder="e.g. Annual Executive PSM Governance Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${inputStyle} mt-1 w-full`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--psm-text)]">Description / Scope</label>
            <textarea
              placeholder="Scope, intended frequency, and mandatory attendees..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputStyle} mt-1 h-20 w-full resize-none`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className={buttonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.saveTemplate.isPending}
              className={primaryButtonStyle}
            >
              {mutations.saveTemplate.isPending ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      )}

      {/* Templates Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl: any) => {
          const sections = tpl.sections || [];
          return (
            <div key={tpl.id} className={`${cardStyle} flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--psm-primary)]">
                    {tpl.template_code || tpl.code}
                  </span>
                  <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs text-[var(--psm-muted)]">
                    {tpl.company_id ? 'Tenant Custom' : 'Global Standard'}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-[var(--psm-text)]">
                  {tpl.template_title || tpl.title}
                </h3>
                {tpl.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--psm-muted)]">{tpl.description}</p>
                )}

                <div className="mt-4 border-t border-[var(--psm-line)] pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                    Agenda Sections ({sections.length || 8} Topics)
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--psm-text)]">
                    {(sections.length > 0 ? sections.slice(0, 4) : [
                      'Follow-up on Previous Commitments',
                      'PSM Element Health & Scorecards',
                      'Critical Risk Cockpit & Impairments',
                      'Executive Decisions & Commitments',
                    ]).map((s: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5 truncate">
                        <span className="text-[var(--psm-muted)]">{idx + 1}.</span>
                        <span className="truncate">{typeof s === 'string' ? s : s.title}</span>
                      </li>
                    ))}
                  </ul>
                  {sections.length > 4 && (
                    <p className="mt-1 text-xs text-[var(--psm-muted)]">+ {sections.length - 4} more sections</p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-[var(--psm-line)] pt-3">
                <Link
                  href="/executive/management-review/meetings"
                  className={`${buttonStyle} w-full text-center text-xs font-semibold`}
                >
                  Use for New Meeting
                </Link>
              </div>
            </div>
          );
        })}

        {templates.length === 0 && !query.isLoading && (
          <div className="col-span-3">
            <ManagementReviewEmptyState
              title="No templates configured"
              message="Create your organization's first standard PSM management review agenda template."
            />
          </div>
        )}
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// 3. Governance Settings Page
// ---------------------------------------------------------------------------
export function ExecutiveManagementReviewSettingsPage() {
  const query = useManagementReviewSettings();
  const mutations = useManagementReviewMutations();

  const current = (query.data as any) ?? {};

  const [requireMinutesApproval, setRequireMinutesApproval] = useState(
    current.require_minutes_approval ?? true
  );
  const [requireDecisionApproval, setRequireDecisionApproval] = useState(
    current.require_decision_approval ?? true
  );
  const [allowWarnings, setAllowWarnings] = useState(
    current.allow_package_publish_with_warnings ?? false
  );
  const [freshnessHours, setFreshnessHours] = useState(
    String(current.minimum_package_freshness_hours ?? 24)
  );
  const [quorumPercent, setQuorumPercent] = useState(
    String(current.quorum_minimum_percentage ?? 75)
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    mutations.saveSettings.mutate(
      {
        requireMinutesApproval,
        requireDecisionApproval,
        allowPackagePublishWithWarnings: allowWarnings,
        minimumPackageFreshnessHours: Number(freshnessHours),
        quorumMinimumPercentage: Number(quorumPercent),
      },
      {
        onSuccess: () => {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 4000);
        },
      }
    );
  };

  return (
    <main className="space-y-6">
      <ManagementReviewNav activeTab="settings" />

      <ManagementReviewHeader
        title="Management Review Governance Settings"
        description="Configure strict enterprise governance rules, workflow approval policies, quorum thresholds, and data snapshot freshness."
      />

      {savedSuccess && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-500">
          ✓ Governance settings saved successfully. New rules are now active for your company.
        </div>
      )}

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-2">
        {/* Workflow Approval Gate Policies */}
        <section className={`${cardStyle} space-y-4`}>
          <h3 className="border-b border-[var(--psm-line)] pb-2 font-bold text-[var(--psm-text)]">
            Workflow Approvals & Signatures
          </h3>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[var(--psm-line)]"
              checked={requireMinutesApproval}
              onChange={(e) => setRequireMinutesApproval(e.target.checked)}
            />
            <div>
              <p className="font-semibold text-[var(--psm-text)]">Mandatory Approval for Meeting Minutes</p>
              <p className="text-xs text-[var(--psm-muted)]">
                Meeting minutes must be approved by designated leadership before becoming immutable and published.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[var(--psm-line)]"
              checked={requireDecisionApproval}
              onChange={(e) => setRequireDecisionApproval(e.target.checked)}
            />
            <div>
              <p className="font-semibold text-[var(--psm-text)]">Mandatory Executive Sign-off for Decisions</p>
              <p className="text-xs text-[var(--psm-muted)]">
                Executive decisions require explicit authority validation and formal review approval before entering approved state.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[var(--psm-line)]"
              checked={allowWarnings}
              onChange={(e) => setAllowWarnings(e.target.checked)}
            />
            <div>
              <p className="font-semibold text-[var(--psm-text)]">Permit Package Publication with Advisory Warnings</p>
              <p className="text-xs text-[var(--psm-muted)]">
                If checked, review packages can be published when advisory warnings exist (blockers still prevent publication).
              </p>
            </div>
          </label>
        </section>

        {/* Quorum & Freshness Thresholds */}
        <section className={`${cardStyle} space-y-4`}>
          <h3 className="border-b border-[var(--psm-line)] pb-2 font-bold text-[var(--psm-text)]">
            Freshness & Quorum Thresholds
          </h3>

          <div>
            <label className="text-xs font-semibold text-[var(--psm-text)]">
              Data Freshness Window (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={freshnessHours}
              onChange={(e) => setFreshnessHours(e.target.value)}
              className={`${inputStyle} mt-1 w-full`}
            />
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Operational KPI and risk metrics older than this window trigger readiness warnings.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--psm-text)]">
              Minimum Attendee Quorum Requirement (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={quorumPercent}
              onChange={(e) => setQuorumPercent(e.target.value)}
              className={`${inputStyle} mt-1 w-full`}
            />
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Meetings will fail quorum verification if attendee attendance falls below this percentage.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={mutations.saveSettings.isPending}
              className={`${primaryButtonStyle} w-full`}
            >
              {mutations.saveSettings.isPending ? 'Saving Policies...' : 'Save Governance Policies'}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}

// ---------------------------------------------------------------------------
// 4. Governance History / Audit Trail Page
// ---------------------------------------------------------------------------
export function ExecutiveManagementReviewHistoryPage() {
  const query = useManagementReviewRegister('history');
  const raw = query.data as any;
  const events: any[] = Array.isArray(raw) ? raw : (raw?.rows ?? []);

  const [filterType, setFilterType] = useState('');

  const filtered = events.filter((e) => {
    if (!filterType) return true;
    return e.event_type === filterType || e.action === filterType;
  });

  return (
    <main className="space-y-6">
      <ManagementReviewNav activeTab="history" />

      <ManagementReviewHeader
        title="Management Review Audit Trail & Governance Log"
        description="Immutable, tamper-evident record of all executive decisions, cycle transitions, package publications, and sign-offs."
      />

      <div className={`${cardStyle} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-[var(--psm-text)]">Filter Event Type:</label>
          <select
            className={inputStyle}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Governance Events</option>
            <option value="cycle_created">Cycle Created</option>
            <option value="cycle_activated">Cycle Activated</option>
            <option value="meeting_convened">Meeting Convened</option>
            <option value="package_published">Package Published</option>
            <option value="decision_approved">Decision Approved</option>
            <option value="commitment_assigned">Commitment Assigned</option>
            <option value="commitment_carried_forward">Commitment Carried Forward</option>
          </select>
        </div>

        <span className="text-xs text-[var(--psm-muted)]">
          {filtered.length} Recorded Governance Events
        </span>
      </div>

      <div className={`${cardStyle} overflow-x-auto`}>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Event</th>
              <th className="pb-3">Actor</th>
              <th className="pb-3">Target Scope</th>
              <th className="pb-3">Summary / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {filtered.map((item: any) => (
              <tr key={item.id} className="hover:bg-[var(--psm-surface-2)]/30">
                <td className="py-3 text-xs text-[var(--psm-muted)] font-mono whitespace-nowrap">
                  {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                </td>
                <td className="py-3">
                  <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--psm-primary)]">
                    {item.event_type || item.action || 'governance_event'}
                  </span>
                </td>
                <td className="py-3 text-xs font-medium text-[var(--psm-text)]">
                  {item.actor_name || item.actor_id?.slice(0, 8) || 'System / Governance Engine'}
                </td>
                <td className="py-3 text-xs text-[var(--psm-muted)]">
                  {item.entity_type || 'ManagementReview'}
                  {item.entity_id ? ` #${item.entity_id.slice(0, 8)}` : ''}
                </td>
                <td className="py-3 text-xs text-[var(--psm-text)] max-w-xs truncate">
                  {item.event_title || item.summary || item.notes || JSON.stringify(item.payload ?? {})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && !query.isLoading && (
          <ManagementReviewEmptyState
            title="No audit events found"
            message="No governance audit log entries have been recorded matching your criteria."
          />
        )}
      </div>
    </main>
  );
}
