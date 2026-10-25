'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  HelpCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  XCircle
} from 'lucide-react';
import { copilotService } from '../services/copilot.service';
import type { LopaCalculationResult } from '../types';

export function LopaCalculatorModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [initiatingFrequency, setInitiatingFrequency] = useState('0.1');
  const [targetFrequency, setTargetFrequency] = useState('0.0001');
  const [pfds, setPfds] = useState<string[]>(['0.1', '0.01']);
  const [result, setResult] = useState<LopaCalculationResult | null>(null);

  const lopaMutation = useMutation({
    mutationFn: copilotService.calculateLopa,
    onSuccess: (data) => setResult(data)
  });

  if (!isOpen) return null;

  const handleCalculate = () => {
    const f = parseFloat(initiatingFrequency);
    const t = parseFloat(targetFrequency);
    const pfdNumbers = pfds.map((p) => (p.trim() ? parseFloat(p) : NaN));

    lopaMutation.mutate({
      initiatingEventFrequencyPerYear: isNaN(f) ? undefined : f,
      targetMitigatedFrequencyPerYear: isNaN(t) ? undefined : t,
      iplPfds: pfdNumbers
    });
  };

  const handleAddIpl = () => {
    setPfds([...pfds, '0.1']);
  };

  const handleRemoveIpl = (index: number) => {
    setPfds(pfds.filter((_, i) => i !== index));
  };

  const handleUpdatePfd = (index: number, val: string) => {
    const next = [...pfds];
    next[index] = val;
    setPfds(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[var(--psm-surface)] border border-[var(--psm-line)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Deterministic LOPA Calculation Engine</h2>
              <p className="text-xs text-[var(--psm-muted)]">
                Validated quantitative layer of protection analysis. Runs deterministic arithmetic—never LLM estimates.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--psm-muted)] hover:text-[var(--psm-fg)] p-1 rounded-md">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider">
                Initiating Event Frequency (events/year)
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="e.g. 0.1"
                value={initiatingFrequency}
                onChange={(e) => setInitiatingFrequency(e.target.value)}
                className="psm-input w-full px-3 py-1.5 text-sm font-mono"
              />
              <span className="text-[11px] text-[var(--psm-muted)]">e.g. 0.1 = once every 10 years</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider">
                Target Mitigated Frequency (events/year)
              </label>
              <input
                type="number"
                step="0.00001"
                placeholder="e.g. 0.0001"
                value={targetFrequency}
                onChange={(e) => setTargetFrequency(e.target.value)}
                className="psm-input w-full px-3 py-1.5 text-sm font-mono"
              />
              <span className="text-[11px] text-[var(--psm-muted)]">e.g. 1e-4 = once per 10,000 years</span>
            </div>
          </div>

          {/* Independent Protection Layers (IPL) */}
          <div className="space-y-2 pt-2 border-t border-[var(--psm-line)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider">
                Independent Protection Layers (IPL PFD values)
              </label>
              <button
                type="button"
                onClick={handleAddIpl}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add IPL
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pfds.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--psm-muted)] w-14">IPL #{idx + 1}:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="Probability of failure on demand (0 < PFD <= 1)"
                    value={p}
                    onChange={(e) => handleUpdatePfd(idx, e.target.value)}
                    className="psm-input flex-1 px-3 py-1 text-sm font-mono"
                  />
                  {pfds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIpl(idx)}
                      className="p-1 text-[var(--psm-muted)] hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCalculate}
              disabled={lopaMutation.isPending}
              className="psm-button psm-button-primary flex items-center gap-2 px-5 py-2 text-sm shadow-sm"
            >
              {lopaMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Execute Deterministic LOPA
            </button>
          </div>

          {/* Results Output */}
          {result && (
            <div className="p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] space-y-3">
              {result.status === 'calculated' ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--psm-line)]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                      LOPA Calculation Result
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
                        result.meetsTarget
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {result.meetsTarget ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Target Met
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Target Not Met
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--psm-muted)]">Mitigated Frequency:</span>
                      <div className="font-mono text-base font-bold mt-0.5">
                        {result.mitigatedFrequencyPerYear.toExponential(4)} / yr
                      </div>
                    </div>
                    <div>
                      <span className="text-[var(--psm-muted)]">Risk Reduction Factor (RRF):</span>
                      <div className="font-mono text-base font-bold mt-0.5">
                        {result.requiredRiskReductionFactor.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {!result.meetsTarget && result.requiredAdditionalPfd && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200">
                      <strong>Deficiency Gap:</strong> Additional protection layer required with PFD ≤{' '}
                      <span className="font-mono font-bold">
                        {result.requiredAdditionalPfd.toExponential(3)}
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-[var(--psm-muted)] flex items-center gap-1 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Engine: {result.version} · Verification status: {result.validationStatus}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Calculation Incomplete (Safety Rule Triggered)</span>
                  </div>
                  <p>
                    Deterministic calculation engine refuses defaults. Please provide complete, finite positive inputs for:
                  </p>
                  <ul className="list-disc list-inside font-mono">
                    {result.missing?.map((m) => (
                      <li key={m}>Missing: {m}</li>
                    ))}
                    {result.invalid?.map((inv) => (
                      <li key={inv}>Invalid/Out of range: {inv}</li>
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
