'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';
import { detailInput } from '../moc-detail-ui';

const statuses = [
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Implementation',
  'Pending PSSR',
  'Ready For Startup',
  'Closed',
  'Rejected',
  'Cancelled'
];
const risks = ['Low', 'Medium', 'High', 'Critical'];
const types = [
  'Permanent Process Change',
  'Temporary Change',
  'Emergency Change',
  'Equipment Change',
  'Procedure Change'
];

export function MOCRegisterFilters() {
  const { filters, setFilter, setFilters, resetFilters } = useMOCDashboardStore();

  const isQuickFilterActive = (checkObject: Record<string, any>) => {
    return Object.entries(checkObject).every(([key, value]) => (filters as Record<string, any>)[key] === value);
  };

  return (
    <section className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition-colors text-[var(--psm-fg)]">
      {/* Upper Control Bar Block */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--psm-fg)]">
          <SlidersHorizontal size={14} className="text-primary" /> Filter & Search Workspace
        </h2>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--psm-muted)] hover:text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)] transition-colors focus:outline-none"
        >
          <X size={13} /> Reset Filters
        </button>
      </div>

      {/* Main Structural Query Layout */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.2fr_0.8fr]">
        {/* Full-text search element */}
        <label className="relative block sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-3 text-[var(--psm-muted)] pointer-events-none" size={15} />
          <input
            value={filters.search ?? ''}
            onChange={(event) => setFilter('search', event.target.value || undefined)}
            className={`${detailInput} pl-9`}
            placeholder="Search MOC #, title, system, originator..."
          />
        </label>

        {/* Status drop field */}
        <div className="relative block">
          <select
            value={filters.status ?? ''}
            onChange={(event) => setFilter('status', event.target.value || undefined)}
            className={`${detailInput} cursor-pointer font-semibold`}
          >
            <option value="">All Statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Risk profile selection */}
        <div className="relative block">
          <select
            value={filters.risk_level ?? ''}
            onChange={(event) => setFilter('risk_level', event.target.value || undefined)}
            className={`${detailInput} cursor-pointer font-semibold`}
          >
            <option value="">All Risks</option>
            {risks.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Core modification classification */}
        <div className="relative block">
          <select
            value={filters.change_type ?? ''}
            onChange={(event) => setFilter('change_type', event.target.value || undefined)}
            className={`${detailInput} cursor-pointer font-semibold`}
          >
            <option value="">All Change Types</option>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Size limiting controls */}
        <div className="relative block">
          <select
            value={String(filters.limit ?? 25)}
            onChange={(event) => setFilter('limit', Number(event.target.value))}
            className={`${detailInput} cursor-pointer font-semibold`}
          >
            {[10, 25, 50, 100].map((item) => (
              <option key={item} value={item}>
                {item} / Page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Instant Action Macro Badges Row */}
      <div className="mt-3.5 flex flex-wrap gap-2 pt-3 border-t border-[var(--psm-line)]">
        {[
          ['High / Critical Risk', { risk_level: 'High' }],
          ['Temporary Only', { is_temporary: true }],
          ['Emergency Only', { is_emergency: true }],
          ['Startup Blocked', { startup_blocked: true }],
          ['Closure Blocked', { closure_blocked: true }],
          ['Overdue Actions', { overdue_actions: true }],
          ['PSSR Pending', { pssr_pending: true }],
          ['Missing Evidence', { missing_evidence: true }],
          ['Pending Verification', { pending_verification: true }]
        ].map(([label, targetConfig]: any) => {
          const isActive = isQuickFilterActive(targetConfig);
          return (
            <button
              key={label}
              type="button"
              onClick={() => setFilters(targetConfig)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-all focus:outline-none ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)] hover:border-primary/50 hover:text-[var(--psm-fg)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
