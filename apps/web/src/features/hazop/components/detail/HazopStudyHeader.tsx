"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { 
  Archive, 
  CheckCircle2, 
  Download, 
  Edit3, 
  FileUp, 
  History, 
  MoreHorizontal, 
  PackageCheck, 
  Plus, 
  RefreshCcw, 
  Send, 
  Sparkles, 
  XCircle,
  MapPin,
  Calendar,
  ChevronDown
} from "lucide-react";
import { useMyPermissions } from "@/features/iam/hooks/useIam";
import { HazopStatusBadge } from "../shared/HazopBadges";

type HeaderAction = {
  edit: () => void;
  addNode: () => void;
  addScenario: () => void;
  addRecommendation: () => void;
  generateActions: () => void;
  requestApproval: () => void;
  approve: () => void;
  reject: () => void;
  returnForRework: () => void;
  closeStudy: () => void;
  reopenStudy: () => void;
  exportReport: () => void;
  uploadAttachment: () => void;
  more?: (action: string) => void;
};

interface HazopStudyHeaderProps {
  study: any;
  onAction: HeaderAction;
}

export function HazopStudyHeader({ study, onAction }: HazopStudyHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const permissionsQuery = useMyPermissions();
  const permissions = permissionsQuery.data ?? [];
  const readonly = ["Approved", "Closed", "Cancelled"].includes(study.status);
  
  const can = (permission: string) => 
    permissions.includes(permission) || 
    permissions.includes("hazop:manage") || 
    permissions.includes("hazop.edit");

  const leader = (study.team ?? []).find((member: any) => 
    ["HAZOP Leader / Facilitator", "Leader", "Facilitator"].includes(member.study_role ?? member.role)
  ) ?? null;
  
  const leaderName = leader?.name ?? leader?.external_name ?? study.study_leader_name ?? study.study_leader_id ?? "Unassigned";
  
  const siteLine = [
    study.site_name ?? study.site?.name ?? study.site_id, 
    study.unit_name ?? study.unit?.name ?? study.unit_id, 
    study.area_name ?? study.area?.name ?? study.area_id
  ].filter(Boolean).join(" / ");

  const summary = study.summary ?? {};
  const openRecs = summary.openRecommendationCount ?? (study.recommendations ?? []).filter((rec: any) => !["Closed", "Cancelled", "Verified Closed"].includes(rec.status)).length;
  const highRisk = summary.highRiskCount ?? (study.scenarios ?? []).filter((scenario: any) => ["High", "Critical"].includes(scenario.risk_level)).length;
  const lopaRequired = summary.lopaRequiredCount ?? (study.scenarios ?? []).filter((scenario: any) => scenario.lopa_required).length;
  const progress = summary.progress ?? study.progress_percent ?? 0;
  
  const canRequestApproval = ["In Preparation", "In Progress", "In Review", "Review", "Recommendations Open"].includes(study.status);
  const inApproval = ["Pending Approval", "In Review"].includes(study.status);
  const canClose = ["Approved", "In Progress", "Recommendations Open"].includes(study.status) && (summary.closureBlockerCount ?? 0) === 0;
  const canReopen = ["Approved", "Closed"].includes(study.status);

  // Close the "More" menu instantly if the user clicks anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="relative z-20 overflow-visible rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 via-[#0a192f] to-[#071424] shadow-2xl shadow-black/40 backdrop-blur-sm">
      
      {/* Top Section: Identification & Strategic Metrics */}
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between xl:items-center">
        
        {/* Left Core Meta Info */}
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-inner">
            <FileUp size={24} className="animate-pulse" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-50">{study.study_number}</h1>
              <span className="truncate text-sm font-medium text-slate-400">{study.title}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800/40 px-2 py-0.5 text-xs font-medium text-slate-300">
                Type: <span className="ml-1 font-semibold text-purple-400">{study.study_type ?? "HAZOP"}</span>
              </span>
              <div className="scale-95 origin-left">
                <HazopStatusBadge value={study.status} />
              </div>
              {readonly && (
                <span className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 shadow-sm animate-fade-in">
                  Read-only
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Core Data Visual KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center xl:divide-x xl:divide-slate-800">
          <div className="px-1 xl:px-4">
            <Info label="Location" value={siteLine || "No location"} icon={<MapPin size={13} className="text-slate-500" />} />
          </div>
          <div className="px-1 xl:px-4">
            <Info label="Study Leader" value={leaderName} icon={<Avatar name={leaderName} />} />
          </div>
          <div className="px-1 xl:px-4">
            <Info label="Target Date" value={study.target_completion_date ? new Date(study.target_completion_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "-"} icon={<Calendar size={13} className="text-slate-500" />} />
          </div>
          
          <div className="flex gap-2 sm:col-span-3 md:col-span-4 lg:flex-row lg:mt-0 xl:pl-4">
            <HeaderMetric label="Progress" value={`${progress}%`} tone="text-cyan-400" bgTone="bg-cyan-500/5" />
            <HeaderMetric label="Open Recs" value={openRecs} tone="text-blue-400" bgTone="bg-blue-500/5" onClick={onAction.addRecommendation} isClickable />
            <HeaderMetric label="High-Risk" value={highRisk} tone="text-rose-400" bgTone="bg-rose-500/5" />
            <HeaderMetric label="LOPA Req." value={lopaRequired} tone="text-purple-400" bgTone="bg-purple-500/5" />
          </div>
        </div>
      </div>

      {/* Bottom Contextual Ribbon Panel */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 bg-slate-950/40 px-6 py-3 overflow-visible">
        <HeaderButton icon={Edit3} label="Edit" disabled={!can("hazop.edit") || readonly} onClick={onAction.edit} variant="secondary" />
        <HeaderButton icon={Plus} label="Add Node" disabled={!can("hazop.node.create") || readonly} onClick={onAction.addNode} />
        <HeaderButton icon={Plus} label="Add Scenario" disabled={!can("hazop.scenario.create") || readonly} onClick={onAction.addScenario} />
        <HeaderButton icon={Plus} label="Add Recommendation" disabled={!can("hazop.recommendations.create") || readonly} onClick={onAction.addRecommendation} />
        <HeaderButton icon={Sparkles} label="Generate Actions" disabled={!can("hazop.recommendations.action.create") || readonly} onClick={onAction.generateActions} variant="ai" />
        
        <div className="h-5 w-[1px] bg-slate-800 self-center mx-1 hidden sm:block" />

        <HeaderButton icon={Send} label="Request Approval" disabled={!can("hazop.edit") || readonly || !canRequestApproval} onClick={onAction.requestApproval} />
        
        {inApproval && (
          <>
            <HeaderButton icon={CheckCircle2} label="Approve" disabled={!can("hazop.review.approve")} onClick={onAction.approve} variant="success" />
            <HeaderButton icon={XCircle} label="Reject" disabled={!can("hazop.review.reject")} onClick={onAction.reject} variant="danger" />
            <HeaderButton icon={RefreshCcw} label="Return for Rework" disabled={!can("hazop.review.return_for_rework")} onClick={onAction.returnForRework} />
          </>
        )}
        
        {canClose && <HeaderButton icon={PackageCheck} label="Close Study" disabled={!can("hazop.review.close")} onClick={onAction.closeStudy} variant="success" />}
        {canReopen && <HeaderButton icon={RefreshCcw} label="Reopen Study" disabled={!can("hazop.review.reopen")} onClick={onAction.reopenStudy} />}
        
        <div className="h-5 w-[1px] bg-slate-800 self-center mx-1 hidden sm:block" />

        <HeaderButton icon={Download} label="Export Report" disabled={!can("hazop.export")} onClick={onAction.exportReport} />
        <HeaderButton icon={FileUp} label="Upload Attachment" disabled={!can("hazop.attachments.upload") || readonly} onClick={onAction.uploadAttachment} />
        
        {/* Controlled UI Dropdown Strategy (Fixed Layer Stack) */}
        <div className="relative" ref={menuRef}>
          <button 
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/30 px-3 text-xs font-semibold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40 active:scale-95 select-none"
          >
            <MoreHorizontal size={14} /> 
            <span>More</span>
            <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Manage</div>
              <MenuItem icon={Plus} label="Duplicate Study" onClick={() => { onAction.more?.("duplicate"); setIsMenuOpen(false); }} disabled={!can("hazop.create")} />
              <MenuItem icon={XCircle} label="Cancel Study" onClick={() => { onAction.more?.("cancel"); setIsMenuOpen(false); }} disabled={!can("hazop.edit") || readonly} isDanger />
              <MenuItem icon={Archive} label="Archive Study" onClick={() => { onAction.more?.("archive"); setIsMenuOpen(false); }} disabled={!can("hazop.delete")} isDanger />
              
              <div className="my-1 border-t border-slate-800/60" />
              <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Data & Automation</div>
              <MenuItem icon={RefreshCcw} label="Recalculate Readiness" onClick={() => { onAction.more?.("recalculate-readiness"); setIsMenuOpen(false); }} disabled={!can("hazop.review.view")} />
              <MenuItem icon={RefreshCcw} label="Recalculate Risk Summary" onClick={() => { onAction.more?.("recalculate-risk"); setIsMenuOpen(false); }} disabled={!can("hazop.risk.recalculate")} />
              <MenuItem icon={RefreshCcw} label="Sync Linked Records" onClick={() => { onAction.more?.("sync-linked-records"); setIsMenuOpen(false); }} disabled={!can("hazop.linked_records.sync")} />
              
              <div className="my-1 border-t border-slate-800/60" />
              <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Outputs & History</div>
              <MenuItem icon={Download} label="Generate Final Report" onClick={() => { onAction.more?.("generate-final-report"); setIsMenuOpen(false); }} disabled={!can("hazop.export")} />
              <MenuItem icon={History} label="View Audit Trail" onClick={() => { onAction.more?.("audit"); setIsMenuOpen(false); }} disabled={!can("hazop.history.view")} />
              <MenuItem icon={History} label="View Full History" onClick={() => { onAction.more?.("history"); setIsMenuOpen(false); }} disabled={!can("hazop.history.view")} />
              <MenuItem icon={Download} label="Download Approval Package" onClick={() => { onAction.more?.("approval-package"); setIsMenuOpen(false); }} disabled={!can("hazop.review.export_package")} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   Supporting Subcomponents
   ========================================================================== */

function Info({ label, value, icon }: { label: string; value: any; icon?: ReactNode }) {
  return (
    <div className="min-w-[140px] max-w-[200px]">
      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
        <span className="shrink-0">{icon}</span>
        <span className="truncate" title={typeof value === 'string' ? value : undefined}>{value}</span>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
    
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/10 border border-amber-500/30 text-[9px] font-bold text-amber-400 shadow-sm">
      {initials}
    </span>
  );
}

interface HeaderMetricProps {
  label: string;
  value: any;
  tone: string;
  bgTone: string;
  onClick?: () => void;
  isClickable?: boolean;
}

function HeaderMetric({ label, value, tone, bgTone, onClick, isClickable = false }: HeaderMetricProps) {
  const content = (
    <div className={`rounded-xl border border-slate-800/80 ${bgTone} p-2.5 min-w-[100px] text-left transition-all duration-200 group-hover:border-slate-700`}>
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500">{label}</div>
      <div className={`mt-0.5 text-lg font-black tracking-tight ${tone}`}>{value}</div>
      {isClickable && (
        <div className="mt-0.5 text-[9px] font-semibold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
          View Details &rarr;
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="group relative focus:outline-none focus:ring-2 focus:ring-purple-500/30 rounded-xl active:scale-95 transition-transform">
        {content}
      </button>
    );
  }

  return <div className="group">{content}</div>;
}

interface HeaderButtonProps {
  icon: any;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: "default" | "secondary" | "ai" | "success" | "danger";
}

function HeaderButton({ icon: Icon, label, disabled, onClick, variant = "default" }: HeaderButtonProps) {
  const baseStyle = "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm";
  
  const variants = {
    default: "border-slate-700 bg-slate-800/30 text-slate-200 hover:border-slate-600 hover:bg-slate-800/60 focus:ring-slate-500/30",
    secondary: "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white focus:ring-slate-500/30",
    ai: "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-500/50 hover:bg-purple-500/20 hover:text-purple-200 focus:ring-purple-500/40",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/20 focus:ring-emerald-500/40",
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/20 focus:ring-rose-500/40"
  };

  return (
    <button disabled={disabled} onClick={onClick} className={`${baseStyle} ${variants[variant]}`}>
      <Icon size={13} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}

interface MenuItemProps {
  icon: any;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  isDanger?: boolean;
}

function MenuItem({ icon: Icon, label, disabled, onClick, isDanger = false }: MenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-20 active:scale-[0.98] ${
        isDanger 
          ? "text-rose-400 hover:bg-rose-500/10" 
          : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
      }`}
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}