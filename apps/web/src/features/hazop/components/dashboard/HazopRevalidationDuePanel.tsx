import Link from 'next/link';

export function HazopRevalidationDuePanel({ studies }: { studies: any[] }) {
  return <ListPanel title="Revalidation Due" rows={studies} empty="No revalidation dates in the watch window." render={(study) => <StudyRow study={study} meta={study.revalidation_due_date ?? '-'} tone="text-cyan-200" />} />;
}

export function HazopOverdueStudiesPanel({ studies }: { studies: any[] }) {
  return <ListPanel title="Overdue Studies" rows={studies} empty="No overdue studies." render={(study) => <StudyRow study={study} meta={`${daysOverdue(study.target_completion_date)} days`} tone="text-red-200" />} />;
}

function ListPanel({ title, rows, empty, render }: { title: string; rows: any[]; empty: string; render: (row: any) => any }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><span className="text-xs text-blue-300">View all</span></div><div className="space-y-2">{rows.length ? rows.slice(0, 6).map((row) => <div key={row.id}>{render(row)}</div>) : <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">{empty}</div>}</div></section>;
}

function StudyRow({ study, meta, tone }: { study: any; meta: string; tone: string }) {
  return <Link href={`/hazop/${study.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] p-3 hover:bg-[var(--psm-surface-2)]"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{study.study_number}</span><span className="block truncate text-xs text-[var(--psm-muted)]">{study.title}</span></span><b className={`text-xs ${tone}`}>{meta}</b></Link>;
}

function daysOverdue(date?: string | null) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((Date.now() - new Date(date).getTime()) / 86400000));
}
