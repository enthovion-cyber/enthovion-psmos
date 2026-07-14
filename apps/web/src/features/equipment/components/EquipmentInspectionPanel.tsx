'use client';

import { useState } from 'react';
import type { CreateEquipmentInspectionInput, EquipmentInspection } from '@/services/equipment.service';

type InspectionPriority = NonNullable<CreateEquipmentInspectionInput['rbiPriority']>;

export function EquipmentInspectionPanel({
  inspections,
  onCreate,
  onUpdate,
  onDelete
}: {
  inspections: EquipmentInspection[];
  onCreate: (input: CreateEquipmentInspectionInput) => void;
  onUpdate: (id: string, input: Partial<CreateEquipmentInspectionInput>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<EquipmentInspection | null>(null);
  return (
    <div className="space-y-4">
      <InspectionForm title={editing ? 'Edit Inspection' : 'Add Inspection'} inspection={editing} onSubmit={(input) => {
        if (editing) onUpdate(editing.id, input);
        else onCreate(input);
        setEditing(null);
      }} />
      <div className="psm-card p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Inspection History ({inspections.length})</h2>
        {inspections.length === 0 ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)]">No inspections recorded.</div> : inspections.map((inspection) => (
          <div key={inspection.id} className="mb-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{inspection.inspectionType}</div>
                <div className="text-[var(--psm-muted)]">Inspector: {inspection.inspector ?? 'Not recorded'} · Result: {inspection.result ?? inspection.status}</div>
                <div className="text-[var(--psm-muted)]">Next: {new Date(inspection.nextInspectionDate ?? inspection.dueDate).toLocaleDateString()} · RBI: {inspection.rbiPriority ?? 'N/A'}</div>
                {inspection.observation ? <p className="mt-2 text-[var(--psm-text)]">{inspection.observation}</p> : null}
              </div>
              <div className="space-x-3">
                <button onClick={() => setEditing(inspection)} className="text-info">Edit</button>
                <button onClick={() => onDelete(inspection.id)} className="text-danger">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InspectionForm({ title, inspection, onSubmit }: { title: string; inspection?: EquipmentInspection | null; onSubmit: (input: CreateEquipmentInspectionInput) => void }) {
  const [inspectionType, setInspectionType] = useState(inspection?.inspectionType ?? 'RBI Inspection');
  const [inspectionDate, setInspectionDate] = useState(dateOnly(inspection?.inspectionDate));
  const [inspector, setInspector] = useState(inspection?.inspector ?? '');
  const [result, setResult] = useState(inspection?.result ?? 'Monitor');
  const [observation, setObservation] = useState(inspection?.observation ?? '');
  const [nextInspectionDate, setNextInspectionDate] = useState(dateOnly(inspection?.nextInspectionDate ?? inspection?.dueDate) || dateOnly(new Date().toISOString()));
  const [rbiPriority, setRbiPriority] = useState<InspectionPriority>(inspection?.rbiPriority ?? 'MEDIUM');
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit({ inspectionType, inspectionDate, inspector, result, observation, nextInspectionDate, rbiPriority }); }} className="psm-card p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">{title}</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <input value={inspectionType} onChange={(event) => setInspectionType(event.target.value)} className="psm-input px-3 text-sm" />
        <input type="date" value={inspectionDate} onChange={(event) => setInspectionDate(event.target.value)} className="psm-input px-3 text-sm" />
        <input value={inspector} onChange={(event) => setInspector(event.target.value)} placeholder="Inspector" className="psm-input px-3 text-sm" />
        <select value={result} onChange={(event) => setResult(event.target.value)} className="psm-input px-3 text-sm">
          {['Pass', 'Monitor', 'Fail'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input type="date" value={nextInspectionDate} onChange={(event) => setNextInspectionDate(event.target.value)} className="psm-input px-3 text-sm" />
        <select value={rbiPriority} onChange={(event) => setRbiPriority(event.target.value as InspectionPriority)} className="psm-input px-3 text-sm">
          {['LOW', 'MEDIUM', 'HIGH', 'SAFETY_CRITICAL'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <textarea value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Observation" className="psm-input min-h-20 p-3 text-sm md:col-span-3" />
      </div>
      <button className="psm-button psm-button-primary mt-3">{inspection ? 'Save Inspection' : 'Add Inspection'}</button>
    </form>
  );
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}
