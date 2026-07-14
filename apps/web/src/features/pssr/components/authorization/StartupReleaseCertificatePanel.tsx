'use client';
import { Badge, PSSRCard } from '../pssr-ui';
export function StartupReleaseCertificatePanel({ certificate }: { certificate: any }) {
  return <PSSRCard title="Startup Release Certificate / Report"><div className="space-y-2 text-sm"><Row label="PSSR Number" value={certificate?.pssrNumber} /><Row label="Linked MOC" value={certificate?.linkedMoc ?? '-'} /><Row label="Checklist" value={`${certificate?.checklistReadiness ?? 0}%`} /><Row label="Document Readiness" value={`${certificate?.documentReadiness ?? 0}%`} /><Row label="Training" value={`${certificate?.trainingReadiness ?? 0}%`} /><Row label="Testing" value={`${certificate?.testingReadiness ?? 0}%`} /><Row label="Punch" value={`${certificate?.punchReadiness ?? 0}%`} /><div className="pt-2"><Badge tone={certificate?.releasedAt ? 'green' : 'amber'}>{certificate?.releasedAt ? 'Released' : 'Draft Certificate'}</Badge></div></div></PSSRCard>;
}
function Row({ label, value }: { label: string; value: any }) { return <div className="flex justify-between border-b border-white/5 py-2"><span className="text-slate-400">{label}</span><span className="font-bold text-white">{value ?? '-'}</span></div>; }
