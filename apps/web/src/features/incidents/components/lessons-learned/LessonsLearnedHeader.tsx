import { AcknowledgementStatusBadge } from '../shared/AcknowledgementStatusBadge';
import { Badge } from '../shared/IncidentStatusBadge';
import { buttonPrimary, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { LessonStatusBadge } from '../shared/LessonStatusBadge';

export function LessonsLearnedHeader({ data, saving, message, onAdd, onGenerate, onDistribute, onTrainingAction, onProcedureAction, onRequestReview, onRefresh }: any) {
  const header = data?.header ?? {};
  const action = (key: string) => (header.actions ?? []).find((item: any) => item.key === key) ?? { enabled: false, disabledReason: 'Action unavailable.' };
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">Lessons Learned</h2>
            <Badge value={header.lessonsRequired ? 'Lessons Required' : 'Lessons Not Required'} />
            <LessonStatusBadge value={header.reviewStatus} />
            <AcknowledgementStatusBadge value={header.acknowledgementStatus} />
            <Badge value={header.verificationStatus} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{header.incidentNumber} · {header.title}</p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <Fact label="Status" value={header.status} />
            <Fact label="Actual severity" value={header.actualSeverity} />
            <Fact label="Potential severity" value={header.potentialSeverity} />
            <Fact label="PSM/PSE/API" value={header.psmPseApiTier} />
            <Fact label="Total lessons" value={header.totalLessons} />
            <Fact label="Approved" value={header.approvedLessons} />
            <Fact label="Pending review" value={header.lessonsPendingReview} />
            <Fact label="Last updated" value={formatDate(header.lastUpdated)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button className={buttonPrimary} title={action('add-lesson').disabledReason} disabled={saving || !action('add-lesson').enabled} onClick={onAdd}>Add Lesson</button>
          <button className={buttonSecondary} title={action('generate').disabledReason} disabled={saving || !action('generate').enabled} onClick={onGenerate}>Generate from RCA/CAPA</button>
          <button className={buttonSecondary} title={action('distribute').disabledReason} disabled={saving || !action('distribute').enabled} onClick={onDistribute}>Share / Distribute</button>
          <button className={buttonSecondary} title={action('training-action').disabledReason} disabled={saving || !action('training-action').enabled} onClick={onTrainingAction}>Training Action</button>
          <button className={buttonSecondary} title={action('procedure-action').disabledReason} disabled={saving || !action('procedure-action').enabled} onClick={onProcedureAction}>Procedure Action</button>
          <button className={buttonSecondary} title={action('request-review').disabledReason} disabled={saving || !action('request-review').enabled} onClick={onRequestReview}>Request Review</button>
          <button className={buttonSecondary} disabled={saving} onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: any }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="font-semibold">{value ?? '-'}</div></div>;
}
