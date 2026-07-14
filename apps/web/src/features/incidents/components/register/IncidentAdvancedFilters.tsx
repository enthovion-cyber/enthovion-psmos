import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { inputClass, Panel } from './Panel';

const fields: Array<[string, string]> = [
  ['search','Search'],['dateFrom','Date from'],['dateTo','Date to'],['siteId','Site'],
  ['unitId','Unit'],['areaId','Area'],['eventType','Event type'],['classification','Classification'],
  ['isPsmIncident','PSM Yes/No'],['pseTier','PSE Tier'],['actualSeverity','Actual severity'],
  ['potentialSeverity','Potential severity'],['investigationPriority','Priority'],['status','Status'],
  ['ownerId','Owner'],['rcaRequired','RCA required'],['overdueInvestigation','Overdue investigation'],
  ['overdueActions','Overdue actions'],['regulatoryReportingRequired','Regulatory reporting'],['mocRequired','MOC'],
  ['pssrRequired','PSSR'],['hazopReviewRequired','HAZOP'],['lopaReviewRequired','LOPA'],
  ['miRequired','MI follow-up'],['contractorInvolved','Contractor'],['injuryInvolved','Injury'],
  ['environmentalImpact','Environmental'],['fireExplosion','Fire/explosion'],['restricted','Restricted']
];

export function IncidentAdvancedFilters({ filters, context, setFilters }: { filters: any; context: any; setFilters: (f: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const options: Record<string, any[]> = { 
    siteId: context?.sites, unitId: context?.units, areaId: context?.areas, 
    eventType: context?.eventTypes, classification: context?.classifications, status: context?.statuses, 
    actualSeverity: context?.severities, potentialSeverity: context?.severities, pseTier: context?.pseTiers, 
    investigationPriority: context?.priorities, ownerId: context?.users 
  };

  // Split into baseline fields (always visible) vs advanced fields
  const coreFieldKeys = ['search', 'dateFrom', 'dateTo', 'siteId'];
  const coreFields = fields.filter(([key]) => coreFieldKeys.includes(key));
  const advancedFields = fields.filter(([key]) => !coreFieldKeys.includes(key));

  const renderField = ([key, label]: [string, string]) => {
    if (options[key]) {
      return (
        <select 
          key={key} 
          className={`${inputClass} w-full py-1.5 text-xs`} 
          value={filters[key] ?? ''} 
          onChange={e => setFilters({ ...filters, [key]: e.target.value, page: 1 })}
        >
          <option value="">{label}</option>
          {options[key]?.map((x: any) => (
            <option key={x.id ?? x} value={x.id ?? x}>{x.name ?? x.displayName ?? x}</option>
          ))}
        </select>
      );
    }
    return (
      <input 
        key={key} 
        className={`${inputClass} w-full py-1.5 text-xs`} 
        type={key.toLowerCase().includes('date') ? 'date' : 'text'} 
        placeholder={label} 
        value={String(filters[key] ?? '')} 
        onChange={e => setFilters({ ...filters, [key]: e.target.value, page: 1 })}
      />
    );
  };

  return (
    <Panel 
      title="Filters & Search" 
      subtitle="Backend-driven real-time registry queries."
    >
      <div className="flex flex-col gap-3">
        {/* Row 1: Primary Filters + Control Buttons */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            {coreFields.map(renderField)}
          </div>
          
          <div className="flex items-center justify-end gap-2 shrink-0 pt-1 md:pt-0">
            <button 
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-cyan-300/10 dark:bg-[#071525] dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Advanced Filters
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            <button 
              type="button"
              className="lopa-button-secondary flex items-center gap-1 px-3 py-1.5 text-xs" 
              onClick={() => setFilters({ page: 1, limit: 25, sort: 'updated_at.desc' })}
            >
              <RotateCcw size={12} /> Clear
            </button>
          </div>
        </div>

        {/* Collapsible Section for Remaining Filters */}
        {isOpen && (
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800 transition-all duration-200">
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {advancedFields.map(renderField)}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}