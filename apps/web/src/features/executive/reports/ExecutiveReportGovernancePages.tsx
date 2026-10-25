'use client';

import React, { useState } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';
import {
  useExecutiveReportAudiences,
  useExecutiveReportSchedules,
  useExecutiveReportStaleness,
  useExecutiveReportMutations,
} from '../hooks/useExecutiveReports';
import {
  ExecutiveReportsNav,
  ExecutiveReportsHeader,
  ExecutiveReportIntegrityNotice,
} from './ExecutiveReportsShared';
import type {
  ExecutiveReportAudienceProfile,
  ExecutiveReportSchedule,
  ExecutiveReportStalenessEvent,
} from '../types/executive-report.types';

export function ExecutiveReportAudiencesPage() {
  const audiencesQuery = useExecutiveReportAudiences();
  const mutations = useExecutiveReportMutations();

  const audiences = (audiencesQuery.data?.rows ?? []) as ExecutiveReportAudienceProfile[];

  const [createOpen, setCreateOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileCode, setProfileCode] = useState('');
  const [classificationLevel, setClassificationLevel] = useState('Internal');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileCode.trim()) return;
    await mutations.saveAudience.mutateAsync({
      name: profileName.trim(),
      code: profileCode.trim(),
      classificationLevel,
    });
    setCreateOpen(false);
    setProfileName('');
    setProfileCode('');
    audiencesQuery.refetch();
  };

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Audience Profiles & Access Boundaries"
        subtitle="Configure recipient stakeholder tiers, default confidentiality classifications, and mandatory disclosures."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--psm-primary-hover)] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Profile</span>
          </button>
        }
      />

      <ExecutiveReportIntegrityNotice readinessRate={100} missingSourcesCount={0} />

      {createOpen && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Create Audience Profile
            </h2>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="text-xs text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Profile Name
              </label>
              <input
                type="text"
                placeholder="e.g. Board Safety Committee"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Profile Code
              </label>
              <input
                type="text"
                placeholder="e.g. ERA-BOARD"
                value={profileCode}
                onChange={(e) => setProfileCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none font-mono"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Classification Level
              </label>
              <select
                value={classificationLevel}
                onChange={(e) => setClassificationLevel(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
              >
                <option value="Internal">Internal</option>
                <option value="Board Confidential">Board Confidential</option>
                <option value="Restricted">Restricted</option>
                <option value="Public">Public</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-md border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.saveAudience.isPending}
              className="rounded-md bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {mutations.saveAudience.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {audiencesQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Loading audience profiles...</span>
          </div>
        </div>
      ) : audiences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
          No audience profiles defined yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((aud) => (
            <div
              key={aud.id}
              className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[var(--psm-primary)]">
                  {aud.profile_code}
                </span>
                <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-[11px] font-bold text-[var(--psm-muted)]">
                  {aud.classification_level}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-[var(--psm-text)]">
                {aud.profile_name}
              </h3>
              <div className="mt-3 text-[11px] text-[var(--psm-muted)]">
                Dynamic watermark stamping applied to all distributions.
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export function ExecutiveReportSchedulesPage() {
  const schedulesQuery = useExecutiveReportSchedules();
  const mutations = useExecutiveReportMutations();

  const schedules = (schedulesQuery.data?.rows ?? []) as ExecutiveReportSchedule[];

  const [createOpen, setCreateOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleCode, setScheduleCode] = useState('');
  const [cronExpression, setCronExpression] = useState('0 0 1 * *');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName.trim() || !scheduleCode.trim()) return;
    await mutations.saveSchedule.mutateAsync({
      name: scheduleName.trim(),
      code: scheduleCode.trim(),
      cronExpression,
    });
    setCreateOpen(false);
    setScheduleName('');
    setScheduleCode('');
    schedulesQuery.refetch();
  };

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Automated Report Schedules"
        subtitle="Recurring package compilation, automated cut-off snapshotting, and scheduled publication."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--psm-primary-hover)] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Schedule</span>
          </button>
        }
      />

      <ExecutiveReportIntegrityNotice readinessRate={100} missingSourcesCount={0} />

      {createOpen && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Create Report Schedule
            </h2>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="text-xs text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Schedule Name
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly PSM Health Dispatch"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Schedule Code
              </label>
              <input
                type="text"
                placeholder="e.g. ERS-MONTHLY"
                value={scheduleCode}
                onChange={(e) => setScheduleCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none font-mono"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Cron Expression
              </label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-md border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.saveSchedule.isPending}
              className="rounded-md bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {mutations.saveSchedule.isPending ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      )}

      {schedulesQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Loading report schedules...</span>
          </div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
          No automated schedules defined yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="px-4 py-3">Schedule Name & Code</th>
                <th className="px-3 py-3">Cron Expression</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Next Scheduled Run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--psm-text)]">{s.schedule_name}</div>
                    <div className="font-mono text-[11px] text-[var(--psm-muted)]">{s.schedule_code}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[var(--psm-muted)]">
                    {s.cron_expression}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-500">
                      {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">
                    {s.next_run_at ? new Date(s.next_run_at).toLocaleString() : 'Pending trigger'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export function ExecutiveReportStalenessPage() {
  const stalenessQuery = useExecutiveReportStaleness();
  const mutations = useExecutiveReportMutations();

  const events = (stalenessQuery.data?.rows ?? []) as ExecutiveReportStalenessEvent[];

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Staleness Detection & Source Lineage Drift"
        subtitle="Continuously monitor underlying modules (PTW, MOC, CAPA, Incident) to alert when published or draft report snapshots become out of sync."
        actions={
          <button
            type="button"
            onClick={() => mutations.triggerStaleness.mutate()}
            disabled={mutations.triggerStaleness.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--psm-primary-hover)] transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${mutations.triggerStaleness.isPending ? 'animate-spin' : ''}`} />
            <span>Scan Staleness Now</span>
          </button>
        }
      />

      <ExecutiveReportIntegrityNotice readinessRate={100} missingSourcesCount={events.length} />

      {stalenessQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Scanning for source drift events...</span>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <h3 className="mt-2 text-sm font-semibold text-[var(--psm-text)]">
            All Report Snapshots are Current
          </h3>
          <p className="mt-1">
            No source module drift or outdated snapshots detected across active reports.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-[var(--psm-text)]">
                    Source Drift: {evt.source_module_code}
                  </span>
                </div>
                <div className="mt-1 text-[var(--psm-muted)]">
                  Report ID: {evt.report_id} · Detected {new Date(evt.detected_at).toLocaleString()}
                </div>
              </div>
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">
                Stale Drift
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
