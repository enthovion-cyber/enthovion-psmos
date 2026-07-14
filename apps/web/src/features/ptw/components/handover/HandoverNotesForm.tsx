'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Save, 
  Clock, 
  User, 
  Phone, 
  ClipboardList, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare, 
  StickyNote, 
  HelpCircle,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { defaultHandoverValues, handoverProgressStatuses, handoverSchema, type HandoverValues } from '../../schemas/handover.schema';
import type { PermitShiftHandover } from '../../services/ptw-handover.service';

interface HandoverNotesFormProps {
  handover?: PermitShiftHandover | null | undefined;
  saving?: boolean | undefined;
  onSave: (values: HandoverValues) => void;
}

export function HandoverNotesForm({ handover, saving, onSave }: HandoverNotesFormProps) {
  const form = useForm<HandoverValues>({ 
    resolver: zodResolver(handoverSchema), 
    defaultValues: defaultHandoverValues() 
  });

  // Panel collapse visibility state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (!handover) return;
    form.reset({
      currentShiftName: handover.current_shift_name,
      currentShiftStart: local(handover.current_shift_start),
      currentShiftEnd: local(handover.current_shift_end),
      incomingShiftName: handover.incoming_shift_name,
      incomingShiftStart: local(handover.incoming_shift_start),
      incomingShiftEnd: handover.incoming_shift_end ? local(handover.incoming_shift_end) : '',
      outgoingSupervisorName: handover.outgoing_supervisor_name,
      incomingSupervisorName: handover.incoming_supervisor_name,
      incomingSupervisorContact: handover.incoming_supervisor_contact ?? '',
      workProgressStatus: handover.work_progress_status as HandoverValues['workProgressStatus'],
      workProgressNotes: handover.work_progress_notes ?? '',
      remainingWork: handover.remaining_work ?? '',
      hazardsObserved: handover.hazards_observed ?? '',
      specialPrecautions: handover.special_precautions ?? '',
      controlRoomMessage: handover.control_room_message ?? '',
      incomingSupervisorComments: handover.incoming_supervisor_comments ?? '',
      checklist: Object.fromEntries((handover.checklistItems ?? []).map((item) => [item.checklist_key, item.is_checked]))
    });
  }, [handover, form]);

  return (
    <section className="psm-card rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm transition-all duration-200">
      
      {/* Form Context Header & Actions panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-4">
        <div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <ClipboardList size={18} className="text-[var(--psm-muted)]" />
            <h3 className="text-sm font-semibold tracking-wide">Handover Log Notes</h3>
          </div>
          <p className="mt-1.5 text-xs text-[var(--psm-muted)] max-w-2xl leading-relaxed">
            Maintain operational accountability. Document shift logs, resource configurations, active safety hazards, and control room remarks.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            disabled={!handover || saving} 
            onClick={form.handleSubmit(onSave)} 
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors shadow-sm font-semibold disabled:cursor-not-allowed"
          >
            <Save size={14} className={saving ? 'animate-spin' : ''} /> 
            <span>{saving ? 'Saving Records...' : 'Save Draft Handover'}</span>
          </button>

          {/* Interactive Collapse Accordion Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-slate-400 hover:bg-[var(--psm-surface-3)] hover:text-slate-200 transition-colors"
            title={isExpanded ? "Collapse Logs Form" : "Expand Logs Form"}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Main Collapsible Workspace Matrix */}
      <div className={`transition-all duration-300 origin-top overflow-hidden ${
        isExpanded ? 'max-h-[3000px] opacity-100 mt-5 space-y-5' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>

        {/* Grid Zone 1: Time blocks & Identifiers */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)] border-l-2 border-cyan-500/50 pl-2">
            Shift Timeline Matrix
          </h4>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 bg-[var(--psm-surface-2)]/30 p-4 rounded-xl border border-[var(--psm-line)]">
            <Field label="Current Shift Identifier" icon={<Clock size={12} />} error={form.formState.errors.currentShiftName?.message}>
              <input className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 transition-colors" {...form.register('currentShiftName')} />
            </Field>
            <Field label="Current Shift Commencement" icon={<Clock size={12} />} error={form.formState.errors.currentShiftStart?.message}>
              <input type="datetime-local" className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 font-mono transition-colors" {...form.register('currentShiftStart')} />
            </Field>
            <Field label="Current Shift Conclusion" icon={<Clock size={12} />} error={form.formState.errors.currentShiftEnd?.message}>
              <input type="datetime-local" className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 font-mono transition-colors" {...form.register('currentShiftEnd')} />
            </Field>
            <Field label="Incoming Shift Identifier" icon={<Clock size={12} />} error={form.formState.errors.incomingShiftName?.message}>
              <input className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 transition-colors" {...form.register('incomingShiftName')} />
            </Field>
            <Field label="Incoming Shift Commencement" icon={<Clock size={12} />} error={form.formState.errors.incomingShiftStart?.message}>
              <input type="datetime-local" className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 font-mono transition-colors" {...form.register('incomingShiftStart')} />
            </Field>
            <Field label="Incoming Shift Conclusion" icon={<Clock size={12} />}>
              <input type="datetime-local" className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 font-mono transition-colors" {...form.register('incomingShiftEnd')} />
            </Field>
          </div>
        </div>

        {/* Grid Zone 2: Supervisory & Progress Signatures */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)] border-l-2 border-cyan-500/50 pl-2">
            Authorities & Operational Status
          </h4>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 bg-[var(--psm-surface-2)]/30 p-4 rounded-xl border border-[var(--psm-line)]">
            <Field label="Outgoing Authority / Supervisor" icon={<User size={12} />} error={form.formState.errors.outgoingSupervisorName?.message}>
              <input className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 transition-colors" {...form.register('outgoingSupervisorName')} />
            </Field>
            <Field label="Incoming Authority / Supervisor" icon={<User size={12} />} error={form.formState.errors.incomingSupervisorName?.message}>
              <input className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 transition-colors" {...form.register('incomingSupervisorName')} />
            </Field>
            <Field label="Incoming Authority Contact" icon={<Phone size={12} />}>
              <input className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 font-mono transition-colors" placeholder="+1 (555) 000-0000" {...form.register('incomingSupervisorContact')} />
            </Field>
            <Field label="Work Evolution Progress Status" icon={<ClipboardList size={12} />}>
              <select className="psm-input w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/40 text-slate-200 cursor-pointer transition-colors" {...form.register('workProgressStatus')}>
                {handoverProgressStatuses.map((status) => (
                  <option key={status} className="bg-[var(--psm-surface-3)] text-slate-200">{status}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Grid Zone 3: Narrative Text Fields */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)] border-l-2 border-cyan-500/50 pl-2">
            Operational Handover Summaries & Logs
          </h4>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Area label="Work Progress Notes" icon={<StickyNote size={12} className="text-blue-400" />} register={form.register('workProgressNotes')} placeholder="Summarize safety tasks achieved during this work shift cycle..." />
            <Area label="Outstanding / Remaining Work" icon={<ClipboardList size={12} className="text-amber-400" />} register={form.register('remainingWork')} placeholder="Log all active processes carrying over into the upcoming crew assignment window..." />
            <Area label="Hazards Observed" icon={<AlertTriangle size={12} className="text-rose-400" />} register={form.register('hazardsObserved')} placeholder="Specify live field anomalies, hot work risks, or dynamic processing line concerns..." />
            <Area label="Special Precautions Enforced" icon={<ShieldAlert size={12} className="text-emerald-400" />} register={form.register('specialPrecautions')} placeholder="Detail isolation lockouts, specialized gear guidelines, or restriction zones..." />
            <Area label="Control Room Dispatch Message" icon={<MessageSquare size={12} className="text-purple-400" />} register={form.register('controlRoomMessage')} placeholder="Broadcast instructions or system constraint notes directly to terminal operators..." />
            <Area label="Incoming Supervisor Notes / Comments" icon={<HelpCircle size={12} className="text-indigo-400" />} register={form.register('incomingSupervisorComments')} placeholder="Cross-verify structural alignments, team handovers, or sign-off overrides..." />
          </div>
        </div>

      </div>

      {/* GLOBAL SCROLLBAR & FIELD OVERRIDES ENGINE */}
      <style jsx global>{`
        textarea.custom-scrollbar-themed {
          scrollbar-width: thin;
          scrollbar-color: rgba(6, 182, 212, 0.2) transparent;
        }
        
        textarea.custom-scrollbar-themed::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        
        textarea.custom-scrollbar-themed::-webkit-scrollbar-track {
          background: transparent;
        }
        
        textarea.custom-scrollbar-themed::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.25);
          border-radius: 10px;
          transition: background 0.2s ease;
        }
        
        textarea.custom-scrollbar-themed::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
        
        select.psm-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 14px;
          padding-right: 2rem;
        }
      `}</style>
    </section>
  );
}

/* Component Layout Foundations */
interface FieldProps {
  label: string;
  icon?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
}

function Field({ label, icon, error, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
        {icon}
        {label}
      </span>
      <div className="relative rounded-lg shadow-sm">
        {children}
      </div>
      {error ? (
        <span className="mt-1 block text-xs font-medium text-rose-400 tracking-wide">
          {error}
        </span>
      ) : null}
    </label>
  );
}

interface AreaProps {
  label: string;
  icon?: ReactNode;
  register: any;
  placeholder?: string;
}

function Area({ label, icon, register, placeholder }: AreaProps) {
  return (
    <label className="block space-y-2 bg-[var(--psm-surface-2)]/20 p-4 rounded-xl border border-[var(--psm-line)] hover:border-[var(--psm-line)]/80 transition-colors">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
        {icon}
        {label}
      </span>
      <textarea 
        className="psm-input custom-scrollbar-themed min-h-24 w-full bg-[var(--psm-surface-3)] border border-[var(--psm-line)] rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 resize-none transition-all leading-relaxed" 
        placeholder={placeholder}
        {...register} 
      />
    </label>
  );
}

function local(value: string) {
  return new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}