'use client';
import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PSSRAttachmentPreviewDrawer({ attachment }: { attachment?: any }) {
  // Simple helper to check if the attachment looks like an image
  const isImage = attachment?.mime_type?.startsWith('image/') || 
                  ['png', 'jpg', 'jpeg', 'webp'].includes(attachment?.attachment_type?.toLowerCase());

  return (
    <PSSRCard title="Attachment Preview">
      {attachment ? (
        <div className="flex flex-col h-full space-y-5">
          
          {/* Visual Preview Canvas Box */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center">
            {isImage ? (
              /* If it's an image, show a placeholder graphics container */
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="h-12 w-12 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl font-bold">🖼️</div>
                <span className="text-xs text-slate-400">Image Preview Asset</span>
              </div>
            ) : (
              /* Default document file graphic presentation layout */
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="h-14 w-10 rounded-md border-2 border-dashed border-slate-700 bg-slate-900 flex flex-col justify-between p-1.5">
                  <div className="w-full h-1 bg-slate-700 rounded-sm"></div>
                  <div className="w-3/4 h-1 bg-slate-700 rounded-sm"></div>
                  <div className="w-1/2 h-1 bg-slate-700 rounded-sm"></div>
                </div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {attachment.attachment_type || 'Document'}
                </span>
              </div>
            )}
          </div>

          {/* Metadata Meta Information Display */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">File Name</span>
              <p className="text-lg font-black leading-snug text-white break-words">{attachment.file_name}</p>
            </div>

            {attachment.description && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description</span>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{attachment.description}</p>
              </div>
            )}

            {/* Badges system properties wrapper layout */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <Badge tone="cyan">{attachment.attachment_type}</Badge>
              <Badge tone="slate">{attachment.mime_type ?? 'Unknown type'}</Badge>
            </div>
          </div>

          {/* System Audit Meta Footer */}
          <div className="mt-auto border-t border-white/5 pt-4">
            <div className="rounded-lg bg-slate-950/40 p-3 text-[11px] font-mono text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Storage Key:</span>
                <span className="text-slate-400 truncate max-w-[180px]" title={attachment.file_key}>
                  {attachment.file_key ?? '-'}
                </span>
              </div>
              {attachment.file_size && (
                <div className="flex justify-between">
                  <span>File Weight:</span>
                  <span className="text-slate-400">
                    {Math.round(Number(attachment.file_size) / 1024)} KB
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="py-12">
          <EmptyState title="Select an attachment to preview" />
        </div>
      )}
    </PSSRCard>
  );
}