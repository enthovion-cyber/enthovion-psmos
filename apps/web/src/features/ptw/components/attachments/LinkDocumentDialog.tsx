'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link2, X } from 'lucide-react';
import type { DocumentRecord } from '@/services/documents.service';
import { useForm } from 'react-hook-form';
import { linkDocumentSchema, type LinkDocumentValues } from '../../schemas/attachment.schema';

export function LinkDocumentDialog({
  open,
  documents,
  onSearch,
  onClose,
  onSubmit,
  saving = false
}: {
  open: boolean;
  documents?: DocumentRecord[] | undefined;
  onSearch: (search: string) => void;
  onClose: () => void;
  onSubmit: (values: LinkDocumentValues) => void;
  saving?: boolean;
}) {
  const form = useForm<LinkDocumentValues>({
    resolver: zodResolver(linkDocumentSchema),
    defaultValues: {
      documentId: '',
      documentVersionId: '',
      title: '',
      documentNumber: '',
      attachmentType: 'Document Control'
    }
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--psm-line)] p-5">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Link2 size={18} /> Link Document Control File
            </h3>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">
              Search and link an existing controlled document without duplicating the file.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-3 p-5">
          <label className="text-sm font-semibold">
            Search Documents
            <input 
              onChange={(event) => onSearch(event.target.value)} 
              className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" 
              placeholder="Search by number, title, or description" 
            />
          </label>

          <div className="max-h-44 overflow-auto rounded-lg border border-[var(--psm-line)]">
            {(documents ?? []).slice(0, 6).map((doc) => (
              <button 
                key={doc.id} 
                type="button" 
                onClick={() => { 
                  form.setValue('documentId', doc.id); 
                  form.setValue('documentVersionId', doc.current_version_id ?? ''); 
                  form.setValue('documentNumber', doc.document_number); 
                  form.setValue('title', doc.title); 
                }} 
                className="block w-full border-b border-[var(--psm-line)] px-3 py-2 text-left text-sm hover:bg-[var(--psm-surface-2)]"
              >
                <div className="font-semibold">{doc.document_number} · {doc.title}</div>
                <div className="text-xs text-[var(--psm-muted)]">{doc.document_type} · {doc.status}</div>
              </button>
            ))}
            
            {!documents?.length ? (
              <div className="p-3 text-sm text-[var(--psm-muted)]">
                No documents found yet. Enter a document ID manually if needed.
              </div>
            ) : null}
          </div>

          <label className="text-sm font-semibold">
            Document ID
            <input {...form.register('documentId')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" />
          </label>
          
          <label className="text-sm font-semibold">
            Version ID
            <input {...form.register('documentVersionId')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" />
          </label>
          
          <label className="text-sm font-semibold">
            Document Number
            <input {...form.register('documentNumber')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" />
          </label>
          
          <label className="text-sm font-semibold">
            Title
            <input {...form.register('title')} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" />
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] p-5">
          <button type="button" onClick={onClose} className="psm-button psm-button-secondary">
            Cancel
          </button>
          <button disabled={saving} className="psm-button psm-button-primary">
            {saving ? 'Linking...' : 'Link Document'}
          </button>
        </div>
        
      </form>
    </div>
  );
}