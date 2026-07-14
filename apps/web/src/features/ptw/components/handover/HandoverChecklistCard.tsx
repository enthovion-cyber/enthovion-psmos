'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  UserCheck, 
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { PermitShiftHandover } from '../../services/ptw-handover.service';

interface HandoverChecklistCardProps {
  handover?: PermitShiftHandover | null | undefined;
  onToggle: (itemId: string, checked: boolean) => void;
  busy?: boolean | undefined;
}

export function HandoverChecklistCard({ handover, onToggle, busy }: HandoverChecklistCardProps) {
  const items = handover?.checklistItems ?? [];
  const done = items.filter((item) => item.is_checked).length;
  const isAllComplete = items.length > 0 && done === items.length;

  // Real-time operational state capture logs
  const [handoverTime, setHandoverTime] = useState(new Date().toTimeString().slice(0, 5));
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().slice(0, 10));
  const [outgoingOperator, setOutgoingOperator] = useState('');
  const [incomingOperator, setIncomingOperator] = useState('');
  const [shiftRemarks, setShiftRemarks] = useState('');

  // Dropdown panel toggle visibility state 
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Master Checklist Toggle Handler logic
  const handleToggleAll = () => {
    const targetState = !isAllComplete;
    items.forEach((item) => {
      if (item.is_checked !== targetState) {
        onToggle(item.id, targetState);
      }
    });
  };

  return (
    <section 
      className={`psm-card rounded-xl border p-6 shadow-sm transition-all duration-200 ${
        isAllComplete 
          ? 'border-emerald-500/20 bg-[var(--psm-surface)]' 
          : 'border-[var(--psm-line)] bg-[var(--psm-surface)]'
      }`}
    >
      {/* 1. Header Banner & Verification Counter Badge */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-4">
        <div className="flex items-center gap-2.5 text-slate-200">
          <CheckCircle2 
            size={18} 
            className={`transition-colors duration-200 ${isAllComplete ? 'text-emerald-400' : 'text-[var(--psm-muted)]'}`} 
          />
          <h3 className="text-sm font-semibold tracking-wide">Handover Operations Checklist</h3>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Flat Clean Status Indicator */}
          <span 
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
              isAllComplete 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-[var(--psm-surface-2)] border-[var(--psm-line)] text-[var(--psm-muted)]'
            }`}
          >
            {isAllComplete ? 'Ready / Verified' : `${done} / ${items.length || 12} Verified`}
          </span>

          {/* Interactive Card Level Dropdown Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-slate-400 hover:bg-[var(--psm-surface-3)] hover:text-slate-200 transition-colors"
            title={isExpanded ? "Collapse Content" : "Expand Content"}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Main Collapsible Block Container */}
      <div className={`transition-all duration-300 origin-top overflow-hidden ${
        isExpanded ? 'max-h-[2000px] opacity-100 mt-4 space-y-4' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>
        
        {/* 2. Operational Control: Target Logs (Date & Time Selectors) */}
        <div className="grid grid-cols-2 gap-4 bg-[var(--psm-surface-2)]/40 p-4 rounded-xl border border-[var(--psm-line)]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
              <Calendar size={12} /> Handover Date
            </label>
            <input 
              type="date"
              disabled={busy}
              value={handoverDate}
              onChange={(e) => setHandoverDate(e.target.value)}
              className="w-full rounded-lg bg-[var(--psm-surface-3)] border border-[var(--psm-line)] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary/40 font-mono transition-colors disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
              <Clock size={12} /> Handover Time
            </label>
            <input 
              type="time"
              disabled={busy}
              value={handoverTime}
              onChange={(e) => setHandoverTime(e.target.value)}
              className="w-full rounded-lg bg-[var(--psm-surface-3)] border border-[var(--psm-line)] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary/40 font-mono transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* 3. Interactive Master Toolbar: Batch Control Selection */}
        {items.length > 0 && (
          <div className="flex items-center justify-between bg-[var(--psm-surface-2)]/20 px-4 py-2 rounded-lg border border-[var(--psm-line)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--psm-muted)] font-semibold">Batch Operations</span>
            <button
              type="button"
              disabled={busy}
              onClick={handleToggleAll}
              className="text-xs font-medium text-slate-300 hover:text-primary-hover flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isAllComplete ? (
                <>
                  <Square size={14} className="text-rose-400" /> 
                  <span>Deselect All Items</span>
                </>
              ) : (
                <>
                  <CheckSquare size={14} className="text-emerald-400" /> 
                  <span>Select / Complete All</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 4. Adaptive Checklist Content Matrix */}
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => {
              const checked = item.is_checked;
              return (
                <label 
                  key={item.id} 
                  className={`flex items-center gap-3.5 rounded-xl border p-3.5 text-xs cursor-pointer select-none transition-all duration-150 ${
                    checked 
                      ? 'border-emerald-500/10 bg-emerald-500/5 shadow-inner' 
                      : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] hover:bg-[var(--psm-surface-3)]'
                  }`}
                >
                  <div className="relative flex items-center">
                    <input 
                      disabled={busy} 
                      type="checkbox" 
                      checked={checked} 
                      onChange={(event) => onToggle(item.id, event.target.checked)}
                      className="h-4 w-4 rounded border-[var(--psm-line)] text-emerald-500 focus:ring-emerald-500/20 bg-[var(--psm-surface-3)] cursor-pointer disabled:opacity-50 accent-emerald-500 transition-colors"
                    />
                  </div>

                  <span 
                    className={`flex-1 transition-all duration-150 font-normal leading-normal ${
                      checked 
                        ? 'text-slate-400 line-through decoration-slate-600 opacity-70' 
                        : 'text-slate-200'
                    }`}
                  >
                    {item.checklist_label}
                  </span>

                  {item.is_required && !checked ? (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                      <AlertCircle size={10} /> Required
                    </span>
                  ) : checked ? (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Verified
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center text-sm text-[var(--psm-muted)] bg-[var(--psm-surface-2)]/10">
            <p className="font-semibold text-slate-300">No checklist data found.</p>
            <p className="text-xs text-[var(--psm-muted)] mt-1">Create a handover record configuration to populate field items.</p>
          </div>
        )}

        {/* 5. Expanded Detail Block: Shift Authority & Remarks Logs */}
        <div className="pt-4 border-t border-[var(--psm-line)] space-y-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
            <UserCheck size={12} /> Control Room Sign-Off Authority
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 block">Outgoing Performing Authority</span>
              <input 
                type="text"
                disabled={busy}
                placeholder="Enter signature name..."
                value={outgoingOperator}
                onChange={(e) => setOutgoingOperator(e.target.value)}
                className="w-full text-xs bg-[var(--psm-surface-2)] border border-[var(--psm-line)] rounded-lg p-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 block">Incoming Performing Authority</span>
              <input 
                type="text"
                disabled={busy}
                placeholder="Enter signature name..."
                value={incomingOperator}
                onChange={(e) => setIncomingOperator(e.target.value)}
                className="w-full text-xs bg-[var(--psm-surface-2)] border border-[var(--psm-line)] rounded-lg p-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
              <MessageSquare size={12} /> Shift Handover Safety Logs / Remarks
            </span>
            <textarea
              rows={2}
              disabled={busy}
              placeholder="Log operational cross-over notes, isolation carry-overs, or boundary limitations..."
              value={shiftRemarks}
              onChange={(e) => setShiftRemarks(e.target.value)}
              className="w-full text-xs bg-[var(--psm-surface-2)] border border-[var(--psm-line)] rounded-lg p-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 resize-none transition-colors custom-textarea-scrollbar disabled:opacity-50"
            />
          </div>
        </div>

      </div>

      {/* Custom Clean Scrollbar Track for Textareas */}
      <style jsx global>{`
        .custom-textarea-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-textarea-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-textarea-scrollbar::-webkit-scrollbar-thumb {
          background: var(--psm-line);
          border-radius: 4px;
        }
        .custom-textarea-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--psm-muted);
        }
      `}</style>
    </section>
  );
}