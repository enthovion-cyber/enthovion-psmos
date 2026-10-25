'use client';

import {
  AlertTriangle,
  ArrowRight,
  Compass,
  FileCheck2,
  FileSearch,
  Flame,
  GitBranch,
  Layers,
  Network,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface CopilotEmptyWorkspaceProps {
  onSelectPrompt: (prompt: string) => void;
  contextModule?: string | null | undefined;
}

export function CopilotEmptyWorkspace({ onSelectPrompt, contextModule }: CopilotEmptyWorkspaceProps) {
  const taskCards = [
    {
      id: 'task-ptw',
      title: 'Permit & Isolation Review',
      tag: 'PTW / SIMOPS',
      description: 'Investigate positive mechanical isolation boundaries, gas tests, and concurrent permits.',
      prompt: 'Review active permits in this unit for isolation completeness and concurrent SIMOPS conflicts.',
      icon: Flame,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'task-moc',
      title: 'MOC & PSSR Readiness',
      tag: 'MOC / PSSR',
      description: 'Trace affected PSM elements (PSI, Procedures, Training, MI) and Pre-Startup Safety Review gates.',
      prompt: 'Show open MOCs and active PSSR reviews with their approval, punch list, and startup blocker status.',
      icon: GitBranch,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'task-psi',
      title: 'Document & PSI Intelligence',
      tag: 'PSI & REVISION AUDIT',
      description: 'Query authorized P&IDs, equipment datasheets, and safe operating limits with citations.',
      prompt: 'What are the design Safe Operating Limits (SOL) and relief valve set points for primary vessels?',
      icon: FileSearch,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'task-barriers',
      title: 'Barrier & Hazard Trace',
      tag: 'BARRIER INTEGRITY',
      description: 'Trace verified relationships between safety critical barriers, HAZOP nodes, and LOPA IPLs.',
      prompt: 'List safety critical barriers currently degraded or overdue for inspection and their linked hazard scenarios.',
      icon: Network,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="py-4 space-y-5 animate-in fade-in duration-200">
      {/* Workspace Hero */}
      <div className="px-1 text-center sm:text-left space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span>Industrial Process Safety Intelligence</span>
        </div>
        <h3 className="text-base font-semibold text-slate-100 tracking-tight">
          Evidence-Based Engineering Copilot
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
          Ask questions against verified Process Safety Information, operating procedures, and facility records. All outputs require licensed engineering sign-off.
        </p>
      </div>

      {/* 4 Polished Task Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {taskCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectPrompt(card.prompt)}
              className="group p-3 rounded-xl border border-slate-800 bg-[#0d1628] hover:bg-[#111c32] hover:border-blue-500/40 focus:border-blue-500 text-left transition-all duration-150 flex flex-col justify-between shadow-sm cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg border ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
                    {card.tag}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-medium text-blue-400">
                <span className="text-[10px] text-slate-400 group-hover:text-slate-200">
                  Launch review
                </span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Safety Compliance Rule Pill */}
      <div className="p-2.5 rounded-lg bg-[#0d1628] border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-300">Advisory Safety Invariant:</strong> The Copilot cannot issue permits, override safety interlocks, declare atmospheres safe, or actuate DCS/SIS systems.
        </span>
      </div>
    </div>
  );
}
