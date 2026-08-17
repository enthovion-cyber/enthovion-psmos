import { Field, inputClass } from "../../shared/AuditUi";

export function FindingEvidenceSection({ form, setForm }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Evidence title"><input className={inputClass()} value={form.evidenceTitle ?? ""} onChange={(event) => setForm({ evidenceTitle: event.target.value })} /></Field>
      <Field label="Evidence type"><select className={inputClass()} value={form.evidenceType ?? ""} onChange={(event) => setForm({ evidenceType: event.target.value })}>{["","Document Control","Storage File","Photo","Screenshot","Interview Record","Walkthrough Record","Module Record","External Reference","Other"].map((item) => <option key={item} value={item}>{item || "No evidence link now"}</option>)}</select></Field>
      <Field label="Document Control ID"><input className={inputClass()} value={form.documentId ?? ""} onChange={(event) => setForm({ documentId: event.target.value })} /></Field>
      <Field label="Storage file ID"><input className={inputClass()} value={form.storageFileId ?? ""} onChange={(event) => setForm({ storageFileId: event.target.value })} placeholder="Storage adapter reference only" /></Field>
      <Field label="Confidentiality"><select className={inputClass()} value={form.confidentialityLevel ?? ""} onChange={(event) => setForm({ confidentialityLevel: event.target.value })}>{["","Public","Internal","Confidential","Restricted"].map((item) => <option key={item} value={item}>{item || "Normal"}</option>)}</select></Field>
      <Field label="Evidence status"><select className={inputClass()} value={form.evidenceStatus ?? "Linked"} onChange={(event) => setForm({ evidenceStatus: event.target.value })}>{["Not Required","Missing","Partial","Linked","Attached","Verified Foundation","Restricted"].map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Evidence description"><textarea className={inputClass()} value={form.evidenceDescription ?? ""} onChange={(event) => setForm({ evidenceDescription: event.target.value })} rows={4} /></Field>
      <Field label="Related module / record"><input className={inputClass()} value={form.relatedModule ?? ""} onChange={(event) => setForm({ relatedModule: event.target.value })} /></Field>
    </div>
  );
}
