'use client';

import { Download, Filter, Search } from 'lucide-react';
import { Field, detailInput } from '../moc-detail-ui';

const categories = ['', 'Created', 'Updated', 'Submitted', 'Risk', 'Impact', 'Approval', 'Engineering', 'Actions', 'Temporary', 'PSSR', 'Communication', 'Training', 'Attachment', 'System'];

export function MOCHistoryFilterBar({ filters, setFilters, onExportCsv, onExportPdf }: any) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-4">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_auto]">
        <Field label="Search">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
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
        <div className="flex items-end gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-xs font-black text-slate-100 hover:bg-blue-500/10" onClick={() => setFilters({})}><Filter className="h-4 w-4" /> Reset</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-xs font-black text-slate-100 hover:bg-blue-500/10" onClick={onExportCsv}><Download className="h-4 w-4" /> CSV</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-500" onClick={onExportPdf}>PDF</button>
        </div>
      </div>
    </section>
  );
}
