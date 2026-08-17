"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { AuditButton, inputClass } from "../shared/AuditUi";

export function AuditMappingFilters({ basePath = "/audit-compliance/standards-mapping/register" }: { basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  function apply(formData: FormData) {
    const next = new URLSearchParams();
    for (const [key, value] of Array.from(formData as unknown as Iterable<[string, FormDataEntryValue]>)) if (String(value).trim()) next.set(key, String(value));
    router.push(`${basePath}?${next.toString()}`);
  }
  return <form action={apply} className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-5">
    <input name="search" defaultValue={params.get("search") ?? ""} className={inputClass()} placeholder="Search mapping, source, module" />
    <select name="mappingStatus" defaultValue={params.get("mappingStatus") ?? ""} className={inputClass()}><option value="">All statuses</option><option>Draft</option><option>Pending Review</option><option>Verified</option><option>Stale</option><option>Archived</option></select>
    <select name="healthStatus" defaultValue={params.get("healthStatus") ?? ""} className={inputClass()}><option value="">All health</option><option>Healthy</option><option>Gap</option><option>Evidence Missing</option><option>Finding Open</option><option>CAPA Overdue</option><option>Score Stale</option></select>
    <input name="moduleKey" defaultValue={params.get("moduleKey") ?? ""} className={inputClass()} placeholder="Module key" />
    <AuditButton type="submit" variant="secondary">Apply Filters</AuditButton>
  </form>;
}
