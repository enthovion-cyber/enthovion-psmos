'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Database,
  FileCheck2,
  Loader2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface Step {
  id: number;
  label: string;
  sublabel: string;
  icon: typeof ShieldCheck;
}

const STEPS: Step[] = [
  {
    id: 1,
    label: 'Authorizing Scope & Boundaries',
    sublabel: 'Validating tenant permissions, active site, and facility bounds',
    icon: ShieldCheck
  },
  {
    id: 2,
    label: 'Scanning Knowledge & Semantic Records',
    sublabel: 'Querying controlled PSI, safe operating limits, and permit archives',
    icon: Database
  },
  {
    id: 3,
    label: 'Synthesizing Engineering Evidence',
    sublabel: 'Correlating hazard safeguards and operational constraints with AI',
    icon: Cpu
  },
  {
    id: 4,
    label: 'Validating Invariants & Citations',
    sublabel: 'Ensuring strict factual grounding against authorized facility data',
    icon: FileCheck2
  }
];

export function CopilotSynthesisLoader({ onCancel }: { onCancel?: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      setElapsedMs(elapsed);

      if (elapsed < 800) {
        setCurrentStepIndex(0);
      } else if (elapsed < 2000) {
        setCurrentStepIndex(1);
      } else if (elapsed < 3600) {
        setCurrentStepIndex(2);
      } else {
        setCurrentStepIndex(3);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="w-full max-w-lg rounded-2xl border border-blue-500/30 bg-[#091122] p-4 shadow-2xl shadow-blue-950/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      {/* Header with Enthovion Logo and Engine Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          {/* Animated Enthovion Logo Avatar */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/40 shadow-inner">
            <span className="absolute -inset-0.5 rounded-lg bg-blue-500/20 blur-xs animate-pulse" />
            <img
              src="/dark.svg"
              alt="Enthovion"
              className="relative w-5 h-5 object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-slate-100">
                ENTHOVION <span className="text-blue-400">PSM OS</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Synthesis Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Evidence-based engineering reasoning pipeline
            </p>
          </div>
        </div>

        {/* Live Elapsed Counter & Stop Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0d1628] border border-slate-800 text-[11px] font-mono text-slate-300">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            <span>{elapsedSeconds}s</span>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2 py-1 rounded-md bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/70 text-[10px] font-semibold text-rose-300 transition cursor-pointer"
              title="Stop synthesis"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Step-by-Step Animated Pipeline */}
      <div className="mt-3.5 space-y-2.5">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-blue-950/40 border border-blue-500/40 shadow-sm'
                  : isDone
                  ? 'bg-slate-900/30 border border-slate-800/60 opacity-85'
                  : 'bg-transparent border border-transparent opacity-40'
              }`}
            >
              {/* Step Status Indicator Icon */}
              <div className="shrink-0 mt-0.5">
                {isDone ? (
                  <div className="p-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                ) : isActive ? (
                  <div className="relative p-1 rounded-full bg-blue-950/80 text-blue-400 border border-blue-500/60 shadow-xs">
                    <span className="absolute -inset-0.5 rounded-full bg-blue-400/30 blur-xs animate-ping" />
                    <Loader2 className="relative w-3.5 h-3.5 animate-spin" />
                  </div>
                ) : (
                  <div className="p-1 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Step Description */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      isActive
                        ? 'text-blue-300'
                        : isDone
                        ? 'text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider ${
                      isDone
                        ? 'text-emerald-400 font-bold'
                        : isActive
                        ? 'text-blue-400 animate-pulse font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    {isDone ? 'DONE' : isActive ? 'IN PROGRESS' : 'PENDING'}
                  </span>
                </div>
                <p
                  className={`text-[10px] mt-0.5 leading-normal ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {step.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Industrial Safety Footer Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Tenant Isolated Retrieval</span>
        </div>
        <span>Zero Actuation Invariant</span>
      </div>
    </div>
  );
}
