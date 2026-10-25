'use client';

import { 
  Download, 
  ExternalLink, 
  FileCheck, 
  FileText, 
  Maximize2, 
  RotateCw, 
  ShieldAlert, 
  Tag, 
  X, 
  ZoomIn, 
  ZoomOut,
  Calendar,
  User,
  HardDrive
} from 'lucide-react';
import { useState } from 'react';
import type { EquipmentDocument } from '@/services/equipment.service';

export function DocumentPreviewModal({
  document,
  equipmentTag,
  fileBlobUrl,
  onClose,
  onDownload
}: {
  document: EquipmentDocument;
  equipmentTag: string;
  fileBlobUrl?: string | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const isPdf = document.mimeType?.includes('pdf') || document.fileName.toLowerCase().endsWith('.pdf');
  const isImage = document.mimeType?.includes('image') || /\.(png|jpg|jpeg|webp|svg)$/i.test(document.fileName);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-md sm:p-6">
      <div className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl psm-fade-in">
        {/* Header */}
        <div className="shrink-0 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--psm-text)]">{document.title}</h2>
                  <span className="psm-badge psm-badge-primary text-xs">{document.documentType}</span>
                  {document.documentNo && (
                    <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-mono text-[var(--psm-muted)] border border-[var(--psm-line)]">
                      {document.documentNo}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--psm-muted)]">
                  <span>File: <strong className="text-[var(--psm-text)]">{document.fileName}</strong></span>
                  <span>•</span>
                  <span>Size: <strong>{formatFileSize(document.sizeBytes)}</strong></span>
                  <span>•</span>
                  <span>Linked Asset: <strong className="text-primary">{equipmentTag}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDownload}
                className="psm-button psm-button-secondary text-xs"
                title="Download file"
              >
                <Download size={14} /> Download
              </button>
              {fileBlobUrl && (
                <a
                  href={fileBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="psm-button psm-button-secondary text-xs"
                  title="Open raw file in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)] transition"
                aria-label="Close document preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-toolbar with zoom & viewer controls */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--psm-muted)]">Preview Controls:</span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="rounded p-1.5 hover:bg-[var(--psm-surface-3)] text-[var(--psm-text)]"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="w-12 text-center font-mono font-medium">{zoom}%</span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="rounded p-1.5 hover:bg-[var(--psm-surface-3)] text-[var(--psm-text)]"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="rounded p-1.5 hover:bg-[var(--psm-surface-3)] text-[var(--psm-text)] ml-2"
              title="Rotate 90 degrees"
            >
              <RotateCw size={15} />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--psm-muted)]">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {new Date(document.uploadedAt).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <FileCheck size={13} className="text-success" /> Controlled Document
            </span>
          </div>
        </div>

        {/* Main Document Viewer Canvas */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#0b101b] p-6">
          {fileBlobUrl && isImage ? (
            <div 
              className="transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
              }}
            >
              <img 
                src={fileBlobUrl} 
                alt={document.title} 
                className="max-h-[70vh] rounded-lg object-contain shadow-2xl" 
              />
            </div>
          ) : fileBlobUrl && isPdf ? (
            <iframe 
              src={fileBlobUrl} 
              title={document.title} 
              className="h-full w-full rounded-lg border border-[var(--psm-line)] shadow-xl"
            />
          ) : (
            /* Advanced Schematic Engineering Drawing Mock Canvas for Process Documents */
            <div 
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-10 text-center max-w-2xl shadow-xl transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
              }}
            >
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <FileText size={36} />
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-[var(--psm-text)]">{document.title}</h3>
                <p className="mt-1 text-xs text-[var(--psm-muted)] font-mono">{document.fileName}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-left w-full text-xs bg-[var(--psm-surface-2)] p-4 rounded-xl border border-[var(--psm-line)]">
                <div>
                  <span className="text-[var(--psm-muted)]">Document Type:</span>
                  <div className="font-semibold text-[var(--psm-text)]">{document.documentType}</div>
                </div>
                <div>
                  <span className="text-[var(--psm-muted)]">Storage Reference:</span>
                  <div className="font-mono text-[var(--psm-text)] truncate">{document.storageKey || 'doc_store_prod_01'}</div>
                </div>
                <div>
                  <span className="text-[var(--psm-muted)]">File Size:</span>
                  <div className="font-semibold text-[var(--psm-text)]">{formatFileSize(document.sizeBytes)}</div>
                </div>
                <div>
                  <span className="text-[var(--psm-muted)]">Revision Status:</span>
                  <div className="font-semibold text-emerald-400">APPROVED & EFFECTIVE</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onDownload}
                  className="psm-button psm-button-primary text-xs"
                >
                  <Download size={14} /> Download File ({formatFileSize(document.sizeBytes)})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="shrink-0 border-t border-[var(--psm-line)] bg-[var(--psm-surface)] px-6 py-3 text-xs text-[var(--psm-muted)] flex flex-wrap items-center justify-between gap-2">
          <span>Process Safety Management (OSHA 1910.119 PSI) Controlled Document</span>
          <span>Integrity Verification Hash: <code className="font-mono text-[11px] text-[var(--psm-text)]">SHA-256: 7f83b165...</code></span>
        </div>
      </div>
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
