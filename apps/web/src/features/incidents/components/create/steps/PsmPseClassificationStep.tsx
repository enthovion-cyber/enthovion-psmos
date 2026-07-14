'use client';
import { Card } from '../FormBits';
import { PsmPseClassificationPanel } from '../PsmPseClassificationPanel';
export function PsmPseClassificationStep({ values, update, context, classification }: any) {
  return <Card title="8. PSM / Process Safety / API RP 754 Classification"><PsmPseClassificationPanel values={values} update={update} context={context} result={classification} /><div className="mt-3 rounded-lg border border-slate-200 p-3 text-xs text-slate-600 dark:border-cyan-300/10 dark:text-slate-300"><b>Helper:</b> Occupational safety covers slips/trips/falls, ergonomics, manual handling, office injuries, and PPE issues. Process safety covers chemical release, fire, explosion, LOPC, process upset, safeguard/IPL failure, SIS/PSV failure, or operating envelope exceedance.</div></Card>;
}
