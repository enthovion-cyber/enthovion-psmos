import { Download, FileText } from 'lucide-react';
import { ptwService, type Permit } from '@/services/ptw.service';

export function PermitActionPanel({ permit, onCreateMoc, onSaveTemplate }: { permit: Permit; onCreateMoc: () => void; onSaveTemplate: () => void }) {
  return (
    <section className="psm-card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Permit Actions</h2>
      <div className="space-y-2">
        <a className="psm-button psm-button-secondary w-full justify-center" href={ptwService.certificateUrl(permit.id)}><Download size={16} /> Print Permit</a>
        <a className="psm-button psm-button-secondary w-full justify-center" href={ptwService.isolationCertificateUrl(permit.id)}><Download size={16} /> Isolation Certificate</a>
        <button onClick={onCreateMoc} className="psm-button psm-button-secondary w-full justify-center"><FileText size={16} /> Create MOC</button>
        <button onClick={onSaveTemplate} className="psm-button psm-button-secondary w-full justify-center"><FileText size={16} /> Save Template</button>
      </div>
    </section>
  );
}
