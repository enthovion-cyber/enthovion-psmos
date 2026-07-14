'use client';

import Link from 'next/link';
import { Camera, CheckCircle2, ExternalLink, QrCode, XCircle } from 'lucide-react';
import { Badge, PSSRCard } from '../pssr-ui';

export function AffectedEquipmentVerificationTable({ equipment, onVerify, onFail, onPhoto, onScan }: { equipment: any[]; onVerify: (item: any) => void; onFail: (item: any) => void; onPhoto: (item: any) => void; onScan: (item: any) => void }) {
  return (
    <PSSRCard title="Affected Equipment Verification Table">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#07182a] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Equipment</th><th className="px-3 py-2">Criticality</th><th className="px-3 py-2">Verification</th><th className="px-3 py-2">Installation</th><th className="px-3 py-2">Tag / QR</th><th className="px-3 py-2">Evidence</th><th className="px-3 py-2">Verifier</th><th className="px-3 py-2">Actions</th></tr></thead>
          <tbody>{equipment.map((item) => <tr key={item.id} className="border-t border-white/5 align-top transition hover:bg-white/[0.03]"><td className="px-3 py-3"><p className="font-black text-white">{item.equipment_tag_snapshot}</p><p className="text-xs text-slate-500">{item.equipment_name_snapshot} · {item.equipment_type_snapshot}</p></td><td className="px-3 py-3"><Badge tone={['High', 'Critical', 'Safety Critical'].includes(item.equipment_criticality_snapshot) ? 'red' : 'amber'}>{item.equipment_criticality_snapshot ?? 'Normal'}</Badge></td><td className="px-3 py-3"><Badge tone={item.status === 'Verified' ? 'green' : item.status === 'Failed' ? 'red' : 'amber'}>{item.status}</Badge></td><td className="px-3 py-3 text-slate-300">{item.installation_status}</td><td className="px-3 py-3"><div className="flex gap-2"><Badge tone={item.tag_verified ? 'green' : 'amber'}>Tag {item.tag_verified ? 'OK' : 'Pending'}</Badge><Badge tone={item.qr_verified ? 'green' : 'slate'}>QR {item.qr_verified ? 'OK' : 'Open'}</Badge></div></td><td className="px-3 py-3"><Badge tone={item.photo_required && item.evidence_status !== 'Uploaded' ? 'red' : item.evidence_status === 'Uploaded' ? 'green' : 'amber'}>{item.evidence_status}</Badge></td><td className="px-3 py-3 text-slate-300">{item.verified_by ?? '-'}<p className="text-xs text-slate-500">{item.verified_at ? new Date(item.verified_at).toLocaleString() : ''}</p></td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Link href={`/equipment/${item.equipment_id}`} className="rounded-md border border-white/10 p-2 text-slate-200"><ExternalLink size={14} /></Link><button onClick={() => onVerify(item)} className="rounded-md border border-emerald-300/20 bg-emerald-500/10 p-2 text-emerald-100"><CheckCircle2 size={14} /></button><button onClick={() => onFail(item)} className="rounded-md border border-red-300/20 bg-red-500/10 p-2 text-red-100"><XCircle size={14} /></button><button onClick={() => onPhoto(item)} className="rounded-md border border-blue-300/20 bg-blue-500/10 p-2 text-blue-100"><Camera size={14} /></button><button onClick={() => onScan(item)} className="rounded-md border border-purple-300/20 bg-purple-500/10 p-2 text-purple-100"><QrCode size={14} /></button></div></td></tr>)}</tbody>
        </table>
      </div>
    </PSSRCard>
  );
}
