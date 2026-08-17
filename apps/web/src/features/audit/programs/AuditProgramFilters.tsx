import type { AuditLookups } from '../types/audit.types';
import { Field, inputClass } from '../shared/AuditUi';

export function AuditProgramFilters({ filters, setFilters, lookups }: { filters: Record<string, string>; setFilters: (value: Record<string, string>) => void; lookups?: AuditLookups | undefined }) {
  const update = (key: string, value: string) => setFilters({ ...filters, [key]: value });
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-2 xl:grid-cols-4">
      <Field label="Search by title/code"><input className={inputClass()} value={filters.search ?? ''} onChange={(event) => update('search', event.target.value)} placeholder="Program code or title" /></Field>
      <Select label="Audit type" value={filters.auditType} options={lookups?.auditTypes} onChange={(value) => update('auditType', value)} />
      <Select label="Program category" value={filters.programCategory} options={lookups?.programCategories} onChange={(value) => update('programCategory', value)} />
      <Select label="Program status" value={filters.programStatus} options={lookups?.programStatuses} onChange={(value) => update('programStatus', value)} />
      <Select label="Criticality" value={filters.criticality} options={lookups?.criticalityLevels} onChange={(value) => update('criticality', value)} />
      <Select label="Standard/regulation" value={filters.standard} options={lookups?.standardOptions} onChange={(value) => update('standard', value)} />
      <Field label="Module covered">
        <select className={inputClass()} value={filters.moduleCovered ?? ''} onChange={(event) => update('moduleCovered', event.target.value)}>
          <option value="">All</option>
          {(lookups?.auditableModules ?? []).map((module) => <option key={module.key} value={module.key}>{module.name}</option>)}
        </select>
      </Field>
      <Select label="Frequency" value={filters.frequency} options={lookups?.auditFrequencies} onChange={(value) => update('frequency', value)} />
      <Field label="Updated date"><input className={inputClass()} type="date" value={filters.updatedDate ?? ''} onChange={(event) => update('updatedDate', event.target.value)} /></Field>
    </div>
  );
}

function Select({ label, value, options = [], onChange }: { label: string; value?: string | undefined; options?: string[] | undefined; onChange: (value: string) => void }) {
  return <Field label={label}><select className={inputClass()} value={value ?? ''} onChange={(event) => onChange(event.target.value)}><option value="">All</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>;
}
