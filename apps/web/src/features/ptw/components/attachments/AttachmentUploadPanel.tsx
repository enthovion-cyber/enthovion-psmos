'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UploadCloud, FileUp, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { attachmentUploadSchema, type AttachmentUploadValues } from '../../schemas/attachment.schema';
import { attachmentTypes } from '../../services/ptw-attachment.service';

export function AttachmentUploadPanel({ 
  onUpload, 
  saving = false 
}: { 
  onUpload: (file: File, values: AttachmentUploadValues) => void; 
  saving?: boolean 
}) {
  const [file, setFile] = useState<File | null>(null);
  
  const form = useForm<AttachmentUploadValues>({ 
    resolver: zodResolver(attachmentUploadSchema), 
    defaultValues: { 
      attachmentType: 'Job Safety Analysis', 
      title: '', 
      description: '', 
      relatedSection: 'Details', 
      isEvidence: false, 
      isRequired: false, 
      visibility: 'Internal' 
    } 
  });

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md text-slate-100">
      
      {/* Premium Standarized Title Header Component */}
      <div className="mb-4 flex items-center gap-2 pb-3 border-b border-slate-800/60">
        <UploadCloud size={16} className="text-sky-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Upload Attachment
        </h3>
      </div>

      <form 
        onSubmit={form.handleSubmit((values) => file && onUpload(file, values))} 
        className="space-y-4"
      >
        {/* Core Input Configuration Grid Matrix */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          
          {/* Attachment Type Selection Node */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              Attachment Type
            </label>
            <select 
              {...form.register('attachmentType')} 
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 normal-case transition-all outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
            >
              {attachmentTypes.map((item) => (
                <option key={item} value={item} className="bg-slate-950 text-slate-200">
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Native File Dropzone Pipe Wrapper */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              File
            </label>
            <div className="relative w-full">
              <input 
                type="file" 
                onChange={(event) => { 
                  const next = event.target.files?.[0] ?? null; 
                  setFile(next); 
                  if (next && !form.getValues('title')) {
                    form.setValue('title', next.name);
                  }
                }} 
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 file:mr-3 file:py-0.5 file:px-2 file:rounded file:border file:border-slate-800 file:bg-slate-900 file:text-[11px] file:font-semibold file:text-slate-300 hover:file:bg-slate-800 cursor-pointer file:cursor-pointer" 
              />
            </div>
          </div>

          {/* Metadata Title Input field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              Title
            </label>
            <input 
              type="text"
              {...form.register('title')} 
              placeholder="Descriptive file label..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 normal-case placeholder-slate-600 transition-all outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20" 
            />
          </div>

          {/* Module Scope Association Parameter field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              Related Section
            </label>
            <input 
              type="text"
              {...form.register('relatedSection')} 
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 normal-case transition-all outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20" 
            />
          </div>
        </div>

        {/* Narrative Description Full Width Textbox */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
            Description / Purpose
          </label>
          <textarea 
            {...form.register('description')} 
            rows={3} 
            placeholder="Document scope modifications, certificate context, or compliance notes..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 normal-case placeholder-slate-600 transition-all resize-none outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20" 
          />
        </div>

        {/* Boolean Checklist Configuration Footer Row */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 items-center pt-2 border-t border-slate-800/40 text-xs">
          
          {/* Evidence Flag Checkbox Toggle */}
          <label className="flex items-center gap-2.5 text-slate-300 font-medium select-none cursor-pointer group">
            <input 
              type="checkbox" 
              {...form.register('isEvidence')} 
              className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-offset-0 focus:ring-sky-500/30 accent-sky-500 transition-all cursor-pointer"
            />
            <span className="group-hover:text-slate-100 transition-colors">Mark as evidence</span>
          </label>

          {/* Mandatory Dependency Checkbox Toggle */}
          <label className="flex items-center gap-2.5 text-slate-300 font-medium select-none cursor-pointer group">
            <input 
              type="checkbox" 
              {...form.register('isRequired')} 
              className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-offset-0 focus:ring-sky-500/30 accent-sky-500 transition-all cursor-pointer"
            />
            <span className="group-hover:text-slate-100 transition-colors">Required file</span>
          </label>

          {/* Data Target Access Visibility Policy Filter Dropdown */}
          <label className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none w-full sm:justify-end">
            <span>Visibility</span>
            <select 
              {...form.register('visibility')} 
              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs font-semibold normal-case text-slate-300 transition-all outline-none focus:border-sky-500/50 cursor-pointer"
            >
              <option className="bg-slate-950 text-slate-200">Internal</option>
              <option className="bg-slate-950 text-slate-200">Permit Team</option>
              <option className="bg-slate-950 text-slate-200">Auditors</option>
              <option className="bg-slate-950 text-slate-200">Document Control</option>
            </select>
          </label>
        </div>

        {/* Dynamic High-Contrast Transaction Ingestion Button */}
        <button 
          type="submit"
          disabled={!file || saving} 
          className={`inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md w-full mt-2 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/40
            ${(!file || saving) 
              ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 border border-slate-700/50' 
              : 'hover:bg-sky-500 active:scale-[0.99] shadow-lg shadow-sky-950/20'
            }`}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          ) : (
            <FileUp size={14} className="text-white" />
          )}
          <span>{saving ? 'Uploading Payload Matrix...' : 'Upload Ingested Attachment'}</span>
        </button>
      </form>
    </section>
  );
}