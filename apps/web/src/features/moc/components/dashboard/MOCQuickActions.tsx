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
    // Set to h-auto to dynamically scale tall layouts without overflow triggers
    <div className="w-full h-auto rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-start">
      
      {/* Header Block */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2 shrink-0">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Quick Actions
          </h3>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-800 uppercase tracking-wider">
          Operations Center
        </span>
      </div>

      {/* Action Content Stack (No scroll wrapper, layouts grow natively) */}
      <div className="flex flex-col gap-4 w-full">
        
        {/* Operations & Filter Workspace Grid */}
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {operations.map(({ label, icon: Icon, href, onClick, primary }) => {
            const buttonStyle = primary
              ? "border-sky-500/20 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:border-sky-400"
              : "border-slate-900 bg-slate-900/40 text-slate-300 hover:border-slate-800 hover:bg-slate-900/80 hover:text-white";

            return href ? (
              <Link
                key={label}
                href={href}
                className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all duration-200 group focus:outline-none truncate w-full ${buttonStyle}`}
              >
                <Icon size={14} className="shrink-0 transition-transform group-hover:scale-105" />
                <span className="truncate">{label}</span>
              </Link>
            ) : (
              <button
                key={label}
                onClick={onClick}
                className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all duration-200 text-left group focus:outline-none truncate w-full ${buttonStyle}`}
              >
                <Icon size={14} className="shrink-0 text-slate-400 group-hover:text-slate-300 transition-colors" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Exports Sub-Section */}
        <div className="mt-1 shrink-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Data Ledger Exports
          </p>
          
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
            {exports.map(({ label, type }) => {
              const isCurrentDownloading = downloadingReport === type;

              return (
                <button
                  key={label}
                  disabled={downloadingReport !== null}
                  onClick={() => downloadReport(type)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-900 bg-slate-950 px-3 text-xs font-bold text-slate-400 hover:text-slate-200 hover:border-slate-800 hover:bg-slate-900/30 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-left truncate w-full"
                >
                  {isCurrentDownloading ? (
                    <Loader2 size={14} className="animate-spin text-sky-400 shrink-0" />
                  ) : (
                    <Download size={14} className="text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}