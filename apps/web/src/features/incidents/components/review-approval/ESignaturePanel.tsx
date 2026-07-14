import { ESignatureStatusBadge } from '../shared/ESignatureStatusBadge';
import { formatDate, TabPanel } from '../shared/IncidentTabPrimitives';

export function ESignaturePanel({ signatures }: { signatures: any[] }) {
  return (
    <TabPanel title="Universal E-Signature">
      <div className="grid gap-2">
        {(signatures ?? []).length ? signatures.map((signature) => (
          <div key={signature.id} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10">
            <div className="flex items-start justify-between gap-3"><b>{signature.signer_name ?? signature.signer_user_id}</b><ESignatureStatusBadge value={signature.status ?? 'Signed'} required /></div>
            <div className="mt-1 text-slate-500">Meaning: {signature.signature_meaning ?? signature.meaning ?? '-'} · Step: {signature.workflow_step ?? '-'}</div>
            <div className="mt-1 text-slate-500">Authentication: {signature.authentication_method ?? signature.authentication_status ?? '-'} · Certificate: {signature.certificate_reference ?? signature.id}</div>
            <div className="mt-2 text-slate-400">Signed at {formatDate(signature.signed_at ?? signature.created_at)}</div>
          </div>
        )) : <p className="text-xs text-slate-500">No e-signature records have been returned from Universal E-Signature.</p>}
      </div>
    </TabPanel>
  );
}
