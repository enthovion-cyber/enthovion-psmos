'use client';

import { FileCheck2, Share2 } from 'lucide-react';
import { EmptyState, PSSRCard } from '../pssr-ui';
import { CertificateStatusBadge } from './CertificateStatusBadge';

export function StartupCertificatePanel({ certificate, pssr, onGenerate, onShare, busy }: { certificate?: any; pssr?: any; onGenerate?: () => void; onShare?: () => void; busy?: boolean }) {
  return (
    <PSSRCard title="Digital Startup Certificate" action={<CertificateStatusBadge status={certificate?.status ?? pssr?.startup_certificate_status} />}>
      {certificate ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-cyan-300/10 bg-slate-950/30 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Certificate Number</p>
            <p className="mt-1 text-lg font-black text-white">{certificate.certificate_number}</p>
            <p className="mt-1 text-xs text-slate-500">Version {certificate.version} · issued {certificate.issued_at ? new Date(certificate.issued_at).toLocaleString() : '-'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onGenerate} className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-black text-slate-100 hover:border-blue-300/40"><FileCheck2 size={15} /> Regenerate</button>
            <button onClick={onShare} className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-black text-slate-100 hover:border-emerald-300/40"><Share2 size={15} /> Secure Share</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <EmptyState title="Startup certificate missing" detail="Release startup is blocked until all critical readiness gates pass and the certificate is issued." />
          <button disabled={busy} onClick={onGenerate} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-black text-white disabled:opacity-50"><FileCheck2 size={15} /> Generate Certificate</button>
        </div>
      )}
    </PSSRCard>
  );
}
