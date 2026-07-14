import { useState } from 'react';
import { AlertTriangle, BadgeCheck, ClipboardList, Flame, ShieldAlert, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

const labels: Record<string, string> = { 
  totalIncidents: 'Total incidents', 
  openIncidents: 'Open incidents', 
  closedIncidents: 'Closed incidents', 
  draftReports: 'Draft reports', 
  newReportsPendingTriage: 'Pending triage', 
  nearMisses: 'Near misses', 
  unsafeConditions: 'Unsafe conditions', 
  actualInjuryEvents: 'Actual injury', 
  environmentalEvents: 'Environmental', 
  assetReliabilityEvents: 'Asset/reliability', 
  processSafetyIncidents: 'PSM incidents', 
  apiTier1Events: 'API Tier 1', 
  apiTier2Events: 'API Tier 2', 
  apiTier3Events: 'API Tier 3', 
  apiTier4Events: 'API Tier 4', 
  highPotentialSeverityEvents: 'High potential', 
  fatalityPotentialNearMisses: 'Fatality potential', 
  majorPotentialEvents: 'Major potential', 
  overdueInvestigations: 'Overdue investigations', 
  investigationsDueThisWeek: 'Due this week', 
  rcaRequired: 'RCA required', 
  rcaCompleted: 'RCA completed', 
  formalInvestigationTeamRequired: 'Formal team required', 
  openCorrectivePreventiveActions: 'Open CAPA', 
  overdueActions: 'Overdue actions', 
  mocRequired: 'MOC required', 
  pssrRequired: 'PSSR required', 
  hazopReviewRequired: 'HAZOP review', 
  lopaSilReviewRequired: 'LOPA/SIL review', 
  mechanicalIntegrityFollowupRequired: 'MI follow-up', 
  regulatoryReportingRequired: 'Regulatory reporting', 
  repeatEvents: 'Repeat events', 
  readyForReview: 'Ready for review', 
  reopenedIncidents: 'Reopened' 
};

export function IncidentSummaryCards({ cards, onFilter }: { cards: Record<string, number>; onFilter: (f: any) => void }) {
  const [showAll, setShowAll] = useState(false);
  const icons = [ClipboardList, ShieldAlert, Flame, TrendingUp, BadgeCheck, AlertTriangle];
  
  const entries = Object.entries(labels);
  // Show only 12 items initially, or show everything if toggled
  const visibleEntries = showAll ? entries : entries.slice(0, 12);

  return (
    <div className="space-y-4">
      {/* Grid Layout - Scalable from mobile (2 cols) up to ultra-wide (6 cols) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visibleEntries.map(([key, label], i) => {
          const Icon = icons[i % icons.length] ?? ClipboardList;
          const value = cards?.[key] ?? 0;
          
          return (
            <button 
              key={key} 
              onClick={() => onFilter(filterFor(key))} 
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:border-blue-500 hover:shadow-md dark:border-cyan-300/10 dark:bg-[#071525]"
            >
              <div className="flex items-center justify-between w-full text-slate-500 dark:text-slate-400">
                <Icon size={16} className="transition-colors group-hover:text-blue-500 dark:group-hover:text-cyan-400" />
                <span className="text-[10px] opacity-80">vs previous: -</span>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
                {value}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium truncate w-full" title={label}>
                {label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Control Action Button */}
      {entries.length > 12 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600 dark:border-cyan-300/10 dark:bg-[#071525] dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
          >
            {showAll ? (
              <>
                Show less <ChevronUp size={14} />
              </>
            ) : (
              <>
                View all ({entries.length - 12} more) <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function filterFor(key: string) { 
  if (key.includes('Tier1')) return { pseTier: 'Tier 1' }; 
  if (key.includes('Tier2')) return { pseTier: 'Tier 2' }; 
  if (key.includes('high') || key.includes('High')) return { highPotential: true }; 
  if (key.includes('psm') || key.includes('processSafety')) return { isPsmIncident: true }; 
  if (key.includes('overdue')) return { overdueInvestigation: true }; 
  return {}; 
}