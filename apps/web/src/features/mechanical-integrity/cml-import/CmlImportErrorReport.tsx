'use client';

export function CmlImportErrorReport({ job }: { job?: Record<string, any> | null }) {
  if (!job || !Number(job.error_rows ?? 0)) return null;
  return <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Import has {String(job.error_rows)} error rows. Fix the source data or download the backend error report from the API.</div>;
}
