'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AuditButton, Field, inputClass } from '../shared/AuditUi';

export function AuditTimelineFilters({ basePath = '/audit-compliance/history/timeline' }: { basePath?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  function submit(formData: FormData) {
    const query = new URLSearchParams();
    formData.forEach((value, key) => {
      if (String(value).trim()) query.set(key, String(value));
    });
    router.push(`${basePath}${query.size ? `?${query.toString()}` : ''}`);
  }
  return (
    <form action={submit} className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <Field label="Search"><input name="search" className={inputClass()} defaultValue={params.get('search') ?? ''} /></Field>
      <Field label="Source module"><input name="sourceModule" className={inputClass()} defaultValue={params.get('sourceModule') ?? ''} placeholder="Findings, CAPA, Evidence" /></Field>
      <Field label="Event type"><input name="eventType" className={inputClass()} defaultValue={params.get('eventType') ?? ''} /></Field>
      <Field label="Criticality"><input name="criticality" className={inputClass()} defaultValue={params.get('criticality') ?? ''} /></Field>
      <Field label="Date from"><input name="dateFrom" type="date" className={inputClass()} defaultValue={params.get('dateFrom') ?? ''} /></Field>
      <Field label="Date to"><input name="dateTo" type="date" className={inputClass()} defaultValue={params.get('dateTo') ?? ''} /></Field>
      <Field label="Site"><input name="siteId" className={inputClass()} defaultValue={params.get('siteId') ?? ''} /></Field>
      <div className="flex items-end gap-2"><AuditButton type="submit">Apply Filters</AuditButton><AuditButton href={basePath} variant="secondary">Reset</AuditButton></div>
    </form>
  );
}
