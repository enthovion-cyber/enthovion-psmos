'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users
} from 'lucide-react';
import { api } from '@/services/api';

const unwrap = <T,>(response: { data: { data: T } | T }) => {
  const d = response.data;
  if (d && typeof d === 'object' && 'data' in d) {
    return (d as { data: T }).data;
  }
  return d as T;
};

export function MOCImpactAIPanel({ mocId }: { mocId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const query = useQuery({
    queryKey: ['ai', 'moc', mocId, 'impact-analysis'],
    queryFn: () => api.get(`/ai/moc/${mocId}/impact-analysis`).then(unwrap<any>),
    enabled: isOpen
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH_RISK':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
      case 'MEDIUM_RISK':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 overflow-hidden shadow-xs transition-all">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--psm-fg)]">
                AI Process Safety Impact Advisor
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 uppercase">
                OpenAI Analysis
              </span>
            </div>
            <p className="text-xs text-[var(--psm-muted)] mt-0.5">
              Assesses secondary impacts across PSI, PHA, Procedures, Training, and suggested specialist reviewers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1"
          >
            {isOpen ? 'Hide Insights' : 'Inspect Impact Insights'}
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="p-5 border-t border-[var(--psm-line)] bg-[var(--psm-surface)] space-y-5">
          {query.isLoading ? (
            <div className="flex items-center justify-center p-6 text-xs text-[var(--psm-muted)] gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>Analyzing engineering change dependencies with OpenAI...</span>
            </div>
          ) : query.data ? (
            <>
              {/* Executive Summary */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-100 leading-relaxed">
                <strong>Analysis Summary:</strong> {query.data.summary}
              </div>

              {/* Identified Element Impacts */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Identified Cross-Element Safety Impacts ({query.data.identifiedImpacts?.length || 0})
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {query.data.identifiedImpacts?.map((imp: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--psm-fg)]">
                            [{imp.category.replace('_', ' ')}] {imp.affectedItem}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold border ${getSeverityBadge(
                              imp.severity
                            )}`}
                          >
                            {imp.severity.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[var(--psm-muted)] leading-relaxed">{imp.finding}</p>
                      </div>

                      <div className="md:max-w-xs shrink-0 p-2 rounded bg-[var(--psm-surface)] border border-[var(--psm-line)] text-[11px]">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Action: </span>
                        <span>{imp.recommendedAction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewers & Regulatory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Suggested Reviewers */}
                <div className="p-3.5 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" />
                    Recommended Specialist Reviewers
                  </h4>
                  <ul className="text-xs space-y-1.5">
                    {query.data.suggestedSpecialistReviewers?.map((rev: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-semibold text-[var(--psm-fg)]">• {rev.role}:</span>
                        <span className="text-[var(--psm-muted)]">{rev.rationale}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pre-Closure Gaps */}
                <div className="p-3.5 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-500" />
                    Mandatory Closure Verification Gaps
                  </h4>
                  <ul className="text-xs space-y-1 text-[var(--psm-muted)] list-disc list-inside">
                    {query.data.closureEvidenceGaps?.map((gap: string, idx: number) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Governance Disclaimer */}
              <div className="text-[11px] text-[var(--psm-muted)] italic pt-1 border-t border-[var(--psm-line)]">
                {query.data.disclaimer}
              </div>
            </>
          ) : (
            <div className="text-xs text-[var(--psm-muted)] p-2">Unable to load AI analysis.</div>
          )}
        </div>
      )}
    </div>
  );
}
