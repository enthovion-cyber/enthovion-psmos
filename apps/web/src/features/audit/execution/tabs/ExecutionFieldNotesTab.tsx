"use client";
import { useState } from "react";
import { AuditButton, AuditCard, AuditEmptyState, Field, inputClass } from "../../shared/AuditUi";
import { useAuditFieldNotes } from "../../hooks/useAuditFieldNotes";
import type { AuditExecutionDetail } from "../../types/audit-execution.types";

export function ExecutionFieldNotesTab({ detail }: { detail: AuditExecutionDetail }) {
  const notes = useAuditFieldNotes();
  const [form, setForm] = useState({ noteTitle: "", noteType: "Observation", noteText: "", criticality: "Medium", visibility: "Internal" });
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => notes.add.mutate({ executionId: detail.execution.id, payload: form }, { onSuccess: () => setForm({ noteTitle: "", noteType: "Observation", noteText: "", criticality: "Medium", visibility: "Internal" }) });
  return <div className="grid gap-5 xl:grid-cols-[1fr_360px]"><AuditCard title="Field Notes">{detail.notes.length ? <div className="space-y-2">{detail.notes.map((note) => <div key={note.id} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold text-[var(--psm-fg)]">{note.note_title}</p><p className="text-sm text-[var(--psm-muted)]">{note.note_type} - {note.note_text}</p></div>)}</div> : <AuditEmptyState title="No field notes" message="No backend notes have been captured for this execution." />}</AuditCard><AuditCard title="Add field note"><div className="space-y-3"><Field label="Title"><input className={inputClass()} value={form.noteTitle} onChange={(e) => set("noteTitle", e.target.value)} /></Field><Field label="Type"><select className={inputClass()} value={form.noteType} onChange={(e) => set("noteType", e.target.value)}><option>Observation</option><option>Potential Finding</option><option>Safety Concern</option><option>Interview Note</option><option>Walkthrough Note</option></select></Field><Field label="Note"><textarea className={inputClass()} value={form.noteText} onChange={(e) => set("noteText", e.target.value)} /></Field><AuditButton onClick={save} disabled={!form.noteTitle || !form.noteText || notes.add.isPending} title={!form.noteTitle || !form.noteText ? "Title and note text are required." : "Save note"}>{notes.add.isPending ? "Saving..." : "Save Note"}</AuditButton></div></AuditCard></div>;
}
