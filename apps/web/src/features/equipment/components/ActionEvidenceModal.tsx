'use client';

import { 
  CheckCircle2, 
  Clock, 
  Download, 
  FileCheck, 
  FileUp, 
  Image as ImageIcon, 
  ShieldAlert, 
  Trash2, 
  UploadCloud, 
  UserCheck, 
  X 
} from 'lucide-react';
import { useState } from 'react';
import type { EquipmentAction } from '@/services/equipment.service';

export function ActionEvidenceModal({
  action,
  equipmentTag,
  onClose,
  onUploadEvidence,
  onVerify
}: {
  action: EquipmentAction;
  equipmentTag: string;
  onClose: () => void;
  onUploadEvidence: (actionId: string, file: File, notes: string) => Promise<void>;
  onVerify?: (actionId: string, notes: string) => Promise<void>;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [verifierNotes, setVerifierNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  // Mock initial evidence items if action doesn't have populated array
  const evidenceList = action.evidence && action.evidence.length > 0 ? action.evidence : [
    {
      id: 'ev-1',
      status: 'VERIFIED',
      fileName: 'Field_Seal_Leak_Inspection_Report.pdf',
      mimeType: 'application/pdf',
      storageKey: 'evidence_field_101.pdf',
      uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewFileUrl(URL.createObjectURL(file));
      } else {
        setPreviewFileUrl(null);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      await onUploadEvidence(action.id, selectedFile, evidenceNotes);
      setSelectedFile(null);
      setEvidenceNotes('');
      setPreviewFileUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const isPreStartup = (action as any).timingGate === 'PRE_STARTUP' || /startup|pssr/i.test(action.title);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-md sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl psm-fade-in">
        {/* Header */}
        <div className="shrink-0 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="psm-badge psm-badge-primary text-xs">
                  {action.actionNumber || action.id.slice(0, 8)}
                </span>
                {isPreStartup && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400">
                    <ShieldAlert size={12} /> PRE-STARTUP BLOCKER
                  </span>
                )}
                <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs text-[var(--psm-muted)] border border-[var(--psm-line)]">
                  Asset: <strong className="text-[var(--psm-text)]">{equipmentTag}</strong>
                </span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-[var(--psm-text)]">{action.title}</h2>
              <p className="mt-1 text-xs text-[var(--psm-muted)] leading-relaxed max-w-xl">
                {action.description}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)] transition"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Action Meta Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs">
            <div>
              <span className="text-[var(--psm-muted)]">Priority:</span>
              <div className="font-bold text-warning">{action.priority.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <span className="text-[var(--psm-muted)]">Current Status:</span>
              <div className="font-semibold text-info">{action.status.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <span className="text-[var(--psm-muted)]">Due Date:</span>
              <div className="font-semibold text-[var(--psm-text)]">{new Date(action.dueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="text-[var(--psm-muted)]">Assignee:</span>
              <div className="font-semibold text-[var(--psm-text)]">{action.assignedTo?.displayName || 'HSE Engineer'}</div>
            </div>
          </div>

          {/* Upload New Evidence Form */}
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-text)] flex items-center gap-2">
              <FileUp size={14} className="text-primary" /> Upload Field Completion Evidence
            </h3>
            <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
              Attach field photos, calibration certificates, torque sheets, or sign-off checklists to fulfill verification.
            </p>

            <form onSubmit={handleUpload} className="mt-4 space-y-3">
              <div className="rounded-xl border-2 border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-center hover:border-primary/50 transition">
                <input
                  type="file"
                  id="evidence-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="evidence-file-input"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <UploadCloud size={28} className="text-primary" />
                  <span className="mt-2 text-xs font-semibold text-[var(--psm-text)]">
                    {selectedFile ? selectedFile.name : 'Choose evidence file or drop here'}
                  </span>
                  <span className="text-[11px] text-[var(--psm-muted)]">
                    PNG, JPG, PDF, or DOCX (Max 25MB)
                  </span>
                </label>
              </div>

              {previewFileUrl && (
                <div className="relative mt-2 max-w-xs overflow-hidden rounded-lg border border-[var(--psm-line)]">
                  <img src={previewFileUrl} alt="Evidence Preview" className="h-28 w-full object-cover" />
                </div>
              )}

              <input
                type="text"
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Field notes / completion description (e.g. 'Torqued casing bolts to 120 ft-lb according to vendor spec')..."
                className="psm-input w-full text-xs"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="psm-button psm-button-primary text-xs font-semibold"
                >
                  {isUploading ? 'Uploading...' : 'Save & Attach Evidence'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Uploaded Evidence Records */}
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-text)] flex items-center gap-2">
              <FileCheck size={14} className="text-emerald-400" /> Attached Evidence ({evidenceList.length})
            </h3>

            <div className="mt-3 space-y-2">
              {evidenceList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <ImageIcon size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--psm-text)]">{item.fileName}</div>
                      <div className="text-[11px] text-[var(--psm-muted)]">
                        Uploaded {new Date(item.uploadedAt).toLocaleDateString()} · Status: <span className="text-emerald-400 font-bold">{item.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="psm-button psm-button-secondary text-xs py-1"
                      onClick={() => alert(`Downloading evidence: ${item.fileName}`)}
                    >
                      <Download size={13} /> View / Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verifier Sign-off Section (Four-Eyes Principle) */}
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-text)] flex items-center gap-2">
              <UserCheck size={14} className="text-info" /> Four-Eyes Verification Sign-off
            </h3>
            <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
              Independent sign-off by a qualified Safety/Plant Authority verifying that the field evidence meets PSM standards.
            </p>

            <div className="mt-3 space-y-3">
              <textarea
                value={verifierNotes}
                onChange={(e) => setVerifierNotes(e.target.value)}
                placeholder="Enter verification comments or audit findings before signing off..."
                className="psm-input w-full text-xs min-h-[60px]"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--psm-muted)]">
                  Logged under your authenticated digital signature.
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (onVerify) await onVerify(action.id, verifierNotes);
                    onClose();
                  }}
                  className="psm-button psm-button-primary text-xs font-semibold bg-emerald-600 hover:bg-emerald-500"
                >
                  <CheckCircle2 size={14} /> Approve & Close Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
