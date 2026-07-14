import type { LopaIplCandidate } from '../../types/lopa-ipls-safeguards.types';
import { LibraryDrawer } from '../libraries/LibraryShared';
import { FieldGrid, ProgressBar } from '../overview/LopaOverviewShared';
import { EmptyState, IplBadge } from './LopaIplBadges';

export function IplValidationDrawer({ candidate, open, onClose }: { candidate: LopaIplCandidate | null; open: boolean; onClose: () => void }) {
  if (!candidate) return null;
  const criteria = candidate.validationCriteria ?? [];
  const passed = criteria.filter((item) => ['Pass', 'Passed', 'Not Applicable'].includes(item.status)).length;
  const pct = criteria.length ? Math.round((passed / criteria.length) * 100) : 0;
  return (
    <LibraryDrawer title="IPL Validation Detail" open={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-white">{candidate.iplName ?? candidate.ipl_name}</h3>
          <div className="mt-2 flex flex-wrap gap-2"><IplBadge value={candidate.validationStatus ?? candidate.validation_status} /><IplBadge value={candidate.creditStatus ?? candidate.credit_status} /></div>
        </div>
        <FieldGrid items={[
          ['IPL type', candidate.iplType ?? candidate.ipl_type],
          ['PFDavg', candidate.pfdavg ?? '-'],
          ['RRF', candidate.rrf ?? '-'],
          ['Source reference', candidate.sourceReference ?? candidate.source_reference ?? '-'],
          ['Proof-test basis', candidate.proofTestBasis ?? candidate.proof_test_basis ?? '-'],
          ['Evidence', candidate.evidenceStatus ?? candidate.evidence_status ?? '-']
        ]} />
        <div className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3">
          <div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold text-white">Validation progress</span><span className="font-black text-white">{pct}%</span></div>
          <ProgressBar value={pct} tone={pct === 100 ? 'success' : 'warning'} />
        </div>
        <section>
          <h4 className="mb-2 text-sm font-black text-white">Mandatory Criteria</h4>
          {!criteria.length ? <EmptyState text="Validation criteria will be generated when the candidate is created." /> : (
            <div className="space-y-2">
              {criteria.map((item) => (
                <div key={item.id ?? item.criterion_key} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="font-semibold text-slate-100">{item.criterion_name}</div><div className="text-xs text-slate-500">{item.criterion_category}{item.required_for_credit ? ' · Required for credit' : ''}</div></div>
                    <IplBadge value={item.status} />
                  </div>
                  {item.evidence_reference || item.notes ? <div className="mt-2 text-xs text-slate-400">{item.evidence_reference ?? item.notes}</div> : null}
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <h4 className="mb-2 text-sm font-black text-white">Credit Blockers</h4>
          {candidate.creditBlockers?.length ? candidate.creditBlockers.map((blocker) => <div key={blocker} className="mb-2 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{blocker}</div>) : <EmptyState text="No credit blockers detected by the backend." />}
        </section>
      </div>
    </LibraryDrawer>
  );
}
