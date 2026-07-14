'use client';

import { Box, FileText, History, ImageUp, Link2, ListChecks, MessageSquarePlus, Pencil, QrCode, Upload } from 'lucide-react';

export function QuickActions({
  onEdit,
  onGenerateQr,
  onAddChild,
  onUpload,
  onUploadPhoto,
  onLinkedRecords,
  onActions,
  onInspectionHistory,
  onDocuments,
  onAddNote
}: {
  onEdit: () => void;
  onGenerateQr: () => void;
  onAddChild: () => void;
  onUpload: () => void;
  onUploadPhoto: () => void;
  onLinkedRecords: () => void;
  onActions: () => void;
  onInspectionHistory: () => void;
  onDocuments: () => void;
  onAddNote: () => void;
}) {
  const actions = [
    ['Edit Equipment', Pencil, onEdit],
    ['Upload / Change Photo', ImageUp, onUploadPhoto],
    ['Generate QR Label', QrCode, onGenerateQr],
    ['Add Child Equipment', Box, onAddChild],
    ['Upload Document', Upload, onUpload],
    ['View Linked Records', Link2, onLinkedRecords],
    ['Open Actions', ListChecks, onActions],
    ['Inspection History', History, onInspectionHistory],
    ['Documents', FileText, onDocuments],
    ['Add Note', MessageSquarePlus, onAddNote]
  ] as const;
  return (
    <div className="psm-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Quick Actions</h2>
      {actions.map(([label, Icon, handler]) => (
        <button key={label} onClick={handler} className="mb-2 flex min-h-10 w-full items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-left text-sm font-medium text-[var(--psm-text)] transition hover:-translate-y-0.5 hover:border-primary hover:shadow-sm">
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
