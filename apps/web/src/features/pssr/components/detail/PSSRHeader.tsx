'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Printer, RefreshCw, Share2 } from 'lucide-react';
import { Badge, riskTone, statusTone } from '../pssr-ui';
import { CertificateStatusBadge } from '../certificate/CertificateStatusBadge';

export function PSSRHeader({ pssr, onReadiness, busy }: { pssr: any; onReadiness: () => void; busy?: boolean }) {
  return (
    <header className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-5 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link href="/pssr" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-blue-200"><ArrowLeft size={16} /> Back to PSSR Dashboard</Link>
          <div className="flex flex-wrap items-center gap-2"><Badge tone="blue">{pssr.pssr_number}</Badge><Badge tone="purple">{pssr.pssr_type}</Badge><Badge tone={statusTone(pssr.status)}>{pssr.status}</Badge><Badge tone={riskTone(pssr.risk_level)}>{pssr.risk_level}</Badge>{pssr.auto_created_from_moc ? <Badge tone="green">Auto-created from MOC</Badge> : null}<CertificateStatusBadge status={pssr.startup_certificate_status} />{pssr.linkedMoc?.moc ? <Link href={`/moc/${pssr.linkedMoc.moc.id}`}><Badge tone="amber">{pssr.linkedMoc.moc.moc_number}</Badge></Link> : null}</div>
          <h1 className="mt-3 text-3xl font-black text-white">{pssr.title}</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-400">{pssr.description}</p>
          {pssr.startup_certificate_status !== 'Issued' && ['Ready For Authorization', 'Authorized For Startup'].includes(pssr.status) ? <div className="mt-3 rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-100">Startup blocked: issued digital startup certificate is required before release.</div> : null}
          <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-3"><span>Location: {pssr.site?.name ?? pssr.site_id} / {pssr.unit?.name ?? '-'} / {pssr.area?.name ?? '-'}</span><span>Target startup: {pssr.target_startup_at ? new Date(pssr.target_startup_at).toLocaleString() : '-'}</span><span>Coordinator: {pssr.coordinator?.displayName ?? pssr.coordinator_id ?? '-'}</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onReadiness} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-500/10 px-3 text-sm font-black text-emerald-100"><RefreshCw size={16} /> Run Readiness</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-black text-slate-100"><Share2 size={16} /> Secure Share</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-black text-slate-100"><Download size={16} /> Report</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-black text-slate-100"><Printer size={16} /> Print</button>
        </div>
      </div>
    </header>
  );
}
