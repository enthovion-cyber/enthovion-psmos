import Link from 'next/link';
import { PsiButton } from '../shared/PsiUi';
import { HighHazardBadge } from '../shared/HighHazardBadge';
import { SdsStatusBadge } from '../shared/SdsStatusBadge';
import type { PsiChemicalDetail } from '../types/psi-chemical.types';

export function PsiChemicalDetailHeader({ detail, onRunSds, onRunCompatibility, busy }: { detail: PsiChemicalDetail; onRunSds: () => void; onRunCompatibility: () => void; busy?: boolean | undefined }) {
  const chemical = detail.chemical;
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Chemicals & SDS</p>
          <h1 className="text-2xl font-bold">{chemical.chemical_name}</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{chemical.cas_number ?? 'CAS missing'} | {chemical.formula ?? 'Formula missing'} | Unit {detail.unit.unit_code ?? chemical.unit_id}</p>
          <div className="mt-3 flex flex-wrap gap-2"><SdsStatusBadge status={chemical.sds_status} /><HighHazardBadge value={chemical.high_hazard} /><span className="rounded-full border border-[var(--psm-line)] px-2.5 py-1 text-xs font-semibold">{chemical.review_status ?? 'Not Reviewed'}</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={`/process-safety-information/chemicals/${chemical.id}/edit`}>Edit</PsiButton>
          <PsiButton variant="secondary" onClick={onRunSds} disabled={busy} title={busy ? 'Running SDS status check' : undefined}>Run SDS Check</PsiButton>
          <PsiButton variant="secondary" onClick={onRunCompatibility} disabled={busy} title={busy ? 'Running compatibility check' : undefined}>Check Compatibility</PsiButton>
        </div>
      </div>
      <nav className="mt-4 flex gap-2 overflow-x-auto border-t border-[var(--psm-line)] pt-4">
        {detail.tabs.map((tab) => <Link key={tab.label} href={tab.href} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold ${tab.enabled ? 'border-[var(--psm-line)] text-[var(--psm-fg)]' : 'border-[var(--psm-line)] text-[var(--psm-muted)] opacity-60'}`}>{tab.label}</Link>)}
      </nav>
    </div>
  );
}
