'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileDiff,
  FileText,
  HelpCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { copilotService } from '../services/copilot.service';
import type { DocumentCompareResponse } from '../types';

export function DocumentCompareModal({
  isOpen,
  onClose,
  defaultDocA,
  defaultDocB
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultDocA?: { title: string; text: string; revision?: string };
  defaultDocB?: { title: string; text: string; revision?: string };
}) {
  const [docA, setDocA] = useState(
    defaultDocA || { title: 'Procedure SOP-042 (Rev 2.1)', revision: '2.1', text: '' }
  );
  const [docB, setDocB] = useState(
    defaultDocB || { title: 'Procedure SOP-042 (Rev 3.0 Draft)', revision: '3.0', text: '' }
  );
  const [result, setResult] = useState<DocumentCompareResponse | null>(null);

  const compareMutation = useMutation({
    mutationFn: copilotService.compareDocuments,
    onSuccess: (data) => setResult(data)
  });

  if (!isOpen) return null;

  const handleCompare = () => {
    if (!docA.text.trim() || !docB.text.trim() || compareMutation.isPending) return;
    compareMutation.mutate({ docA, docB });
  };

  const getBadgeStyle = (sig: string) => {
    switch (sig) {
      case 'CRITICAL_SAFETY':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[var(--psm-surface)] border border-[var(--psm-line)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <FileDiff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Document AI Comparison & Diff</h2>
              <p className="text-xs text-[var(--psm-muted)]">
                Identify process safety deviations, safe operating limit changes, and tag mismatches between document revisions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--psm-muted)] hover:text-[var(--psm-fg)] p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Document / Baseline A</span>
              </div>
              <input
                type="text"
                placeholder="Document Title"
                value={docA.title}
                onChange={(e) => setDocA({ ...docA, title: e.target.value })}
                className="psm-input w-full px-3 py-1.5 text-xs font-medium"
              />
              <textarea
                rows={5}
                placeholder="Paste baseline procedure text or technical limits..."
                value={docA.text}
                onChange={(e) => setDocA({ ...docA, text: e.target.value })}
                className="psm-input w-full p-2.5 text-xs font-mono"
              />
            </div>

            <div className="space-y-2 p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Document / Revision B</span>
              </div>
              <input
                type="text"
                placeholder="Document Title"
                value={docB.title}
                onChange={(e) => setDocB({ ...docB, title: e.target.value })}
                className="psm-input w-full px-3 py-1.5 text-xs font-medium"
              />
              <textarea
                rows={5}
                placeholder="Paste revised procedure text or new specification..."
                value={docB.text}
                onChange={(e) => setDocB({ ...docB, text: e.target.value })}
                className="psm-input w-full p-2.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCompare}
              disabled={!docA.text.trim() || !docB.text.trim() || compareMutation.isPending}
              className="psm-button psm-button-primary flex items-center gap-2 px-5 py-2 text-sm shadow-sm"
            >
              {compareMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Run Safety AI Comparison
            </button>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-[var(--psm-line)]">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider mb-1">
                  Executive AI Summary
                </div>
                <p className="text-sm text-blue-950 dark:text-blue-100">{result.summary}</p>
              </div>

              {/* Discrepancies Table */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Identified Safety Discrepancies ({result.discrepancies?.length || 0})
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[var(--psm-surface-2)] border-b border-[var(--psm-line)] text-[var(--psm-muted)] uppercase">
                        <th className="py-2.5 px-3">Parameter / Item</th>
                        <th className="py-2.5 px-3">Document A Value</th>
                        <th className="py-2.5 px-3">Document B Value</th>
                        <th className="py-2.5 px-3">Safety Significance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--psm-line)]">
                      {result.discrepancies.map((d, i) => (
                        <tr key={i} className="hover:bg-[var(--psm-surface-2)] transition">
                          <td className="py-2.5 px-3 font-semibold">{d.field}</td>
                          <td className="py-2.5 px-3 font-mono text-[var(--psm-muted)]">{d.docAValue}</td>
                          <td className="py-2.5 px-3 font-mono font-medium text-[var(--psm-fg)]">
                            {d.docBValue}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${getBadgeStyle(
                                d.significance
                              )}`}
                            >
                              {d.significance.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unresolved Questions */}
              {result.unresolvedQuestions?.length > 0 && (
                <div className="p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] space-y-2">
                  <div className="text-xs font-semibold uppercase text-[var(--psm-muted)] flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    <span>Specialist Review Questions Required</span>
                  </div>
                  <ul className="list-disc list-inside text-xs space-y-1 text-[var(--psm-fg)]">
                    {result.unresolvedQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--psm-line)] bg-[var(--psm-surface-2)] flex justify-end">
          <button onClick={onClose} className="psm-button border border-[var(--psm-line)] px-4 py-1.5 text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
