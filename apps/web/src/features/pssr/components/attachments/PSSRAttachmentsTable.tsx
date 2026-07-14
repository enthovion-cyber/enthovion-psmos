'use client';
import { useState } from 'react';
import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PSSRAttachmentsTable({ 
  attachments, 
  onPreview, 
  onDownload, 
  onDelete 
}: { 
  attachments: any[]; 
  onPreview: (id: string) => void; 
  onDownload: (id: string) => void; 
  onDelete: (id: string) => void 
}) {
  // State to track whether the user wants to see all attachments
  const [isExpanded, setIsExpanded] = useState(false);

  const MAX_INITIAL_ITEMS = 4;
  
  // Slice the array to show either the first 4 items or all items based on state
  const visibleAttachments = isExpanded 
    ? attachments 
    : attachments.slice(0, MAX_INITIAL_ITEMS);

  const hasMoreItems = attachments.length > MAX_INITIAL_ITEMS;

  return (
    <PSSRCard title={`Attachments Table / Grid (${attachments.length})`}>
      {attachments.length > 0 ? (
        <div className="space-y-4">
          {/* Grid View */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visibleAttachments.map((file) => (
              <div 
                key={file.id} 
                className="group relative flex flex-col rounded-xl border border-white/10 bg-slate-900/50 p-5 transition-all duration-200 hover:border-white/20 hover:bg-slate-900/80"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{file.file_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {file.attachment_type} • {file.mime_type ?? 'Unknown'} • {file.file_size ? `${Math.round(Number(file.file_size) / 1024)} KB` : '0 KB'}
                    </p>
                  </div>
                  <Badge tone={file.document_id ? 'green' : 'slate'}>
                    {file.document_id ? 'Linked' : 'Loose'}
                  </Badge>
                </div>

                {/* Body */}
                {file.description && (
                  <p className="mt-3 text-sm text-slate-400 line-clamp-2">{file.description}</p>
                )}

                {/* Footer Controls */}
                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-white/5">
                  <ActionButton onClick={() => onPreview(file.id)} label="Preview" className="text-blue-100 hover:bg-blue-500/20 border-blue-500/20" />
                  <ActionButton onClick={() => onDownload(file.id)} label="Download" className="text-emerald-100 hover:bg-emerald-500/20 border-emerald-500/20" />
                  <ActionButton onClick={() => onDelete(file.id)} label="Delete" className="text-red-100 hover:bg-red-500/20 border-red-500/20 ml-auto" />
                </div>
              </div>
            ))}
          </div>

          {/* "View All / Show Less" Toggle Controller */}
          {hasMoreItems && (
            <div className="mt-4 flex justify-center border-t border-white/10 pt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-xs font-black text-cyan-200 transition-all hover:bg-cyan-500/20 active:scale-95"
              >
                {isExpanded ? 'Show Less' : `View All (${attachments.length} Items)`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState title="No supporting attachments uploaded yet." />
      )}
    </PSSRCard>
  );
}

function ActionButton({ onClick, label, className }: { onClick: () => void, label: string, className: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${className}`}
    >
      {label}
    </button>
  );
}