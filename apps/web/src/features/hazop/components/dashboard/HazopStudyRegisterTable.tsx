import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Edit, Trash2, Eye, RefreshCw, FileText } from 'lucide-react';
import { HazopDashboardRiskBadge } from './HazopDashboardRiskBadge';
import { HazopDashboardStatusBadge } from './HazopDashboardStatusBadge';

interface Study {
  id: string | number;
  study_number: string;
  title: string;
  description?: string;
  study_reason?: string;
  study_type?: string;
  site_name?: string;
  unit_name?: string;
  area_name?: string;
  status: string;
  risk_priority?: string;
  highRiskCount?: number;
  progress_percent?: number;
  progress?: number;
  nodeCount?: number;
  scenarioCount?: number;
  openRecommendationCount?: number;
  openActionCount?: number;
  lopaRequiredCount?: number;
  study_leader_name?: string;
  leader_name?: string;
  study_leader_id?: string;
  target_completion_date?: string;
  revalidation_due_date?: string;
  updated_at?: string;
}

export function HazopStudyRegisterTable({ studies = [] }: { studies: Study[] }) {
  // Track open state for the 3-dots action dropdown menu by study ID
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the context dropdown menu if the user clicks anywhere outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    if (activeMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  const toggleMenu = (id: string | number) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] px-5 py-4 bg-[var(--psm-surface)]">
        <div>
          <h2 className="text-base font-semibold text-slate-100 tracking-wide">Study Register</h2>
          <p className="text-xs text-[var(--psm-muted)] mt-0.5">
            Real studies scoped by company, site, and user access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-[var(--psm-muted)] border border-slate-700/50">
            Showing {studies.length} studies
          </span>
        </div>
      </div>

      {/* Table Container with Premium Scrollbar Styling */}
      <div className="max-h-[560px] overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <style jsx global>{`
          /* Custom cross-browser sleek scrollbar styling */
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: rgba(100, 116, 139, 0.25);
            border-radius: 9999px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: rgba(100, 116, 139, 0.45);
          }
        `}</style>
        
        <table className="w-full min-w-[1400px] text-sm border-collapse select-none">
          <thead className="sticky top-0 z-20 bg-[var(--psm-surface-2)] text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)] border-b border-[var(--psm-line)] shadow-sm">
            <tr>
              <th className="px-4 py-3.5 text-left font-semibold">Study No.</th>
              <th className="px-4 py-3.5 text-left font-semibold">Study Title</th>
              <th className="px-4 py-3.5 text-left font-semibold">Type</th>
              <th className="px-4 py-3.5 text-left font-semibold">Site / Unit / Area</th>
              <th className="px-4 py-3.5 text-left font-semibold">Status</th>
              <th className="px-4 py-3.5 text-left font-semibold">Risk Priority</th>
              <th className="px-4 py-3.5 text-left font-semibold">Progress</th>
              <th className="px-4 py-3.5 text-center font-semibold">Nodes</th>
              <th className="px-4 py-3.5 text-center font-semibold">Scenarios</th>
              <th className="px-4 py-3.5 text-center font-semibold">High / Critical</th>
              <th className="px-4 py-3.5 text-center font-semibold">Open Recs</th>
              <th className="px-4 py-3.5 text-center font-semibold">Open Actions</th>
              <th className="px-4 py-3.5 text-center font-semibold">LOPA Req.</th>
              <th className="px-4 py-3.5 text-left font-semibold">Leader</th>
              <th className="px-4 py-3.5 text-left font-semibold">Target Completion</th>
              <th className="px-4 py-3.5 text-left font-semibold">Revalidation Due</th>
              <th className="px-4 py-3.5 text-left font-semibold">Last Updated</th>
              <th className="sticky right-0 bg-[var(--psm-surface-2)] px-4 py-3.5 text-center font-semibold shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)] z-30">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-[var(--psm-line)]">
            {studies.map((study) => (
              <tr 
                key={study.id} 
                className="group border-t border-[var(--psm-line)] hover:bg-slate-800/30 transition-colors duration-150"
              >
                {/* Study No */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <Link 
                    href={`/hazop/${study.id}`} 
                    className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-150 hover:underline decoration-blue-400/40"
                  >
                    {study.study_number}
                  </Link>
                </td>
                
                {/* Study Title & Reason */}
                <td className="max-w-[260px] px-4 py-3.5">
                  <div className="truncate font-medium text-slate-200" title={study.title}>
                    {study.title}
                  </div>
                  <div className="truncate text-xs text-[var(--psm-muted)] mt-0.5" title={study.description ?? study.study_reason}>
                    {study.description ?? study.study_reason ?? '—'}
                  </div>
                </td>
                
                {/* Type */}
                <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-300">
                  {study.study_type ?? '—'}
                </td>
                
                {/* Site / Unit / Area */}
                <td className="px-4 py-3.5 text-xs text-slate-400 leading-normal">
                  <div className="font-medium text-slate-300">
                    {[study.site_name, study.unit_name].filter(Boolean).join(' / ') || '—'}
                  </div>
                  {study.area_name && (
                    <div className="text-[var(--psm-muted)] text-[11px] mt-0.5">{study.area_name}</div>
                  )}
                </td>
                
                {/* Status Badge */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <HazopDashboardStatusBadge value={study.status} />
                </td>
                
                {/* Risk Priority Badge */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <HazopDashboardRiskBadge value={study.risk_priority ?? (study.highRiskCount ? 'High' : 'Low')} />
                </td>
                
                {/* Progress Bar Component */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <Progress value={Number(study.progress_percent ?? study.progress ?? 0)} />
                </td>
                
                {/* Numeric Columns */}
                <td className="px-4 py-3.5 text-center font-medium text-slate-300 whitespace-nowrap">
                  {study.nodeCount ?? 0}
                </td>
                <td className="px-4 py-3.5 text-center font-medium text-slate-300 whitespace-nowrap">
                  {study.scenarioCount ?? 0}
                </td>
                
                {/* Colored Metrics matching UI Dashboard */}
                <td className="px-4 py-3.5 text-center font-bold text-red-400 whitespace-nowrap">
                  {study.highRiskCount ?? 0}
                </td>
                <td className="px-4 py-3.5 text-center font-bold text-orange-400 whitespace-nowrap">
                  {study.openRecommendationCount ?? 0}
                </td>
                <td className="px-4 py-3.5 text-center font-bold text-amber-400 whitespace-nowrap">
                  {study.openActionCount ?? 0}
                </td>
                <td className="px-4 py-3.5 text-center font-bold text-cyan-400 whitespace-nowrap">
                  {study.lopaRequiredCount ?? 0}
                </td>
                
                {/* Leader Profile Bubble */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <Avatar name={study.study_leader_name ?? study.leader_name ?? study.study_leader_id ?? 'Unassigned'} />
                </td>
                
                {/* Dates */}
                <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap text-xs font-medium">
                  {study.target_completion_date ?? '—'}
                </td>
                <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap text-xs font-medium">
                  {study.revalidation_due_date ?? '—'}
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)] whitespace-nowrap">
                  {study.updated_at ? new Date(study.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                
                {/* Actions Panel sticky alignment */}
                <td className="sticky right-0 bg-[var(--psm-surface)] group-hover:bg-[#1b2436] transition-colors duration-150 px-4 py-3.5 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)] z-10">
                  <div className="flex items-center justify-center gap-2 relative">
                    <Link 
                      href={`/hazop/${study.id}`} 
                      className="rounded-md border border-[var(--psm-line)] bg-slate-800/40 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:border-slate-500 transition-all duration-150"
                    >
                      View Details
                    </Link>
                    
                    {/* Interactive Dropdown Context Menu Trigger */}
                    <div className="relative">
                      <button 
                        onClick={() => toggleMenu(study.id)}
                        className={`rounded-md border border-[var(--psm-line)] p-1 transition-all duration-150 ${
                          activeMenuId === study.id 
                            ? 'text-blue-400 bg-slate-700 border-slate-500' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                        title="More actions"
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {/* Dropdown Action overlay - Positioned to forward-render safely on top of scroll limits */}
                      {activeMenuId === study.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-[#161d2a] p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-100"
                        >
                          <Link 
                            href={`/hazop/${study.id}`}
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
                          >
                            <Eye size={14} className="text-slate-400" />
                            <span>View Overview</span>
                          </Link>
                          <button 
                            onClick={() => { alert(`Edit Study ${study.study_number}`); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors text-left"
                          >
                            <Edit size={14} className="text-slate-400" />
                            <span>Edit Configuration</span>
                          </button>
                          <button 
                            onClick={() => { alert(`Generate Report for ${study.study_number}`); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors text-left"
                          >
                            <FileText size={14} className="text-slate-400" />
                            <span>Generate PHA Report</span>
                          </button>
                          <button 
                            onClick={() => { alert(`Trigger Revalidation ${study.study_number}`); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors text-left"
                          >
                            <RefreshCw size={14} className="text-slate-400" />
                            <span>Trigger Revalidation</span>
                          </button>
                          <div className="my-1 border-t border-slate-800" />
                          <button 
                            onClick={() => { if(confirm('Archive this PHA study?')) alert('Archived'); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                          >
                            <Trash2 size={14} />
                            <span>Delete / Archive</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            
            {/* Empty State */}
            {!studies.length && (
              <tr>
                <td colSpan={18} className="px-4 py-16 text-center text-[var(--psm-muted)] bg-slate-900/10">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-sm font-medium text-slate-400">No records found</span>
                    <span className="text-xs text-slate-500">No HAZOP/PHA studies match the current filters.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* Helper Components rewritten for enhanced style matching */
function Progress({ value }: { value: number }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="min-w-[100px] flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-300 w-8 tabular-nums">{safeValue}%</span>
      <div className="h-1.5 w-full rounded-full bg-slate-800 border border-slate-700/30 overflow-hidden">
        <div 
          className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out" 
          style={{ width: `${safeValue}%` }} 
        />
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '??';

  return (
    <div className="flex items-center gap-2" title={name}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 border border-blue-400/20 text-[11px] font-bold text-blue-300 tracking-wider">
        {initials}
      </span>
      <span className="max-w-[110px] truncate text-xs font-medium text-slate-200">
        {name}
      </span>
    </div>
  );
}