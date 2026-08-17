"use client";
import { useState } from "react";
import { AuditButton, AuditCard, Field, inputClass } from "../shared/AuditUi";
import { validateChecklist } from "../schemas/audit-checklist.schema";
const steps = [
  "Checklist Identity",
  "Program / Plan Link",
  "Scope / Applicability",
  "Standards / Regulations",
  "Modules Covered",
  "Sections & Items Setup",
  "Evidence / Response Rules",
  "Ownership / Versioning",
  "Review & Save",
];
export function AuditChecklistForm({
  initial = {},
  context,
  onSave,
  busy,
}: {
  initial?: Record<string, any>;
  context: Record<string, any>;
  onSave: (v: Record<string, any>) => Promise<void>;
  busy: boolean;
}) {
  const [step, setStep] = useState(0),
    [form, setForm] = useState<Record<string, any>>({
      version: "1.0",
      standaloneChecklist: false,
      evidenceResponseRules: {
        allowNotApplicable: true,
        attachmentsAllowed: true,
      },
      ...initial,
    }),
    [error, setError] = useState("");
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  const next = () => {
    if (step === 0) {
      const missing = validateChecklist(form);
      if (missing.length) {
        setError(`Complete: ${missing.join(", ")}`);
        return;
      }
    }
    setError("");
    setStep(Math.min(steps.length - 1, step + 1));
  };
  const checks = (key: string, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={Boolean(form.evidenceResponseRules?.[key])}
        onChange={(e) =>
          set("evidenceResponseRules", {
            ...form.evidenceResponseRules,
            [key]: e.target.checked,
          })
        }
      />
      {label}
    </label>
  );
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${i === step ? "bg-primary text-white" : "bg-[var(--psm-surface-2)]"}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
      <AuditCard title={steps[step]}>
        {error ? (
          <p className="mb-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {step === 0 ? (
            <>
              <Field label="Checklist title *">
                <input
                  className={inputClass()}
                  value={form.checklistTitle ?? ""}
                  onChange={(e) => set("checklistTitle", e.target.value)}
                />
              </Field>
              <Field label="Checklist code *">
                <input
                  className={inputClass()}
                  value={form.checklistCode ?? ""}
                  onChange={(e) => set("checklistCode", e.target.value)}
                />
              </Field>
              <Field label="Template type *">
                <select
                  className={inputClass()}
                  value={form.templateType ?? ""}
                  onChange={(e) => set("templateType", e.target.value)}
                >
                  <option value="">Select</option>
                  {context.lookups.templateTypes.map((x: string) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Audit type *">
                <input
                  className={inputClass()}
                  value={form.auditType ?? ""}
                  onChange={(e) => set("auditType", e.target.value)}
                />
              </Field>
              <Field label="Category">
                <input
                  className={inputClass()}
                  value={form.checklistCategory ?? ""}
                  onChange={(e) => set("checklistCategory", e.target.value)}
                />
              </Field>
              <Field label="Criticality *">
                <select
                  className={inputClass()}
                  value={form.criticality ?? ""}
                  onChange={(e) => set("criticality", e.target.value)}
                >
                  <option value="">Select</option>
                  {context.lookups.criticalities.map((x: string) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Version">
                <input
                  className={inputClass()}
                  value={form.version}
                  onChange={(e) => set("version", e.target.value)}
                />
              </Field>
              <Field label="Effective date">
                <input
                  type="date"
                  className={inputClass()}
                  value={form.effectiveDate ?? ""}
                  onChange={(e) => set("effectiveDate", e.target.value)}
                />
              </Field>
              <Field label="Objective">
                <textarea
                  className={inputClass()}
                  value={form.checklistObjective ?? ""}
                  onChange={(e) => set("checklistObjective", e.target.value)}
                />
              </Field>
            </>
          ) : null}
          {step === 1 ? (
            <>
              <Field label="Audit program">
                <select
                  className={inputClass()}
                  value={form.programId ?? ""}
                  onChange={(e) => set("programId", e.target.value)}
                >
                  <option value="">Reusable / none</option>
                  {context.programs.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.program_code} · {x.program_title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Audit plan">
                <select
                  className={inputClass()}
                  value={form.planId ?? ""}
                  onChange={(e) => set("planId", e.target.value)}
                >
                  <option value="">None</option>
                  {context.plans.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.plan_code} · {x.plan_title}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.standaloneChecklist}
                  onChange={(e) => set("standaloneChecklist", e.target.checked)}
                />
                Standalone checklist
              </label>
              <Field label="Standalone reason">
                <textarea
                  className={inputClass()}
                  value={form.standaloneReason ?? ""}
                  onChange={(e) => set("standaloneReason", e.target.value)}
                />
              </Field>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Field label="Site">
                <select
                  className={inputClass()}
                  value={form.siteId ?? ""}
                  onChange={(e) => set("siteId", e.target.value)}
                >
                  <option value="">Company-wide</option>
                  {context.sites.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="md:col-span-2 text-sm text-[var(--psm-muted)]">
                Detailed site/unit/area/department/equipment applicability is
                managed in the Applicability tab after draft creation.
              </p>
            </>
          ) : null}
          {step === 3 ? (
            <p className="md:col-span-3 text-sm text-[var(--psm-muted)]">
              Standards and clause references are added in the Standards tab or
              visual builder after the draft is created.
            </p>
          ) : null}
          {step === 4 ? (
            <p className="md:col-span-3 text-sm text-[var(--psm-muted)]">
              Module coverage and future evidence sources are added after draft
              creation.
            </p>
          ) : null}
          {step === 5 ? (
            <p className="md:col-span-3 text-sm text-[var(--psm-muted)]">
              Create the draft, then use the visual builder to add ordered
              sections and questions.
            </p>
          ) : null}
          {step === 6 ? (
            <div className="grid gap-3 md:col-span-3 md:grid-cols-2">
              {checks(
                "evidenceRequiredByDefault",
                "Evidence required by default",
              )}
              {checks("documentControlLinks", "Allow Document Control links")}
              {checks("attachmentsAllowed", "Allow execution attachments")}
              {checks(
                "requireFailureComment",
                "Require comment on failure/non-compliance",
              )}
              {checks("requireFinding", "Require finding foundation")}
              {checks(
                "requireCriticalCapa",
                "Require CAPA for critical gap foundation",
              )}
              {checks("allowNotApplicable", "Allow N/A response")}
              {checks("requireNaJustification", "Require N/A justification")}
              {checks(
                "reviewerVerification",
                "Reviewer verification foundation",
              )}
              {checks("signatureRequired", "Signature required foundation")}
            </div>
          ) : null}
          {step === 7 ? (
            <>
              <Field label="Checklist owner">
                <select
                  className={inputClass()}
                  value={form.ownerUserId ?? ""}
                  onChange={(e) => set("ownerUserId", e.target.value)}
                >
                  <option value="">Select owner</option>
                  {context.users.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.displayName} · {x.email}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reviewer">
                <select
                  className={inputClass()}
                  value={form.reviewerUserId ?? ""}
                  onChange={(e) => set("reviewerUserId", e.target.value)}
                >
                  <option value="">Select reviewer</option>
                  {context.users.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.displayName} · {x.email}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Approval owner">
                <select
                  className={inputClass()}
                  value={form.approvalOwnerUserId ?? ""}
                  onChange={(e) => set("approvalOwnerUserId", e.target.value)}
                >
                  <option value="">Select</option>
                  {context.users.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.displayName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Next review due">
                <input
                  type="date"
                  className={inputClass()}
                  value={form.nextReviewDue ?? ""}
                  onChange={(e) => set("nextReviewDue", e.target.value)}
                />
              </Field>
              <Field label="Review frequency">
                <input
                  className={inputClass()}
                  value={form.reviewFrequency ?? ""}
                  onChange={(e) => set("reviewFrequency", e.target.value)}
                />
              </Field>
              <Field label="Version notes">
                <textarea
                  className={inputClass()}
                  value={form.versionNotes ?? ""}
                  onChange={(e) => set("versionNotes", e.target.value)}
                />
              </Field>
            </>
          ) : null}
          {step === 8 ? (
            <div className="md:col-span-3 grid gap-3 md:grid-cols-3">
              {Object.entries({
                Identity: form.checklistTitle,
                Code: form.checklistCode,
                Type: form.templateType,
                "Audit type": form.auditType,
                Criticality: form.criticality,
                Program: form.programId ? "Linked" : "Reusable",
                Plan: form.planId ? "Linked" : "None",
                Owner: form.ownerUserId ? "Assigned" : "Missing",
                Reviewer: form.reviewerUserId ? "Assigned" : "Not assigned",
              }).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg bg-[var(--psm-surface-2)] p-3"
                >
                  <p className="text-xs uppercase text-[var(--psm-muted)]">
                    {k}
                  </p>
                  <p className="mt-1 font-semibold">{String(v ?? "Missing")}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex justify-between">
          <AuditButton
            variant="secondary"
            disabled={step === 0}
            onClick={() => setStep(Math.max(0, step - 1))}
          >
            Back
          </AuditButton>
          {step < steps.length - 1 ? (
            <AuditButton onClick={next}>Next</AuditButton>
          ) : (
            <AuditButton disabled={busy} onClick={() => onSave(form)}>
              {busy ? "Saving..." : "Save Draft"}
            </AuditButton>
          )}
        </div>
      </AuditCard>
    </div>
  );
}
