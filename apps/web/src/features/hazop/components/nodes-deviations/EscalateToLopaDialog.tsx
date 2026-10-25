"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, ShieldAlert, Sparkles, X, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export function EscalateToLopaDialog({
  scenario,
  node,
  saving,
  onClose,
  onSubmit,
}: {
  scenario: any;
  node?: any;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => void;
}) {
  const [reason, setReason] = useState(
    scenario.lopa_trigger_reason ||
      `Escalated from HAZOP due to ${scenario.risk_level ?? "High"} unmitigated risk requiring quantitative barrier verification.`
  );
  const [initiatingFrequency, setInitiatingFrequency] = useState("0.1");
  const [createAction, setCreateAction] = useState(true);
  const [actionDueDate, setActionDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [createdLopaResult, setCreatedLopaResult] = useState<{
    lopaStudyId: string;
    lopaNumber: string;
    title: string;
  } | null>(null);

  const riskLevel = scenario.risk_level ?? "High";
  const isCritical = riskLevel === "Critical";

  const handleEscalate = async () => {
    onSubmit({
      reason,
      initiatingEventFrequency: Number(initiatingFrequency) || 0.1,
      createAction,
      actionDueDate,
      ownerId: scenario.owner_id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl transition-all">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[var(--psm-line)] bg-gradient-to-r from-purple-500/10 via-[var(--psm-surface-2)] to-transparent p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Zap size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Escalate to LOPA / SIL
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/30">
                  Quantitative Barrier Verification
                </span>
              </h2>
              <p className="text-xs text-[var(--psm-muted)] mt-0.5">
                Node {node?.node_number ?? "1"} · {scenario.scenario_number ?? "Scenario"} ({scenario.deviation_text ?? "Deviation"})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--psm-muted)] hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <div className="space-y-4 p-6 text-sm">
          {/* Scenario Overview Card */}
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--psm-muted)]">HAZOP RISK PROFILE</span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 font-bold uppercase",
                  isCritical
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                )}
              >
                {riskLevel} Risk (Score: {scenario.risk_score ?? "-"})
              </span>
            </div>
            <div className="grid gap-2 text-xs md:grid-cols-2">
              <div>
                <span className="block font-medium text-[var(--psm-muted)]">Initiating Cause:</span>
                <p className="font-medium text-slate-200 mt-0.5">{scenario.cause || "Not specified"}</p>
              </div>
              <div>
                <span className="block font-medium text-[var(--psm-muted)]">Consequence:</span>
                <p className="font-medium text-slate-200 mt-0.5">{scenario.consequence || "Not specified"}</p>
              </div>
            </div>
            {scenario.existing_safeguards ? (
              <div className="text-xs pt-1 border-t border-[var(--psm-line)]">
                <span className="font-medium text-[var(--psm-muted)]">Safeguards to import as IPL Candidates:</span>
                <p className="text-slate-300 mt-0.5">{scenario.existing_safeguards}</p>
              </div>
            ) : null}
          </div>

          {/* Configuration Form */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">
                Escalation Justification & Basis *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-xs text-slate-100 placeholder-[var(--psm-muted)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                rows={3}
                placeholder="Explain why quantitative barrier determination / SIL assignment is mandatory..."
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">
                  Initiating Event Frequency (IEF / yr)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={initiatingFrequency}
                  onChange={(e) => setInitiatingFrequency(e.target.value)}
                  className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                  placeholder="0.1 (once per 10 years)"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">
                  Action Center Due Date
                </label>
                <input
                  type="date"
                  value={actionDueDate}
                  disabled={!createAction}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-slate-100 disabled:opacity-50 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-200 cursor-pointer hover:bg-purple-500/10 transition">
              <input
                type="checkbox"
                checked={createAction}
                onChange={(e) => setCreateAction(e.target.checked)}
                className="rounded border-purple-400 text-purple-600 focus:ring-purple-500"
              />
              <span>
                <strong>Automatically spawn CAPA task in Action Center</strong> to track completion of this LOPA study and verification of required SIL targets.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <span className="text-xs text-[var(--psm-muted)] flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-400" />
            1-Click: Auto-populates LOPA study & creates bidirectional link
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-xs font-semibold text-[var(--psm-muted)] hover:bg-white/5 hover:text-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !reason.trim()}
              onClick={handleEscalate}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition"
            >
              {saving ? (
                <>Escalating to LOPA...</>
              ) : (
                <>
                  <Zap size={14} />
                  Escalate & Open LOPA Study
                </>
              )}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
