"use client";
import { useState } from "react";
import { AuditLayout } from "../AuditLayout";
import {
  AuditButton,
  AuditEmptyState,
  AuditErrorState,
  AuditLoadingState,
} from "../shared/AuditUi";
import { useAuditChecklists } from "../hooks/useAuditChecklists";
import { useAuditChecklistLookups } from "../hooks/useAuditChecklistLookups";
import { AuditChecklistSummaryCards } from "./AuditChecklistSummaryCards";
import { AuditChecklistFilters } from "./AuditChecklistFilters";
import { AuditChecklistTemplateTable } from "./AuditChecklistTemplateTable";
import { AuditChecklistTemplateMobileCards } from "./AuditChecklistTemplateMobileCards";
export function AuditChecklistTemplateLibraryPage({
  fixed = {},
}: {
  fixed?: Record<string, unknown>;
}) {
  const [filters, setFilters] = useState<Record<string, any>>({
    page: 1,
    limit: 25,
    ...fixed,
  });
  const q = useAuditChecklists(filters),
    ctx = useAuditChecklistLookups();
  if (q.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (q.error || !q.data)
    return (
      <AuditLayout>
        <AuditErrorState message={q.error} onRetry={() => q.refetch()} />
      </AuditLayout>
    );
  return (
    <AuditLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Checklist Template Library</h1>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">
              Reusable, program-linked, and plan-specific checklist structures.
            </p>
          </div>
          <AuditButton href="/audit-compliance/checklists/templates/new">
            New Template
          </AuditButton>
        </div>
        <AuditChecklistSummaryCards summary={q.data.summary} />
        <AuditChecklistFilters
          value={filters}
          onChange={setFilters}
          lookups={ctx.data?.lookups}
        />
        {q.data.rows.length ? (
          <>
            <AuditChecklistTemplateTable rows={q.data.rows} />
            <AuditChecklistTemplateMobileCards rows={q.data.rows} />
          </>
        ) : (
          <AuditEmptyState
            title="No checklist templates"
            message="Create a controlled checklist template to begin."
            action={
              <AuditButton href="/audit-compliance/checklists/templates/new">
                Create Checklist Template
              </AuditButton>
            }
          />
        )}
      </div>
    </AuditLayout>
  );
}
