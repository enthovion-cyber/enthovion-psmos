'use client';

import Link from 'next/link';
import { Info, ArrowRight } from 'lucide-react';
import { EmptyState, PSSRCard } from '../pssr-ui';

interface ActivityItem {
  id: string | number;
  pssr_id: string | number;
  pssrNumber: string;
  event_title?: string;
  title?: string;
  event_type?: string;
  userName?: string;
  created_at?: string;
}

export function PSSRRecentActivityFeed({ rows }: { rows: ActivityItem[] }) {
  // Extract initials from userName
  const getInitials = (name?: string) => {
    if (!name) return 'RA';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate distinct background colors similar to the mockup image
  const getAvatarColor = (name?: string) => {
    if (!name) return 'bg-teal-700 text-teal-100';
    const firstChar = name.trim().charAt(0).toUpperCase();
    
    const colorMap: Record<string, string> = {
      'J': 'bg-blue-600 text-blue-100',
      'A': 'bg-blue-900 text-blue-300 border border-blue-800',
      'M': 'bg-emerald-800 text-emerald-200',
      'K': 'bg-orange-800 text-orange-200',
      'R': 'bg-teal-700 text-teal-200',
    };

    return colorMap[firstChar] || 'bg-slate-700 text-slate-200';
  };

  // Format date helper matching the mockup look (e.g., "8:15 AM" or "Yesterday, 09:12 PM")
  const formatActivityTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Check if valid date
    if (isNaN(date.getTime())) return dateString; 

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const visibleRows = (rows ?? []).slice(0, 5);

  return (
    <PSSRCard 
      title={
        <div className="flex items-center gap-2 text-white font-medium text-base">
          <span>Recent Activity</span>
          <Info size={16} className="text-slate-400 cursor-help" />
        </div>
      }
    >
      <div className="relative pl-1">
        {visibleRows.length ? (
          <>
            {/* Vertical timeline connector line */}
            <div className="absolute left-5 top-4 bottom-4 w-[1px] bg-slate-800" />

            <div className="space-y-5">
              {visibleRows.map((item, index) => (
                <div key={item.id || index} className="relative flex items-start gap-4">
                  
                  {/* Timeline Avatar with Initials */}
                  <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wider ${getAvatarColor(item.userName)}`}>
                    {getInitials(item.userName)}
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Title & Action Description */}
                      <div className="text-sm">
                        <Link 
                          href={`/pssr/${item.pssr_id}`} 
                          className="font-medium text-sky-400 hover:underline mr-1.5"
                        >
                          {item.pssrNumber}
                        </Link>
                        <span className="text-slate-300">
                          {item.event_title ?? item.event_type ?? 'updated'}
                        </span>
                      </div>

                      {/* Right-aligned timestamp */}
                      <span className="text-xs text-slate-400 whitespace-nowrap pt-0.5">
                        {formatActivityTime(item.created_at)}
                      </span>
                    </div>

                    {/* Secondary Asset Line */}
                    {item.title && (
                      <p className="mt-0.5 text-xs text-slate-400 font-normal">
                        {item.title}
                      </p>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* View All Action Footer */}
            <div className="mt-6 pt-2 border-t border-slate-900">
              <Link 
                href="/pssr/activity" 
                className="inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                <span>View All Activity</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </>
        ) : (
          <EmptyState 
            title="No PSSR activity yet" 
            detail="Creation, readiness, authorization, attachment, and lifecycle events appear here." 
          />
        )}
      </div>
    </PSSRCard>
  );
}