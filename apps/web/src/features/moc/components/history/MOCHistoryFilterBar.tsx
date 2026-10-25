'use client';

import { Download, Filter, Search } from 'lucide-react';
import { Field, MocButton, detailInput } from '../moc-detail-ui';

const categories = ['', 'Created', 'Updated', 'Submitted', 'Risk', 'Impact', 'Approval', 'Engineering', 'Actions', 'Temporary', 'PSSR', 'Communication', 'Training', 'Attachment', 'System'];

export function MOCHistoryFilterBar({ filters, setFilters, onExportCsv, onExportPdf }: any) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_auto]">
        <Field label="Search">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-[var(--psm-muted)]" />
            <input className={`${detailInput} pl-9`} placeholder="Search title, description, user, related record..." value={filters.search ?? ''} onChange={(e) => setFilters((v: any) => ({ ...v, search: e.target.value }))} />
          </div>
        </Field>
        <Field label="Category">
          <select className={detailInput} value={filters.category ?? ''} onChange={(e) => setFilters((v: any) => ({ ...v, category: e.target.value || undefined }))}>
            {categories.map((item) => <option key={item} value={item}>{item || 'All categories'}</option>)}
          </select>
        </Field>
        <Field label="Date From"><input className={detailInput} type="date" value={filters.dateFrom ?? ''} onChange={(e) => setFilters((v: any) => ({ ...v, dateFrom: e.target.value || undefined }))} /></Field>
        <Field label="Date To"><input className={detailInput} type="date" value={filters.dateTo ?? ''} onChange={(e) => setFilters((v: any) => ({ ...v, dateTo: e.target.value || undefined }))} /></Field>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <MocButton variant="outline" onClick={() => setFilters({})} icon={<Filter className="h-4 w-4" />}>Reset</MocButton>
          <MocButton variant="outline" onClick={onExportCsv} icon={<Download className="h-4 w-4" />}>CSV</MocButton>
          <MocButton variant="primary" onClick={onExportPdf}>PDF</MocButton>
        </div>
      </div>
    </section>
  );
}
