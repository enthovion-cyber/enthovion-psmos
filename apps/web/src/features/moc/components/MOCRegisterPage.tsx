'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FilePlus2, Filter, Search } from 'lucide-react';
import { mocService } from '../services/moc.service';
import { Badge, DetailCard, EmptyState, ErrorState, LoadingState, Metric, riskTone, statusTone } from './moc-detail-ui';

export function MOCRegisterPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const query = useQuery({ queryKey: ['moc', 'register', search, status, riskLevel], queryFn: () => mocService.list({ search: search || undefined, status: status || undefined, riskLevel: riskLevel || undefined, limit: 100 }) });
  const rows = query.data ?? [];
  const stats = useMemo(() => ({
    total: rows.length,
    open: rows.filter((row) => !['Closed', 'Cancelled', 'Rejected'].includes(row.status)).length,
    high: rows.filter((row) => ['High', 'Critical'].includes(row.risk_level)).length,
    temp: rows.filter((row) => row.change_type === 'Temporary Change').length
  }), [rows]);
  return (
    <main className="min-h-screen bg-[#020b16] p-5 text-slate-100">
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Module 04</p>
          <h1 className="mt-1 text-3xl font-black text-white">Management of Change Register</h1>
          <p className="mt-2 text-sm text-slate-400">Live register for draft, submitted, approved, implementation, temporary, emergency, PSSR, and closed MOCs.</p>
        </div>
        <Link href="/moc/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white"><FilePlus2 size={16} /> New MOC</Link>
      </header>
      <section className="mb-4 grid gap-3 md:grid-cols-4">
        <Metric label="Total MOCs" value={stats.total} tone="blue" />
        <Metric label="Open MOCs" value={stats.open} tone="amber" />
        <Metric label="High / Critical" value={stats.high} tone={stats.high ? 'red' : 'green'} />
        <Metric label="Temporary Changes" value={stats.temp} tone="purple" />
      </section>
      <DetailCard title="MOC Register" action={<div className="flex items-center gap-2 text-xs text-slate-400"><Filter size={14} /> API-driven</div>}>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input className="h-11 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-300" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search MOC number, title, description..." />
          </label>
          <select className="h-11 rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-blue-300" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {['Draft', 'Submitted', 'Under Review', 'Approved', 'Implementation', 'Pending PSSR', 'Ready For Startup', 'Closed', 'Rejected', 'Cancelled', 'Overdue Temporary Change'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="h-11 rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-blue-300" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>
            <option value="">All risk levels</option>
            {['Low', 'Medium', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? <ErrorState message="Unable to load MOC register from API." /> : null}
        {!query.isLoading && !query.isError && !rows.length ? <EmptyState title="No MOCs found" detail="Create a new MOC or clear filters." /> : null}
        {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="sticky top-0 bg-[#07182a] text-xs uppercase text-slate-500"><tr>{['MOC', 'Title', 'Type', 'Status', 'Risk', 'Location', 'Originator', 'Target', 'Action'].map((header) => <th key={header} className="border-b border-white/10 px-3 py-2">{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]"><td className="px-3 py-3 font-black text-white">{row.moc_number}</td><td className="px-3 py-3"><p className="font-bold text-white">{row.title}</p><p className="text-xs text-slate-500">{row.description}</p></td><td className="px-3 py-3 text-slate-300">{row.change_type}</td><td className="px-3 py-3"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td><td className="px-3 py-3"><Badge tone={riskTone(row.risk_level)}>{row.risk_level}</Badge></td><td className="px-3 py-3 text-slate-300">{row.site?.name ?? row.site_id} / {row.unit?.name ?? '-'}</td><td className="px-3 py-3 text-slate-300">{row.originator?.displayName ?? '-'}</td><td className="px-3 py-3 text-slate-300">{row.target_implementation_date ?? '-'}</td><td className="px-3 py-3"><Link className="rounded-md border border-blue-300/20 px-3 py-2 text-xs font-black text-blue-200" href={`/moc/${row.id}`}>Open</Link></td></tr>)}</tbody></table></div> : null}
      </DetailCard>
      {stats.high ? <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-500/10 p-3 text-sm font-bold text-red-100"><AlertTriangle size={16} /> High and critical MOCs require enhanced approval and engineering package readiness.</div> : null}
    </main>
  );
}
