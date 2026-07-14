import { Globe2, ShieldCheck } from 'lucide-react';
import type { CompanyDomain } from '@/services/foundation.service';
import { WorkspaceStatusBadge } from '../shared/WorkspaceStatusBadge';

export function CompanyDomainPanel({ domains, domain, onDomainChange, onAdd, onVerify, loading }: { domains: CompanyDomain[]; domain: string; onDomainChange: (value: string) => void; onAdd: () => void; onVerify: (id: string) => void; loading?: boolean }) {
  return (
    <section className="psm-card p-5">
      <div className="flex items-center gap-2"><Globe2 size={18} className="text-info" /><h2 className="text-lg font-semibold">Company Domains</h2></div>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Prepared for future Google login, auto-join, and invitation policies.</p>
      <div className="mt-4 flex gap-2">
        <input className="psm-input h-10 flex-1 px-3" value={domain} placeholder="example.com" onChange={(event) => onDomainChange(event.target.value)} />
        <button className="psm-button psm-button-secondary" onClick={onAdd} disabled={loading} title={loading ? 'Saving domain' : 'Add company domain'}>Add</button>
      </div>
      <div className="mt-4 space-y-3">
        {domains.map((item) => (
          <div key={item.id} className="rounded-xl border border-[var(--psm-line)] p-3">
            <div className="flex items-center justify-between gap-3"><div className="font-semibold">{item.domain}</div><WorkspaceStatusBadge status={item.verificationStatus} /></div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]"><span>{item.verificationMethod}</span><span>Google login: {item.allowGoogleLogin ? 'Allowed' : 'Off'}</span><span>Auto join: {item.allowAutoJoin ? 'Allowed' : 'Off'}</span></div>
            {item.verificationStatus !== 'VERIFIED' ? <button className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-info" onClick={() => onVerify(item.id)}><ShieldCheck size={14} /> Mark Verified</button> : null}
          </div>
        ))}
        {!domains.length ? <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">No domains recorded yet.</div> : null}
      </div>
    </section>
  );
}
