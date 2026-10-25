"use client";

import { useMemo } from "react";
import { CheckCircle2, ShieldAlert, Sparkles, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";
import { SilPanel } from "./SilPanel";

export function RequiredRiskReductionPanel({
  calculation,
  determination,
}: {
  calculation: any;
  determination: any;
}) {
  const unmitigated = Number(calculation?.unmitigated_frequency ?? calculation?.initiating_event_frequency ?? 0.1);
  const tolerable = Number(calculation?.tolerable_frequency ?? 0.0001);
  const mitigated = Number(calculation?.mitigated_event_frequency ?? tolerable);
  const rrf = Number(determination?.required_rrf ?? calculation?.required_additional_rrf ?? 1);
  const pfdAvg = Number(determination?.required_pfdavg ?? (rrf > 0 ? 1 / rrf : 1));
  const meetsRisk = Boolean(calculation?.meets_risk_criteria);

  // Determine SIL band & styling
  const silData = useMemo(() => {
    if (rrf < 10) {
      return {
        label: "No SIL Required",
        band: "RRF < 10",
        pfdRange: "≥ 0.10",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        barColor: "bg-emerald-500",
        description: "Existing safeguards satisfy tolerable frequency target (TMEL).",
      };
    }
    if (rrf >= 10 && rrf < 100) {
      return {
        label: "SIL 1",
        band: "10 ≤ RRF < 100",
        pfdRange: "10⁻² to 10⁻¹",
        color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
        barColor: "bg-blue-500",
        description: "10 to 100x risk reduction required. Standard single SIF loop.",
      };
    }
    if (rrf >= 100 && rrf < 1000) {
      return {
        label: "SIL 2",
        band: "100 ≤ RRF < 1,000",
        pfdRange: "10⁻³ to 10⁻²",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        barColor: "bg-amber-500",
        description: "100 to 1,000x risk reduction required. Redundant architecture recommended.",
      };
    }
    if (rrf >= 1000 && rrf < 10000) {
      return {
        label: "SIL 3",
        band: "1,000 ≤ RRF < 10,000",
        pfdRange: "10⁻⁴ to 10⁻³",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        barColor: "bg-rose-500",
        description: "High risk function. 1,000 to 10,000x risk reduction required (2oo3 / dual redundant).",
      };
    }
    return {
      label: "Redesign Required (> SIL 3)",
      band: "RRF ≥ 10,000",
      pfdRange: "< 10⁻⁴",
      color: "text-red-500 bg-red-950/40 border-red-500/50 animate-pulse",
      barColor: "bg-red-500",
      description: "IEC 61511 non-compliant for standard SIS. Inherent plant redesign mandatory.",
    };
  }, [rrf]);

  // Logarithmic scale percentage for visualization
  const logUnmitigated = Math.max(-6, Math.min(2, Math.log10(unmitigated || 1e-1)));
  const logTolerable = Math.max(-6, Math.min(2, Math.log10(tolerable || 1e-4)));
  const logMitigated = Math.max(-6, Math.min(2, Math.log10(mitigated || 1e-4)));

  // Normalize range -6 to 1 (span of 7 decades)
  const toPct = (logVal: number) => {
    const minLog = -6;
    const maxLog = 1;
    const pct = ((logVal - minLog) / (maxLog - minLog)) * 100;
    return Math.max(5, Math.min(95, pct));
  };

  const fmtExp = (num: number) => {
    if (!Number.isFinite(num) || num === 0) return "-";
    return num.toExponential(2);
  };

  return (
    <SilPanel
      title="Required Risk Reduction & SIL Target"
      subtitle="IEC 61511 / ISA 84 Quantitative Barrier Determination"
    >
      <div className="space-y-4">
        {/* Top SIL Badge & Metric Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/60 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                Assigned SIL Target:
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-0.5 text-xs font-bold tracking-wide",
                  silData.color
                )}
              >
                {determination?.target_sil || silData.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">{silData.description}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-[var(--psm-muted)] block">
              Required RRF Factor
            </span>
            <span className="font-mono text-xl font-bold text-slate-100">
              {rrf > 0 ? rrf.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "-"}
            </span>
          </div>
        </div>

        {/* Visual Logarithmic Risk Reduction Bar */}
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <TrendingDown size={14} className="text-cyan-400" />
              Frequency Reduction Bar (Events / Year)
            </span>
            <span className="font-mono text-[11px] text-[var(--psm-muted)]">
              Log Scale: 10⁻⁶ → 10¹
            </span>
          </div>

          {/* Bar track */}
          <div className="relative h-6 w-full rounded-lg bg-slate-900 border border-[var(--psm-line)] overflow-hidden">
            {/* Background gradient from tolerable to critical */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-red-500/20" />

            {/* Tolerable Target Line Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-10 shadow-[0_0_8px_#34d399]"
              style={{ left: `${toPct(logTolerable)}%` }}
              title={`TMEL Target: ${fmtExp(tolerable)}/yr`}
            />

            {/* Mitigated Event Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 z-20 shadow-[0_0_10px_#22d3ee]"
              style={{ left: `${toPct(logMitigated)}%` }}
              title={`Achieved Mitigated: ${fmtExp(mitigated)}/yr`}
            />

            {/* Unmitigated Initiating Event Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 shadow-[0_0_8px_#f43f5e]"
              style={{ left: `${toPct(logUnmitigated)}%` }}
              title={`Unmitigated IEF: ${fmtExp(unmitigated)}/yr`}
            />
          </div>

          {/* Legend Markers */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px]">
            <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-1.5">
              <span className="block text-[10px] text-emerald-400 font-semibold uppercase">TMEL Target</span>
              <span className="font-mono text-slate-200 font-medium">{fmtExp(tolerable)} /yr</span>
            </div>
            <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-1.5">
              <span className="block text-[10px] text-cyan-400 font-semibold uppercase">Achieved Mitigated</span>
              <span className="font-mono text-slate-200 font-medium">{fmtExp(mitigated)} /yr</span>
            </div>
            <div className="rounded border border-rose-500/20 bg-rose-500/5 p-1.5">
              <span className="block text-[10px] text-rose-400 font-semibold uppercase">Unmitigated Event</span>
              <span className="font-mono text-slate-200 font-medium">{fmtExp(unmitigated)} /yr</span>
            </div>
          </div>
        </div>

        {/* Detailed Quantitative Parameters */}
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5">
            <span className="text-[var(--psm-muted)] block text-[11px]">Target PFDavg</span>
            <span className="font-mono font-bold text-slate-100 mt-0.5 block">{fmtExp(pfdAvg)}</span>
          </div>
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5">
            <span className="text-[var(--psm-muted)] block text-[11px]">SIL Band Bracket</span>
            <span className="font-mono font-bold text-slate-100 mt-0.5 block">{silData.band}</span>
          </div>
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5">
            <span className="text-[var(--psm-muted)] block text-[11px]">Risk Criteria</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 font-bold mt-0.5",
                meetsRisk ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {meetsRisk ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {meetsRisk ? "Compliant" : "Gap Open"}
            </span>
          </div>
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5">
            <span className="text-[var(--psm-muted)] block text-[11px]">Standard</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">IEC 61511:2016</span>
          </div>
        </div>
      </div>
    </SilPanel>
  );
}
