'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

// Unified local High-Fidelity implementation of Badge matching global styling constants
const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-slate-900 text-slate-400 border-slate-800';
  if (tone === 'red') colors = 'bg-red-500/10 text-red-400 border-red-500/20';
  if (tone === 'blue') colors = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  if (tone === 'green') colors = 'bg-green-500/10 text-green-400 border-green-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

// High-fidelity fallback data matching typical workflow schemas (Context Year 2026)
const DEFAULT_MOCK_DATA = {
  overdueCount: 1,
  items: [
    { id: 'aq1', mocId: 'm1', mocNumber: 'MOC-2026-044', stepName: 'Technical Review', isOverdue: true, approverName: 'H. Bowman', dueAt: '2026-07-02' },
    { id: 'aq2', mocId: 'm2', mocNumber: 'MOC-2026-092', stepName: 'Operations Sign-off', isOverdue: false, approverName: 'A. Patel', dueAt: '2026-07-06' },
    { id: 'aq3', mocId: 'm3', mocNumber: 'MOC-2026-105', stepName: 'EHS Validation', isOverdue: false, approverName: 'S. Vance', dueAt: '2026-07-08' },
    { id: 'aq4', mocId: 'm4', mocNumber: 'MOC-2026-114', stepName: 'Pre-Commissioning Checklist', isOverdue: false, approverName: 'M. Ross', dueAt: '2026-07-12' },
    { id: 'aq5', mocId: 'm5', mocNumber: 'MOC-2026-121', stepName: 'Final Closeout Approval', isOverdue: false, approverName: 'K. Choi', dueAt: '2026-07-19' }
  ]
};

interface MOCApprovalQueuePanelProps {
  data?: Record<string, any>;
}

export function MOCApprovalQueuePanel({ data = {} }: MOCApprovalQueuePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse fallbacks checking direct data object formats or default fallback constants
  const items = data.items ?? data.queue ?? (data.overdue === undefined && data.overdueCount === undefined ? DEFAULT_MOCK_DATA.items : []);
  const overdue = Number(data.overdue ?? data.overdueCount ?? (data.items === undefined ? DEFAULT_MOCK_DATA.overdueCount : 0));

  // Determine pagination parameters dynamically based on toggle state
  const displayedItems = isExpanded ? items : items.slice(0, 4);
  const hasMoreThanFour = items.length > 4;

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-between h-full overflow-hidden">
      
      {/* Dynamic Header Block Frame - Shrink Locked */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2 shrink-0">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Workflow / Approval Queue
          </h3>
        </div>
        <Badge tone={overdue ? 'red' : 'green'}>
          {overdue ? `${overdue} overdue` : 'On track'}
        </Badge>
      </div>

      {/* Grid Layout Workspace Container */}
      <div className="flex flex-col gap-2.5 w-full flex-1 justify-start overflow-hidden">
        
        {/* Height-Stabilized Scrolling Row Container with Premium Custom Scrollbar */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[350px] scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
          {displayedItems.length ? (
            displayedItems.map((item: any) => {
              const borderTheme = (item.is_overdue || item.isOverdue) 
                ? 'border-red-500/20 bg-red-500/[0.02] hover:border-red-500/40' 
                : 'border-slate-900 bg-slate-900/30 hover:border-slate-800';

              return (
                <Link 
                  key={item.id ?? item.step_id} 
                  href={`/moc/${item.moc_id ?? item.mocId ?? item.entity_id}`} 
                  className={`block rounded-xl border p-3 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-slate-800 ${borderTheme}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="font-bold text-xs text-slate-200 group-hover:text-white transition-colors truncate max-w-[70%]">
                      {item.moc_number ?? item.mocNumber ?? item.title}
                    </p>
                    <Badge tone={(item.is_overdue || item.isOverdue) ? 'red' : 'blue'}>
                      {item.step_name ?? item.stepName ?? 'Approval'}
                    </Badge>
                  </div>
                  
                  {/* Dynamic Bottom Approver Log Subtext */}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1 text-slate-500 group-hover:text-slate-400 transition-colors shrink-0">
                      <UserCheck size={12} /> {item.approver_name ?? item.approverName ?? item.assignee_name ?? 'Assigned approver'}
                    </span>
                    <span className="text-slate-800/60">•</span>
                    <span className={(item.is_overdue || item.isOverdue) ? 'text-red-400 font-bold' : 'text-slate-500'}>
                      Due: {item.due_at ?? item.dueAt ?? '-'}
                    </span>
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center w-full">
              <p className="text-xs font-medium text-slate-400">No approvals waiting</p>
              <p className="text-[10px] font-medium text-slate-600 mt-0.5">Workflow queues appear here when MOCs enter review.</p>
            </div>
          )}
        </div>

        {/* Expand/Collapse Trigger Switch - Renders only if items count > 4 */}
        {hasMoreThanFour && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-900/60 bg-slate-950 py-2 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-800 transition-all duration-200 shrink-0 focus:outline-none"
          >
            {isExpanded ? (
              <>
                <span>View Less</span>
                <ChevronUp size={14} className="text-slate-500" />
              </>
            ) : (
              <>
                <span>View All ({items.length})</span>
                <ChevronDown size={14} className="text-slate-500" />
              </>
            )}
          </button>
        )}

      </div>
    </div>
  );
}