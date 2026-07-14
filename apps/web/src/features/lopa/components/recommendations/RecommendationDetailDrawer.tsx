import { LibraryDrawer } from '../libraries/LibraryShared';
import { FieldGrid, TonePill } from '../overview/LopaOverviewShared';

export function RecommendationDetailDrawer({ row, open, onClose }: { row: any; open: boolean; onClose: () => void }) {
  return <LibraryDrawer title="Recommendation Detail" open={open} onClose={onClose}>{row ? <div className="space-y-4"><FieldGrid items={[['Number', row.recommendation_number], ['Status', <TonePill key="s">{row.status}</TonePill>], ['Title', row.title], ['Type', row.recommendation_type], ['Priority', row.priority], ['Risk relevance', row.risk_relevance], ['Source', `${row.source_type ?? '-'} / ${row.source_tab ?? '-'}`], ['Due date', row.due_date ?? '-']]} /><div className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3"><div className="font-bold text-white">Description</div><p className="mt-2 text-sm text-slate-400">{row.description}</p></div><div className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3"><div className="font-bold text-white">Linked Actions</div><p className="mt-2 text-sm text-slate-400">{row.linkedActionsCount ?? 0} linked, {row.openActionsCount ?? 0} open.</p></div></div> : null}</LibraryDrawer>;
}
