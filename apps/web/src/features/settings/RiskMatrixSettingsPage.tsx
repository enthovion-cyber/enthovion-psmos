'use client';

import { useState } from 'react';
import { ShieldAlert, Save, RefreshCw, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useMutationToast } from '@/providers/ToastProvider';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function RiskMatrixSettingsPage() {
  const queryClient = useQueryClient();
  const toast = useMutationToast();

  const [selectedCell, setSelectedCell] = useState<{ s: number; l: number; score: number; level: RiskLevel } | null>({
    s: 5,
    l: 5,
    score: 25,
    level: 'CRITICAL'
  });

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['settings', 'risk-matrix'],
    queryFn: async () => {
      const res = await api.get('/foundation/settings/risk-matrix');
      return res.data?.data ?? res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/foundation/settings/risk-matrix', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('5x5 Risk Matrix configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings', 'risk-matrix'] });
    },
    onError: (err: any) => {
      toast.error('Failed to save risk matrix', err.message);
    }
  });

  const severities = matrixData?.severities ?? [
    { level: 5, label: 'Catastrophic', description: 'Fatality or permanent disabling injury, catastrophic toxic release' },
    { level: 4, label: 'Major', description: 'Extensive injuries, major chemical release requiring off-site shelter' },
    { level: 3, label: 'Moderate', description: 'Lost time injury, contained process release within unit boundary' },
    { level: 2, label: 'Minor', description: 'Medical treatment only, minor equipment damage or contained leak' },
    { level: 1, label: 'Negligible', description: 'First aid treatment, negligible atmospheric or environmental impact' }
  ];

  const likelihoods = matrixData?.likelihoods ?? [
    { level: 1, label: 'Improbable', description: 'Unlikely to occur in plant life (< 10^-5/yr)' },
    { level: 2, label: 'Remote', description: 'Possible in facility lifetime (10^-4 to 10^-5/yr)' },
    { level: 3, label: 'Occasional', description: 'Likely to occur once or twice in 10 yrs' },
    { level: 4, label: 'Probable', description: 'Expected to occur several times per decade' },
    { level: 5, label: 'Frequent', description: 'Expected to occur annually or more (> 10^-2/yr)' }
  ];

  function getRiskLevel(score: number): RiskLevel {
    if (score >= 15) return 'CRITICAL';
    if (score >= 9) return 'HIGH';
    if (score >= 4) return 'MEDIUM';
    return 'LOW';
  }

  function getLevelColor(level: RiskLevel) {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/80 hover:bg-red-500 text-white border-red-600';
      case 'HIGH':
        return 'bg-amber-500/80 hover:bg-amber-500 text-white border-amber-600';
      case 'MEDIUM':
        return 'bg-yellow-500/80 hover:bg-yellow-500 text-black border-yellow-600';
      case 'LOW':
        return 'bg-emerald-500/80 hover:bg-emerald-500 text-white border-emerald-600';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="psm-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-400">
                <ShieldAlert size={18} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight">OSHA 1910.119 5x5 Risk Matrix Configuration</h1>
            </div>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">
              Governs risk ranking for HAZOP/PHA deviations, MOC risk assessments, Incident consequence evaluations, and Mechanical Integrity SCE criticality.
            </p>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ name: 'Standard 5x5 Matrix' })}
            disabled={saveMutation.isPending}
            className="psm-button psm-button-primary"
          >
            <Save size={16} /> Save Matrix Definitions
          </button>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 border-t border-[var(--psm-line)] pt-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-emerald-500" />
            <span>Low Risk (Score 1-3) - Broadly Acceptable</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-yellow-500" />
            <span>Medium Risk (Score 4-8) - ALARP Managed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-amber-500" />
            <span>High Risk (Score 9-14) - Action Required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-red-500" />
            <span>Critical Risk (Score 15-25) - Mandatory SIL/LOPA Gate</span>
          </div>
        </div>
      </section>

      {/* Grid Explorer */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Interactive Matrix */}
        <div className="psm-card p-6 overflow-x-auto">
          <h2 className="text-base font-semibold mb-4">Risk Ranking Matrix (Severity x Likelihood)</h2>

          <div className="min-w-[580px]">
            {/* Table Header: Likelihood labels */}
            <div className="grid grid-cols-[140px_repeat(5,1fr)] gap-2 mb-2 text-center text-xs font-semibold uppercase text-[var(--psm-muted)]">
              <div className="text-left font-bold text-white/50">Severity \ Likelihood</div>
              {likelihoods.map((l: any) => (
                <div key={l.level} className="p-1 rounded bg-[var(--psm-surface-2)]">
                  <div>L{l.level}</div>
                  <div className="truncate text-[10px] text-white/70">{l.label}</div>
                </div>
              ))}
            </div>

            {/* Matrix Rows: Severities from 5 down to 1 */}
            <div className="space-y-2">
              {[...severities].sort((a: any, b: any) => b.level - a.level).map((s: any) => (
                <div key={s.level} className="grid grid-cols-[140px_repeat(5,1fr)] gap-2">
                  {/* Severity Label Cell */}
                  <div className="flex flex-col justify-center rounded bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs">
                    <span className="font-bold text-white/90">S{s.level} - {s.label}</span>
                    <span className="text-[10px] text-[var(--psm-muted)] truncate">{s.description}</span>
                  </div>

                  {/* 5 Likelihood Cells */}
                  {likelihoods.map((l: any) => {
                    const score = s.level * l.level;
                    const level = getRiskLevel(score);
                    const isSelected = selectedCell?.s === s.level && selectedCell?.l === l.level;

                    return (
                      <button
                        key={l.level}
                        type="button"
                        onClick={() => setSelectedCell({ s: s.level, l: l.level, score, level })}
                        className={`h-16 rounded-lg font-bold text-sm border transition flex flex-col items-center justify-center gap-0.5 ${getLevelColor(level)} ${
                          isSelected ? 'ring-4 ring-white shadow-xl scale-[1.03]' : ''
                        }`}
                      >
                        <span className="text-base leading-none">{score}</span>
                        <span className="text-[10px] font-medium opacity-90">{level}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Cell Action Gate Panel */}
        <div className="psm-card p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-[var(--psm-line)] pb-4 mb-4">
              <div className="text-xs uppercase font-semibold text-[var(--psm-muted)]">Selected Risk Cell</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{selectedCell?.score ?? '-'}</span>
                <span className="text-base font-bold">
                  S{selectedCell?.s} x L{selectedCell?.l}
                </span>
                <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold ${
                  selectedCell?.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                  selectedCell?.level === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                  selectedCell?.level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedCell?.level}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-white/70 block uppercase">Severity Definition</span>
                <p className="mt-1 text-[var(--psm-muted)] text-sm">
                  {severities.find((s: any) => s.level === selectedCell?.s)?.description}
                </p>
              </div>

              <div>
                <span className="font-semibold text-white/70 block uppercase">Likelihood Frequency</span>
                <p className="mt-1 text-[var(--psm-muted)] text-sm">
                  {likelihoods.find((l: any) => l.level === selectedCell?.l)?.description}
                </p>
              </div>

              <div className="rounded-lg bg-[var(--psm-surface-2)] p-4 border border-[var(--psm-line)] space-y-2">
                <span className="font-bold text-white/90 block">Automated PSM OS Action Gates:</span>
                <ul className="space-y-1.5 text-[var(--psm-muted)]">
                  <li className="flex items-center gap-1.5">
                    {selectedCell && selectedCell.score >= 9 ? (
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                    ) : (
                      <Info size={13} className="text-[var(--psm-muted)] shrink-0" />
                    )}
                    <span>Mandatory CAPA Action Creation</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    {selectedCell && selectedCell.score >= 15 ? (
                      <AlertTriangle size={13} className="text-red-400 shrink-0" />
                    ) : (
                      <Info size={13} className="text-[var(--psm-muted)] shrink-0" />
                    )}
                    <span>Triggers SIL / LOPA Safeguard Analysis</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    {selectedCell && selectedCell.score >= 15 ? (
                      <AlertTriangle size={13} className="text-red-400 shrink-0" />
                    ) : (
                      <Info size={13} className="text-[var(--psm-muted)] shrink-0" />
                    )}
                    <span>Requires Site VP / Corporate EHS Sign-off</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--psm-line)] pt-4 mt-6 text-xs text-[var(--psm-muted)]">
            Changes apply globally across HAZOP, MOC, and Incident investigation modules.
          </div>
        </div>
      </div>
    </div>
  );
}
