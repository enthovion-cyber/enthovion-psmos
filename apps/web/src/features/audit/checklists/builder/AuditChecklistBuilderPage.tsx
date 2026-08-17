"use client";
import { useState } from "react";
import { AuditLayout } from "../../AuditLayout";
import {
  AuditButton,
  AuditErrorState,
  AuditLoadingState,
} from "../../shared/AuditUi";
import { useAuditChecklistDetail } from "../../hooks/useAuditChecklistDetail";
import { useAuditChecklistMutations } from "../../hooks/useAuditChecklistMutations";
import { auditChecklistService } from "../../services/audit-checklist.service";
import { ChecklistSectionList } from "./ChecklistSectionList";
import { ChecklistItemList } from "./ChecklistItemList";
import { ChecklistItemPropertiesPanel } from "./ChecklistItemPropertiesPanel";
import { ChecklistValidationPanel } from "./ChecklistValidationPanel";
import { ChecklistPreviewPanel } from "./ChecklistPreviewPanel";
export function AuditChecklistBuilderPage({ id }: { id: string }) {
  const q = useAuditChecklistDetail(id),
    m = useAuditChecklistMutations();
  const [selectedSection, setSelectedSection] = useState<string>(),
    [selectedItem, setSelectedItem] = useState<string>(),
    [error, setError] = useState("");
  if (q.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (q.error || !q.data)
    return (
      <AuditLayout>
        <AuditErrorState message={q.error} />
      </AuditLayout>
    );
  const d = q.data,
    locked = [
      "Approved",
      "Active",
      "Current",
      "Superseded",
      "Archived",
    ].includes(d.template.checklist_status),
    sectionId = selectedSection ?? d.sections[0]?.id,
    items = d.items.filter((i) => i.section_id === sectionId),
    item = d.items.find((i) => i.id === selectedItem);
  const addSection = async () => {
    const title = prompt("Section title");
    const code = prompt("Section code");
    if (title && code)
      await m.addChild.mutateAsync({
        id,
        kind: "sections",
        payload: {
          sectionTitle: title,
          sectionCode: code,
          sectionOrder: d.sections.length + 1,
          mandatory: true,
        },
      });
  };
  const addItem = async () => {
    if (!sectionId) return setError("Add or select a section first.");
    const text = prompt("Question text");
    const code = prompt("Item code");
    if (text && code)
      await m.addChild.mutateAsync({
        id,
        kind: "items",
        payload: {
          sectionId,
          itemText: text,
          itemCode: code,
          itemOrder: items.length + 1,
          questionType: "Compliance Verification",
          responseType: "Yes / No / N/A",
        },
      });
  };
  const action = async (a: string) => {
    try {
      setError("");
      if (a === "calculate-readiness") {
        await auditChecklistService.readiness(id);
        await q.refetch();
      } else await m.action.mutateAsync({ id, action: a });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  };
  return (
    <AuditLayout>
      <div className="space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">
              {d.template.checklist_code} · v{d.template.version}
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              {d.template.checklist_title}
            </h1>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">
              {d.template.checklist_status} · {d.template.readiness_health}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AuditButton
              onClick={() => action("calculate-readiness")}
              variant="secondary"
            >
              Validate
            </AuditButton>
            <AuditButton
              onClick={() => action("submit-review")}
              disabled={locked}
            >
              Submit Review
            </AuditButton>
            <AuditButton onClick={() => action("activate")} disabled={locked}>
              Activate
            </AuditButton>
            <AuditButton
              href={`/audit-compliance/checklists/templates/${id}`}
              variant="secondary"
            >
              Detail
            </AuditButton>
          </div>
        </header>
        {locked ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            This checklist version is locked. Create a new version to edit its
            structure.
          </div>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-danger/10 p-4 text-danger">{error}</p>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-[260px_1fr_340px]">
          <ChecklistSectionList
            sections={d.sections}
            selected={sectionId}
            onSelect={setSelectedSection}
            onAdd={locked ? () => {} : addSection}
          />
          <ChecklistItemList
            items={items}
            selected={selectedItem}
            onSelect={setSelectedItem}
            onAdd={locked ? () => {} : addItem}
          />
          <ChecklistItemPropertiesPanel item={item} />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChecklistValidationPanel readiness={d.readiness} />
          <ChecklistPreviewPanel />
        </div>
      </div>
    </AuditLayout>
  );
}
