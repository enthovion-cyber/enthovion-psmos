import { useState } from "react";
import {
  AuditButton,
  AuditCard,
  Field,
  inputClass,
} from "../../shared/AuditUi";
import { validateQuestionBank } from "../../schemas/audit-question-bank.schema";
export function AuditQuestionBankForm({
  initial = {},
  context,
  onSave,
  busy,
}: {
  initial?: Record<string, any>;
  context: any;
  onSave: (v: Record<string, any>) => void;
  busy: boolean;
}) {
  const [f, setF] = useState({ ...initial }),
    [error, setError] = useState("");
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  return (
    <AuditCard title="Question definition">
      {error ? <p className="mb-3 text-danger">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Question code *">
          <input
            className={inputClass()}
            value={f.questionCode ?? ""}
            onChange={(e) => set("questionCode", e.target.value)}
          />
        </Field>
        <Field label="Question text *">
          <textarea
            className={inputClass()}
            value={f.questionText ?? ""}
            onChange={(e) => set("questionText", e.target.value)}
          />
        </Field>
        <Field label="Question type *">
          <select
            className={inputClass()}
            value={f.questionType ?? ""}
            onChange={(e) => set("questionType", e.target.value)}
          >
            <option value="">Select</option>
            {context.lookups.questionTypes.map((x: string) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Response type *">
          <select
            className={inputClass()}
            value={f.responseType ?? ""}
            onChange={(e) => set("responseType", e.target.value)}
          >
            <option value="">Select</option>
            {context.lookups.responseTypes.map((x: string) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <input
            className={inputClass()}
            value={f.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
          />
        </Field>
        <Field label="Standard">
          <select
            className={inputClass()}
            value={f.standardName ?? ""}
            onChange={(e) => set("standardName", e.target.value)}
          >
            <option value="">None</option>
            {context.lookups.standards.map((x: string) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Clause reference">
          <input
            className={inputClass()}
            value={f.clauseReference ?? ""}
            onChange={(e) => set("clauseReference", e.target.value)}
          />
        </Field>
        <Field label="Module">
          <select
            className={inputClass()}
            value={f.moduleKey ?? ""}
            onChange={(e) => set("moduleKey", e.target.value)}
          >
            <option value="">None</option>
            {context.lookups.modules.map((x: string) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Evidence expectation">
          <textarea
            className={inputClass()}
            value={f.evidenceExpectation ?? ""}
            onChange={(e) => set("evidenceExpectation", e.target.value)}
          />
        </Field>
        <Field label="Criticality">
          <select
            className={inputClass()}
            value={f.criticality ?? ""}
            onChange={(e) => set("criticality", e.target.value)}
          >
            <option value="">None</option>
            {context.lookups.criticalities.map((x: string) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Default severity">
          <input
            className={inputClass()}
            value={f.defaultSeverity ?? ""}
            onChange={(e) => set("defaultSeverity", e.target.value)}
          />
        </Field>
        <Field label="Default guidance">
          <textarea
            className={inputClass()}
            value={f.defaultGuidance ?? ""}
            onChange={(e) => set("defaultGuidance", e.target.value)}
          />
        </Field>
        <Field label="Owner">
          <select
            className={inputClass()}
            value={f.ownerUserId ?? ""}
            onChange={(e) => set("ownerUserId", e.target.value)}
          >
            <option value="">None</option>
            {context.users.map((x: any) => (
              <option key={x.id} value={x.id}>
                {x.displayName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputClass()}
            value={f.questionStatus ?? "Draft"}
            onChange={(e) => set("questionStatus", e.target.value)}
          >
            {context.lookups.questionBankStatuses.map((x: string) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Version">
          <input
            className={inputClass()}
            value={f.version ?? "1.0"}
            onChange={(e) => set("version", e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-5">
        <AuditButton
          disabled={busy}
          onClick={() => {
            const m = validateQuestionBank(f);
            if (m.length) setError(`Complete: ${m.join(", ")}`);
            else onSave(f);
          }}
        >
          {busy ? "Saving..." : "Save Question"}
        </AuditButton>
      </div>
    </AuditCard>
  );
}
