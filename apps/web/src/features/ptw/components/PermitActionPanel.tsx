import { Download, FileText, Printer, Shield } from 'lucide-react';
import { ptwService, type Permit } from '@/services/ptw.service';

export function PermitActionPanel({
  permit,
  onCreateMoc,
  onSaveTemplate
}: {
  permit: Permit;
  onCreateMoc: () => void;
  onSaveTemplate: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-slate-100">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
        Permit Documentation & Actions
      </h2>
      <div className="space-y-2">
        <a
          className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          href={ptwService.certificateUrl(permit.id)}
          target="_blank"
          rel="noreferrer"
        >
          <Printer size={13} className="text-primary dark:text-sky-400" />
          <span>Print Official Permit</span>
        </a>

        <a
          className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          href={ptwService.isolationCertificateUrl(permit.id)}
          target="_blank"
          rel="noreferrer"
        >
          <Shield size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>Download Isolation Certificate</span>
        </a>

        <button
          onClick={onCreateMoc}
          type="button"
          className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
        >
          <FileText size={13} className="text-purple-600 dark:text-purple-400" />
          <span>Create Related MOC Record</span>
        </button>

        <button
          onClick={onSaveTemplate}
          type="button"
          className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
        >
          <Download size={13} className="text-amber-600 dark:text-amber-400" />
          <span>Save As Permit Template</span>
        </button>
      </div>
    </section>
  );
}
