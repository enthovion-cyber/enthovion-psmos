import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { LopaRegisterResponse } from '../../types/lopa.types';
import { LopaSilBadge, LopaSourceBadge, LopaStatusBadge } from '../shared/LopaBadges';

export function LopaRegisterTable({ data, isLoading, isError }: { data?: LopaRegisterResponse | undefined; isLoading?: boolean | undefined; isError?: boolean | undefined }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#071525] shadow-xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
        <h2 className="text-sm font-bold text-white">LOPA Register <span className="text-xs text-blue-300">{data?.total ?? 0}</span></h2>
        <Link href="/lopa" className="text-xs font-semibold text-blue-300">View all</Link>
      </div>
      {isLoading ? <State text="Loading LOPA register from API..." /> : null}
      {isError ? <State text="Unable to load LOPA register." tone="error" /> : null}
      {!isLoading && !isError && !data?.rows?.length ? <State text="No LOPA studies match the current filters." /> : null}
      {!!data?.rows?.length && (
        <div className="overflow-auto">
          <table className="min-w-[1500px] w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#071525] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['LOPA No.', 'Study Title', 'Source', 'Site / Unit / Area', 'Status', 'Consequence', 'IE Freq.', 'IPL', 'Calc.', 'SIL', 'Actions', 'Due Date', 'Revalidation', 'Last Updated', ''].map((header) => <th key={header} className="px-3 py-3 font-semibold">{header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-300/10">
              {data.rows.map((study) => (
                <tr key={study.id} className="hover:bg-blue-500/5">
                  <td className="px-3 py-3"><Link className="font-semibold text-blue-300" href={`/lopa/${study.id}`}>{study.lopaNumber}</Link></td>
                  <td className="max-w-[260px] px-3 py-3 text-slate-100">{study.title}<div className="text-xs text-slate-500">{study.studyType}</div></td>
                  <td className="px-3 py-3"><LopaSourceBadge value={study.source} /></td>
                  <td className="px-3 py-3 text-slate-300">{[study.siteId, study.unitId, study.areaId].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-3 py-3"><LopaStatusBadge value={study.status} /></td>
                  <td className="px-3 py-3 text-slate-300">{study.consequenceSeverity ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-300">{study.initiatingEventFrequency ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-300">{study.creditedIplCount}/{study.iplCount}</td>
                  <td className="px-3 py-3 text-slate-300">{study.calculationStatus}</td>
                  <td className="px-3 py-3"><LopaSilBadge required={study.silRequired} target={study.targetSil} gap={study.silGapStatus} /></td>
                  <td className="px-3 py-3 text-slate-300">{study.openActions}</td>
                  <td className="px-3 py-3 text-slate-300">{study.dueDate ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-300">{study.revalidationDueDate ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-500">{study.updatedAt ? new Date(study.updatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-3"><button className="rounded-md border border-cyan-300/10 p-1 text-slate-400 hover:text-white"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <div className={`p-6 text-sm ${tone === 'error' ? 'text-red-200' : 'text-slate-400'}`}>{text}</div>;
}
