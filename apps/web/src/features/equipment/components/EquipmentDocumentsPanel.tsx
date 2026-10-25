'use client';

import { useMemo, useState } from 'react';
import { 
  Download, 
  Eye, 
  FilePlus2, 
  FileText, 
  Filter, 
  HardDrive, 
  RefreshCw, 
  Search, 
  Trash2,
  CheckCircle2
} from 'lucide-react';
import type { EquipmentDocument, UploadEquipmentDocumentInput } from '@/services/equipment.service';
import { DocumentPreviewModal } from './DocumentPreviewModal';

export function EquipmentDocumentsPanel({
  documents,
  equipmentTag = 'Equipment',
  onUpload,
  onReplace,
  onDelete,
  onPreview,
  onDownload
}: {
  documents: EquipmentDocument[];
  equipmentTag?: string;
  onUpload: (input: UploadEquipmentDocumentInput) => void;
  onReplace: (documentId: string, input: UploadEquipmentDocumentInput) => void;
  onDelete: (documentId: string) => void;
  onPreview: (document: EquipmentDocument) => void;
  onDownload: (document: EquipmentDocument) => void;
}) {
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [previewDoc, setPreviewDoc] = useState<EquipmentDocument | null>(null);

  const documentTypes = useMemo(() => {
    const types = new Set(documents.map((d) => d.documentType));
    return ['ALL', ...Array.from(types)];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.documentNo && doc.documentNo.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === 'ALL' || doc.documentType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, typeFilter]);

  const totalBytes = useMemo(() => {
    return documents.reduce((acc, doc) => acc + (doc.sizeBytes || 0), 0);
  }, [documents]);

  return (
    <div className="space-y-4 psm-fade-in">
      {/* Top Header Card */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--psm-text)]">Controlled Engineering Documents</h2>
              <span className="psm-badge psm-badge-primary text-xs">{documents.length}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Process Safety Information (OSHA 1910.119(d)), P&IDs, equipment datasheets, and operating procedures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 text-xs text-[var(--psm-muted)] sm:flex">
              <HardDrive size={14} /> Total: <strong className="text-[var(--psm-text)]">{formatFileSize(totalBytes)}</strong>
            </div>
            <DocumentUploadButton label="Upload Document" onSubmit={onUpload} />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--psm-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title, file, or number..."
              className="psm-input w-full pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[var(--psm-muted)] mr-1">Type:</span>
            {documentTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  typeFilter === type
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
        <Empty 
          title="No controlled documents linked" 
          description="Upload a P&ID, datasheet, certificate, SOP, or vendor file to begin document control for this asset." 
        />
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-sm text-[var(--psm-muted)]">
          No documents matched your search or filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="psm-table w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">File Size</th>
                  <th className="px-4 py-3">Uploaded Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--psm-surface-2)]/60 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--psm-text)]">{doc.title}</div>
                          {doc.documentNo && (
                            <div className="text-xs font-mono text-[var(--psm-muted)]">{doc.documentNo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                        doc.documentType === 'P&ID' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' :
                        doc.documentType === 'Datasheet' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        doc.documentType === 'SOP' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        'bg-[var(--psm-surface-3)] text-[var(--psm-muted)]'
                      }`}>
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--psm-muted)] max-w-xs truncate">
                      {doc.fileName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)]">
                      {formatFileSize(doc.sizeBytes)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--psm-muted)]">
                      {new Date(doc.uploadedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDoc(doc);
                            onPreview(doc);
                          }}
                          className="rounded-lg p-1.5 text-info hover:bg-info/10 transition"
                          title="Open Document Preview"
                          aria-label={`Preview ${doc.title}`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownload(doc)}
                          className="rounded-lg p-1.5 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)] transition"
                          title="Download Document"
                          aria-label={`Download ${doc.title}`}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplaceId(replaceId === doc.id ? null : doc.id)}
                          className="rounded-lg p-1.5 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)] transition"
                          title="Upload New Version / Replace"
                          aria-label={`Replace ${doc.title}`}
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(doc.id)}
                          className="rounded-lg p-1.5 text-danger hover:bg-danger/10 transition"
                          title="Remove Document Link"
                          aria-label={`Delete ${doc.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Replace Document Drawer / Form */}
      {replaceId && (
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--psm-text)]">Upload Revision / Replace Document</h3>
            <button
              type="button"
              onClick={() => setReplaceId(null)}
              className="text-xs text-[var(--psm-muted)] hover:underline"
            >
              Cancel
            </button>
          </div>
          <DocumentUploadButton
            label="Upload Revision"
            onSubmit={(input) => {
              onReplace(replaceId, input);
              setReplaceId(null);
            }}
            expanded
          />
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          equipmentTag={equipmentTag}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => onDownload(previewDoc)}
        />
      )}
    </div>
  );
}

function DocumentUploadButton({ 
  label, 
  onSubmit, 
  expanded = false 
}: { 
  label: string; 
  onSubmit: (input: UploadEquipmentDocumentInput) => void; 
  expanded?: boolean 
}) {
  const [open, setOpen] = useState(expanded);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('Datasheet');

  if (!open) {
    return (
      <button 
        type="button" 
        onClick={() => setOpen(true)} 
        className="psm-button psm-button-primary text-xs font-semibold shadow-md shadow-primary/20"
      >
        <FilePlus2 size={15} /> {label}
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (file && title) {
          onSubmit({ title, documentType, file });
          setOpen(false);
          setFile(null);
          setTitle('');
        }
      }}
      className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 md:grid-cols-4 psm-fade-in"
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        placeholder="Document Title *"
        className="psm-input px-3 text-xs"
      />
      <select
        value={documentType}
        onChange={(event) => setDocumentType(event.target.value)}
        className="psm-input px-3 text-xs"
      >
        {['P&ID', 'Datasheet', 'Vendor Manual', 'SOP', 'Certificate', 'Inspection Report', 'Cause & Effect Matrix', 'Other'].map(
          (type) => (
            <option key={type} value={type}>{type}</option>
          )
        )}
      </select>
      <input
        type="file"
        required
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="psm-input p-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-[var(--psm-surface-3)] file:px-2 file:py-1 file:text-xs file:text-[var(--psm-text)]"
      />
      <div className="flex items-center gap-2">
        <button type="submit" className="psm-button psm-button-primary text-xs flex-1">
          Save Document
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="psm-button psm-button-secondary text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <FileText size={24} />
      </div>
      <h3 className="mt-3 text-base font-bold text-[var(--psm-text)]">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--psm-muted)]">{description}</p>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
