import Link from 'next/link';
import { CompatibilityRiskBadge } from '../shared/CompatibilityRiskBadge';
import { GhsSignalWordBadge } from '../shared/GhsSignalWordBadge';
import { HighHazardBadge } from '../shared/HighHazardBadge';
import { NfpaDiamondMini } from '../shared/NfpaDiamondMini';
import { SdsStatusBadge } from '../shared/SdsStatusBadge';
import type { PsiChemical } from '../types/psi-chemical.types';

export function PsiChemicalTable({ rows }: { rows: PsiChemical[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Chemical Name', 'CAS', 'Formula', 'Unit / Area', 'Process Use', 'Max Intended Inventory', 'SDS Status', 'GHS Hazards', 'Signal Word', 'NFPA/HMIS', 'Exposure Limit', 'Storage Compatibility', 'Emergency Response', 'Review Status', 'Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hazards = row.hazards ?? {};
            return (
              <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
                <td className="px-3 py-3 font-semibold"><Link className="text-primary hover:underline" href={`/process-safety-information/chemicals/${row.id}`}>{row.chemical_name}</Link><div className="mt-1"><HighHazardBadge value={row.high_hazard} /></div></td>
                <td className="px-3 py-3">{row.cas_number ?? '-'}</td>
                <td className="px-3 py-3">{row.formula ?? '-'}</td>
                <td className="px-3 py-3">{row.unit_code ?? row.unit_id}<br /><span className="text-xs text-[var(--psm-muted)]">{row.area_id ?? '-'}</span></td>
                <td className="px-3 py-3">{row.process_use ?? '-'}</td>
                <td className="px-3 py-3">{row.max_intended_inventory ?? '-'} {row.inventory_unit ?? ''}</td>
                <td className="px-3 py-3"><SdsStatusBadge status={row.sds_status} /></td>
                <td className="px-3 py-3">{Array.isArray(hazards.ghs_hazard_classes_json) ? hazards.ghs_hazard_classes_json.join(', ') : hazards.hazard_summary ?? '-'}</td>
                <td className="px-3 py-3"><GhsSignalWordBadge value={hazards.signal_word} /></td>
                <td className="px-3 py-3"><NfpaDiamondMini health={hazards.nfpa_health} fire={hazards.nfpa_fire} reactivity={hazards.nfpa_reactivity} special={hazards.nfpa_special} /></td>
                <td className="px-3 py-3">{row.exposure_limit_status ?? 'Not Reviewed'}</td>
                <td className="px-3 py-3"><CompatibilityRiskBadge risk={row.compatibility_risk_level} /></td>
                <td className="px-3 py-3">{row.emergency_response_status ?? 'Not Reviewed'}</td>
                <td className="px-3 py-3">{row.review_status ?? 'Not Reviewed'}</td>
                <td className="px-3 py-3"><div className="flex flex-col gap-1"><Link className="text-primary hover:underline" href={`/process-safety-information/chemicals/${row.id}`}>View</Link><Link className="text-primary hover:underline" href={`/process-safety-information/chemicals/${row.id}/edit`}>Edit</Link></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
