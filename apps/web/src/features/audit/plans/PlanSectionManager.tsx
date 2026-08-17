"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auditPlanService } from "../services/audit-plan.service";
import {
  AuditButton,
  AuditCard,
  AuditEmptyState,
  Field,
  inputClass,
} from "../shared/AuditUi";

export type SectionField = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "textarea" | "boolean" | "select";
  options?: string[];
};

export function PlanSectionManager({
  planId,
  section,
  title,
  rows,
  fields,
  readOnly = false,
}: {
  planId: string;
  section: string;
  title: string;
  rows: Record<string, any>[];
  fields: SectionField[];
  readOnly?: boolean;
}) {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const start = (row?: Record<string, any>) =>
    setEditing(
      row
        ? {
            ...row,
            ...Object.fromEntries(
              fields.map((field) => [
                field.key,
                row[field.key] ?? row[toSnake(field.key)] ?? (field.type === "boolean" ? false : ""),
              ]),
            ),
          }
        : Object.fromEntries(
            fields.map((field) => [
              field.key,
              field.type === "boolean" ? false : "",
            ]),
          ),
    );
  const save = async () => {
    if (!editing) return;
    const missing = fields
      .filter(
        (field) => field.required && !String(editing[field.key] ?? "").trim(),
      )
      .map((field) => field.label);
    if (missing.length)
      return setError(`Missing required fields: ${missing.join(", ")}.`);
    try {
      setSaving(true);
      setError("");
      const id = editing.id as string | undefined;
      if (id)
        await auditPlanService.updateSection(planId, section, id, editing);
      else await auditPlanService.addSection(planId, section, editing);
      await client.invalidateQueries({ queryKey: ["audit", "plans", planId] });
      setEditing(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Unable to save ${title.toLowerCase()}.`,
      );
    } finally {
      setSaving(false);
    }
  };
  const remove = async (row: Record<string, any>) => {
    const reason = window.prompt(
      `Reason for removing this ${title.toLowerCase()} row:`,
    );
    if (!reason || !row.id) return;
    try {
      await auditPlanService.removeSection(planId, section, row.id, reason);
      await client.invalidateQueries({ queryKey: ["audit", "plans", planId] });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to remove row.",
      );
    }
  };
  return (
    <AuditCard
      title={title}
      action={
        <AuditButton
          onClick={() => start()}
          disabled={readOnly}
          title={
            readOnly ? "This plan is read-only." : `Add ${title.toLowerCase()}`
          }
        >
          Add
        </AuditButton>
      }
    >
      {error ? (
        <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      {editing ? (
        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <Field
                key={field.key}
                label={`${field.label}${field.required ? " *" : ""}`}
              >
                {field.type === "textarea" ? (
                  <textarea
                    className={inputClass()}
                    value={editing[field.key] ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, [field.key]: e.target.value })
                    }
                  />
                ) : field.type === "boolean" ? (
                  <select
                    className={inputClass()}
                    value={String(Boolean(editing[field.key]))}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [field.key]: e.target.value === "true",
                      })
                    }
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : field.type === "select" ? (
                  <select
                    className={inputClass()}
                    value={editing[field.key] ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, [field.key]: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputClass()}
                    value={editing[field.key] ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, [field.key]: e.target.value })
                    }
                  />
                )}
              </Field>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <AuditButton
              onClick={save}
              disabled={saving}
              title={
                saving ? "Saving is in progress." : "Save this backend record."
              }
            >
              {saving ? "Saving..." : "Save"}
            </AuditButton>
            <AuditButton onClick={() => setEditing(null)} variant="secondary">
              Cancel
            </AuditButton>
          </div>
        </div>
      ) : null}
      {rows.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {rows.map((row, index) => (
            <div
              key={row.id ?? index}
              className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"
            >
              <div className="space-y-1">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-[150px_1fr] gap-2 text-sm"
                  >
                    <span className="text-[var(--psm-muted)]">
                      {field.label}
                    </span>
                    <span>
                      {typeof (row[field.key] ?? row[toSnake(field.key)]) === "boolean"
                        ? (row[field.key] ?? row[toSnake(field.key)])
                          ? "Yes"
                          : "No"
                        : String(row[field.key] ?? row[toSnake(field.key)] ?? "-")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <AuditButton
                  onClick={() => start(row)}
                  variant="secondary"
                  disabled={readOnly}
                  title={readOnly ? "This plan is read-only." : "Edit row"}
                >
                  Edit
                </AuditButton>
                <AuditButton
                  onClick={() => remove(row)}
                  variant="danger"
                  disabled={readOnly}
                  title={
                    readOnly
                      ? "This plan is read-only."
                      : "A removal reason will be required."
                  }
                >
                  Remove
                </AuditButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AuditEmptyState
          title={`No ${title.toLowerCase()} configured`}
          message="This configuration is required before scheduling where company policy applies."
        />
      )}
    </AuditCard>
  );
}
function toSnake(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
