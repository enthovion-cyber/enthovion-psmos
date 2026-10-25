'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCcw, ShieldAlert, ShieldCheck, UserCheck, Zap } from 'lucide-react';
import { ptwService, type SceBypassCheckResult, type WorkforceCompetencyResult } from '@/services/ptw.service';

interface PTWSafetyPrecheckBannerProps {
  permitId: string;
}

export function PTWSafetyPrecheckBanner({ permitId }: PTWSafetyPrecheckBannerProps) {
  const [competency, setCompetency] = useState<WorkforceCompetencyResult | null>(null);
  const [sceBypass, setSceBypass] = useState<SceBypassCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const loadSafetyChecks = async () => {
    if (!permitId) return;
    setLoading(true);
    try {
      const [compRes, sceRes] = await Promise.all([
        ptwService.workforceCompetencyCheck(permitId).catch(() => null),
        ptwService.isolationSceBypassStatus(permitId).catch(() => null)
      ]);
      setCompetency(compRes);
      setSceBypass(sceRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSafetyChecks();
  }, [permitId]);

  const competencyBlockers = competency?.blockers ?? competency?.violations ?? [];
  const sceBlockers = sceBypass?.blockers ?? [];
  const allBlockers = [...competencyBlockers, ...sceBlockers];

  const isCompetencyCleared = competency ? (competency.isFullyCompliant ?? competency.cleared ?? competencyBlockers.length === 0) : true;
  const isSceCleared = sceBypass ? sceBlockers.length === 0 : true;
  const isAllCleared = isCompetencyCleared && isSceCleared;

  if (loading && !competency && !sceBypass) {
    return (
      <div className="col-span-full rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="font-semibold">Verifying OSHA 1910.119 Safety Gates (Workforce Competency & SCE Interlock Bypasses)...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`col-span-full rounded-xl border p-3.5 shadow-xs transition-all ${
        isAllCleared
          ? 'border-emerald-200/90 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20'
          : 'border-rose-300 dark:border-rose-500/40 bg-rose-50/80 dark:bg-rose-950/25'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              isAllCleared
                ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'border-rose-300 dark:border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300'
            }`}
          >
            {isAllCleared ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-xs font-bold uppercase tracking-wider ${
                  isAllCleared ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'
                }`}
              >
                {isAllCleared
                  ? 'Pre-Activation Safety Gates Verified'
                  : `Safety Gate Blockers Active (${allBlockers.length})`}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                <UserCheck size={11} className={isCompetencyCleared ? 'text-emerald-500' : 'text-rose-500'} />
                Competency: {isCompetencyCleared ? 'Pass' : `${competencyBlockers.length} Blocked`}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                <Zap size={11} className={isSceCleared ? 'text-emerald-500' : 'text-amber-500'} />
                SCE / SIF Bypass: {isSceCleared ? 'Clear' : `${sceBlockers.length} Pending`}
              </span>
            </div>
            <p
              className={`mt-1 text-xs ${
                isAllCleared ? 'text-emerald-800/80 dark:text-emerald-300/80' : 'text-rose-800/90 dark:text-rose-300/90'
              }`}
            >
              {isAllCleared
                ? 'All assigned workers hold active role certifications and all Safety Critical Element (SCE) isolations are authorized.'
                : 'Permit issue or field activation is restricted until all competency and safety barrier bypass gates are satisfied.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {allBlockers.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="rounded-lg border border-rose-300 dark:border-rose-500/30 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-slate-800 transition"
            >
              {expanded ? 'Hide Details' : 'View Blockers'}
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadSafetyChecks()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
            Re-Verify
          </button>
        </div>
      </div>

      {!isAllCleared && (expanded || allBlockers.length <= 3) && (
        <div className="mt-3 border-t border-rose-200/80 dark:border-rose-500/20 pt-2.5">
          <ul className="space-y-1.5">
            {allBlockers.map((blocker, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-white/60 dark:bg-slate-950/50 px-2.5 py-1.5 text-xs font-medium text-rose-900 dark:text-rose-200"
              >
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-500" />
                <span>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PTWSafetyPrecheckBanner;
