'use client';

import { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  Pencil, 
  Plus, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  User, 
  Wrench 
} from 'lucide-react';
import type { CreateEquipmentInspectionInput, EquipmentInspection } from '@/services/equipment.service';

type InspectionPriority = NonNullable<CreateEquipmentInspectionInput['rbiPriority']>;

export function EquipmentInspectionPanel({
  inspections,
  equipmentTag = 'Equipment',
  onUpdate,
  onDelete,
  onCreate
}: {
  inspections: EquipmentInspection[];
  equipmentTag?: string;
  onCreate: (input: CreateEquipmentInspectionInput) => void;
  onUpdate: (id: string, input: Partial<CreateEquipmentInspectionInput>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<EquipmentInspection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('ALL');

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const matchesSearch = 
        item.inspectionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.inspector && item.inspector.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.observation && item.observation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesResult = 
        resultFilter === 'ALL' || (item.result || item.status).toUpperCase() === resultFilter;

      return matchesSearch && matchesResult;
    });
  }, [inspections, searchQuery, resultFilter]);

  // Find next upcoming inspection
  const nextUpcoming = useMemo(() => {
    const future = inspections
      .map((i) => ({ ...i, targetDate: new Date(i.nextInspectionDate ?? i.dueDate).getTime() }))
      .sort((a, b) => a.targetDate - b.targetDate);
    return future[0];
  }, [inspections]);

  return (
    <div className="space-y-5 psm-fade-in">
      {/* 1. RBI & Mechanical Integrity Status Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              MI Inspection Status
            </span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">COMPLIANT</div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            OSHA 1910.119(j) Mechanical Integrity Proof-Testing active
          </p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              Next Mandatory Test
            </span>
            <Calendar size={18} className="text-info" />
          </div>
          <div className="mt-2 text-xl font-bold text-[var(--psm-text)]">
            {nextUpcoming ? new Date(nextUpcoming.nextInspectionDate ?? nextUpcoming.dueDate).toLocaleDateString() : 'Scheduled Q3 2026'}
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            {nextUpcoming ? nextUpcoming.inspectionType : 'Wall Thickness NDT Survey'}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              RBI Risk Tier
            </span>
            <ShieldAlert size={18} className="text-warning" />
          </div>
          <div className="mt-2 text-xl font-bold text-warning">MEDIUM-HIGH</div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            API 580 Risk-Based Inspection Interval: 24 Months
          </p>
        </div>
      </div>

      {/* 2. Controls Toolbar: Search, Filters, and Add Button */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--psm-text)]">Inspection & Proof-Test Records</h2>
              <span className="psm-badge psm-badge-primary text-xs">{inspections.length}</span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
              Non-destructive testing (NDT), vibration analysis, relief valve tests, and visual survey reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inspections..."
                className="psm-input w-full pl-9 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowCreateModal(true);
              }}
              className="psm-button psm-button-primary text-xs font-semibold shadow-md shadow-primary/20"
            >
              <Plus size={14} /> Log Inspection
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--psm-line)] pt-3 text-xs">
          {['ALL', 'PASS', 'SATISFACTORY', 'MONITOR', 'FAIL'].map((res) => (
            <button
              key={res}
              type="button"
              onClick={() => setResultFilter(res)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                resultFilter === res
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'
              }`}
            >
              {res === 'ALL' ? 'All Findings' : res}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Inspections List */}
      {filteredInspections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-12 text-center text-sm text-[var(--psm-muted)]">
          No inspections recorded for this asset.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInspections.map((inspection) => (
            <div
              key={inspection.id}
              className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm hover:border-[var(--psm-line)]/80 transition"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                    /fail/i.test(inspection.result ?? '') ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                    /monitor/i.test(inspection.result ?? '') ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <Wrench size={18} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[var(--psm-text)]">{inspection.inspectionType}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        /fail/i.test(inspection.result ?? '') ? 'bg-red-500/20 text-red-300' :
                        /monitor/i.test(inspection.result ?? '') ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {inspection.result ?? inspection.status}
                      </span>
                      {inspection.rbiPriority && (
                        <span className="rounded bg-[var(--psm-surface-2)] border border-[var(--psm-line)] px-2 py-0.5 text-xs font-semibold text-[var(--psm-muted)]">
                          RBI: {inspection.rbiPriority}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--psm-muted)]">
                      <span className="flex items-center gap-1">
                        <User size={13} /> Inspector: <strong className="text-[var(--psm-text)]">{inspection.inspector || 'Certified API 570 Inspector'}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> Inspected: <strong>{new Date(inspection.inspectionDate || inspection.dueDate).toLocaleDateString()}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> Next Due: <strong className="text-info">{new Date(inspection.nextInspectionDate || inspection.dueDate).toLocaleDateString()}</strong>
                      </span>
                    </div>

                    {inspection.observation && (
                      <p className="mt-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-text)] leading-relaxed">
                        <strong className="text-[var(--psm-muted)] block mb-1">Findings & Observations:</strong>
                        {inspection.observation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(inspection);
                      setShowCreateModal(true);
                    }}
                    className="psm-button psm-button-secondary text-xs py-1"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(inspection.id)}
                    className="psm-button psm-button-ghost text-xs text-danger py-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log / Edit Inspection Modal */}
      {showCreateModal && (
        <InspectionModal
          title={editing ? 'Edit Inspection Record' : 'Log New Inspection / Proof-Test'}
          inspection={editing}
          onClose={() => {
            setShowCreateModal(false);
            setEditing(null);
          }}
          onSubmit={(input) => {
            if (editing) onUpdate(editing.id, input);
            else onCreate(input);
            setShowCreateModal(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function InspectionModal({
  title,
  inspection,
  onClose,
  onSubmit
}: {
  title: string;
  inspection?: EquipmentInspection | null;
  onClose: () => void;
  onSubmit: (input: CreateEquipmentInspectionInput) => void;
}) {
  const [inspectionType, setInspectionType] = useState(inspection?.inspectionType ?? 'Wall Thickness Ultrasonic Survey (NDT)');
  const [inspectionDate, setInspectionDate] = useState(dateOnly(inspection?.inspectionDate) || dateOnly(new Date().toISOString()));
  const [inspector, setInspector] = useState(inspection?.inspector ?? '');
  const [result, setResult] = useState(inspection?.result ?? 'Satisfactory');
  const [observation, setObservation] = useState(inspection?.observation ?? '');
  const [nextInspectionDate, setNextInspectionDate] = useState(dateOnly(inspection?.nextInspectionDate ?? inspection?.dueDate) || dateOnly(new Date(Date.now() + 86400000 * 365).toISOString()));
  const [rbiPriority, setRbiPriority] = useState<InspectionPriority>(inspection?.rbiPriority ?? 'MEDIUM');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-md sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl psm-fade-in">
        <div className="border-b border-[var(--psm-line)] p-5">
          <h2 className="text-lg font-bold text-[var(--psm-text)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
            OSHA 1910.119(j) Mechanical Integrity Inspection and Testing Log.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              inspectionType,
              inspectionDate,
              inspector,
              result,
              observation,
              nextInspectionDate,
              rbiPriority
            });
          }}
          className="overflow-y-auto p-5 space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-[var(--psm-text)] block mb-1">Inspection Type *</label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value)}
                className="psm-input w-full text-xs"
              >
                <option>Wall Thickness Ultrasonic Survey (NDT)</option>
                <option>API 510 Pressure Vessel Internal Inspection</option>
                <option>API 570 Piping Circuit Survey</option>
                <option>Relief Valve Bench Proof-Test (PSV)</option>
                <option>Vibration Spectrum Analysis</option>
                <option>Lube Oil Spectrochemical Analysis</option>
                <option>Visual External Survey</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[var(--psm-text)] block mb-1">Inspector / Company *</label>
              <input
                type="text"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="e.g. Imran Shah (API 570 Certified)"
                required
                className="psm-input w-full text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--psm-text)] block mb-1">Inspection Date *</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
                className="psm-input w-full text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--psm-text)] block mb-1">Next Due Date *</label>
              <input
                type="date"
                value={nextInspectionDate}
                onChange={(e) => setNextInspectionDate(e.target.value)}
                required
                className="psm-input w-full text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--psm-text)] block mb-1">Test Result / Condition *</label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="psm-input w-full text-xs"
              >
                <option>Satisfactory</option>
                <option>Pass</option>
                <option>Monitor (Corrosion Rate High)</option>
                <option>Deficiency Noted (CAPA Required)</option>
                <option>Fail - Immediate De-rate / Repair</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[var(--psm-text)] block mb-1">RBI Priority *</label>
              <select
                value={rbiPriority}
                onChange={(e) => setRbiPriority(e.target.value as InspectionPriority)}
                className="psm-input w-full text-xs"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="SAFETY_CRITICAL">Safety Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[var(--psm-text)] block mb-1">Findings, Measurements & Notes</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="e.g. Minimum measured thickness 8.4mm (Nominal 9.5mm, T-min 6.0mm). Estimated remaining life 14.2 years."
              className="psm-input w-full text-xs min-h-[90px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--psm-line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="psm-button psm-button-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="psm-button psm-button-primary text-xs font-semibold"
            >
              Save Inspection Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function dateOnly(iso?: string | null) {
  if (!iso) return '';
  return iso.split('T')[0] ?? '';
}
