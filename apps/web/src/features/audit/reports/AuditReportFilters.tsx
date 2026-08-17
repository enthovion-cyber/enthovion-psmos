"use client";
import { useState } from "react";
import { AuditButton, inputClass } from "../shared/AuditUi";
export function AuditReportFilters({ onChange }: { onChange?: (filters: Record<string, unknown>) => void }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const set = (key: string, value: string) => {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    onChange?.(next);
  };
  return <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-5">
    <input className={inputClass()} placeholder="Search report, source, code" onChange={(e) => set("search", e.target.value)} />
    <select className={inputClass()} onChange={(e) => set("reportStatus", e.target.value)}><option value="">All statuses</option>{["Draft","Generated","Pending Approval","Approved","Locked","Stale","Failed","Exported","Archived"].map((v) => <option key={v}>{v}</option>)}</select>
    <select className={inputClass()} onChange={(e) => set("reportType", e.target.value)}><option value="">All report types</option>{["Program Summary","Plan Report","Execution Report","Finding Report","CAPA Report","Evidence Manifest","Scoring Report","Standards Traceability","Review Approval Package","Custom"].map((v) => <option key={v}>{v}</option>)}</select>
    <select className={inputClass()} onChange={(e) => set("staleStatus", e.target.value)}><option value="">All stale states</option>{["Current","Stale","Source Changed","Refresh Required","Approved Historical"].map((v) => <option key={v}>{v}</option>)}</select>
    <AuditButton variant="secondary" onClick={() => { setFilters({}); onChange?.({}); }}>Clear</AuditButton>
  </div>;
}
