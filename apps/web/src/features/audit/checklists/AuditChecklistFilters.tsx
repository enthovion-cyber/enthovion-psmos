import { inputClass } from "../shared/AuditUi";
export function AuditChecklistFilters({
  value,
  onChange,
  lookups,
}: {
  value: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
  lookups?: Record<string, string[]> | undefined;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-3 xl:grid-cols-5">
      <input
        aria-label="Search checklists"
        className={inputClass()}
        placeholder="Search code or title"
        value={value.search ?? ""}
        onChange={(e) =>
          onChange({ ...value, search: e.target.value, page: 1 })
        }
      />
      <select
        className={inputClass()}
        value={value.status ?? ""}
        onChange={(e) =>
          onChange({ ...value, status: e.target.value, page: 1 })
        }
      >
        <option value="">All statuses</option>
        {(lookups?.checklistStatuses ?? []).map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        className={inputClass()}
        value={value.templateType ?? ""}
        onChange={(e) =>
          onChange({ ...value, templateType: e.target.value, page: 1 })
        }
      >
        <option value="">All template types</option>
        {(lookups?.templateTypes ?? []).map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        className={inputClass()}
        value={value.criticality ?? ""}
        onChange={(e) =>
          onChange({ ...value, criticality: e.target.value, page: 1 })
        }
      >
        <option value="">All criticalities</option>
        {(lookups?.criticalities ?? []).map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <button
        className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold"
        onClick={() => onChange({ page: 1, limit: 25 })}
      >
        Clear Filters
      </button>
    </div>
  );
}
