'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  AlertOctagon, 
  ClipboardCheck, 
  Download, 
  FilePlus2, 
  Flame, 
  PauseCircle, 
  Rocket, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';
import { mocDashboardService } from '../../services/moc-dashboard.service';

type ReportType = 'register' | 'temporary' | 'high-critical' | 'audit-evidence';

export function MOCQuickActions() {
  const setFilters = useMOCDashboardStore((state) => state.setFilters);
  const [downloadingReport, setDownloadingReport] = useState<ReportType | null>(null);

  async function downloadReport(report: ReportType) {
    try {
      setDownloadingReport(report);
      const payload = await mocDashboardService.exportReport(report);
      const blob = new Blob([payload.content ?? ''], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = payload.fileName ?? `moc-${report}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to export ${report} report:`, error);
    } finally {
      setDownloadingReport(null);
    }
  }

  const operations = [
    { label: 'Create MOC Request', icon: FilePlus2, href: '/moc/new', primary: true },
    { label: 'High Risk Review', icon: ShieldAlert, onClick: () => setFilters({ risk_level: 'High' }) },
    { label: 'Temporary Changes', icon: PauseCircle, onClick: () => setFilters({ is_temporary: true }) },
    { label: 'Emergency Reviews', icon: Flame, onClick: () => setFilters({ is_emergency: true }) },
    { label: 'Overdue Actions', icon: AlertOctagon, onClick: () => setFilters({ overdue_actions: true }) },
    { label: 'PSSR Pending', icon: Rocket, onClick: () => setFilters({ pssr_pending: true }) },
    { label: 'Pending Approval', icon: ClipboardCheck, onClick: () => setFilters({ status: 'Submitted' }) },
    { label: 'Startup Blocked', icon: Rocket, onClick: () => setFilters({ startup_blocked: true }) },
    { label: 'Closure Blocked', icon: AlertOctagon, onClick: () => setFilters({ closure_blocked: true }) },
  ];

  const exports = [
    { label: 'Export MOC Register', type: 'register' as ReportType },
    { label: 'Export Temporary Report', type: 'temporary' as ReportType },
    { label: 'Export High/Critical Report', type: 'high-critical' as ReportType },
    { label: 'Export Audit Evidence', type: 'audit-evidence' as ReportType },
  ];

  return (
    <div className="w-full h-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-start transition-colors text-[var(--psm-fg)]">
      {/* Header Block */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-3 shrink-0">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--psm-fg)]">
            Quick Operations
          </h3>
        </div>
        <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--psm-muted)] border border-[var(--psm-line)] uppercase tracking-wider">
          Operations Center
        </span>
      </div>

      {/* Action Content Stack */}
      <div className="flex flex-col gap-4 w-full">
        {/* Operations & Filter Workspace Grid */}
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
          {operations.map(({ label, icon: Icon, href, onClick, primary }) => {
            const buttonStyle = primary
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)]";

            return href ? (
              <Link
                key={label}
                href={href}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors truncate w-full ${buttonStyle}`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ) : (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors text-left truncate w-full ${buttonStyle}`}
              >
                <Icon size={14} className="shrink-0 text-[var(--psm-muted)]" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Exports Sub-Section */}
        <div className="mt-1 shrink-0 pt-2 border-t border-[var(--psm-line)]">
          <p className="text-[10px] font-bold text-[var(--psm-muted)] uppercase tracking-wider mb-2">
            Audit Ledger Reports
          </p>
          
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {exports.map(({ label, type }) => {
              const isCurrentDownloading = downloadingReport === type;

              return (
                <button
                  key={type}
                  type="button"
                  disabled={Boolean(downloadingReport)}
                  onClick={() => downloadReport(type)}
                  className="inline-flex h-8 items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 text-[11px] font-bold text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-3)] disabled:opacity-50"
                >
                  <span className="truncate">{label}</span>
                  {isCurrentDownloading ? (
                    <Loader2 size={12} className="animate-spin text-primary shrink-0" />
                  ) : (
                    <Download size={12} className="text-[var(--psm-muted)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
