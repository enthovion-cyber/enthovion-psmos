'use client';

import { useState } from 'react';
import { AddEditLessonDrawer } from '../lessons-learned/AddEditLessonDrawer';
import { ApplicabilityReplicationPanel } from '../lessons-learned/ApplicabilityReplicationPanel';
import { CommunicationDistributionPanel } from '../lessons-learned/CommunicationDistributionPanel';
import { LessonAcknowledgementPanel } from '../lessons-learned/LessonAcknowledgementPanel';
import { LessonEffectivenessVerificationPanel } from '../lessons-learned/LessonEffectivenessVerificationPanel';
import { LessonSourceMappingPanel } from '../lessons-learned/LessonSourceMappingPanel';
import { LessonsChangeHistoryPanel } from '../lessons-learned/LessonsChangeHistoryPanel';
import { LessonsLearnedHeader } from '../lessons-learned/LessonsLearnedHeader';
import { LessonsReadinessPanel } from '../lessons-learned/LessonsReadinessPanel';
import { LessonsRegister } from '../lessons-learned/LessonsRegister';
import { LessonsReviewPanel } from '../lessons-learned/LessonsReviewPanel';
import { LessonsSourceReadinessPanel } from '../lessons-learned/LessonsSourceReadinessPanel';
import { LessonsSummaryCards } from '../lessons-learned/LessonsSummaryCards';
import { TrainingProcedureDocumentUpdatePanel } from '../lessons-learned/TrainingProcedureDocumentUpdatePanel';
import { TabStatePanel, errorText, toLocalInput } from '../shared/IncidentTabPrimitives';
import { useIncidentLessons, useIncidentLessonsMutations } from '../../hooks/useIncidentLessons';

export function LessonsLearnedTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentLessons(incidentId);
  const mutations = useIncidentLessonsMutations(incidentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);
  if (isLoading) return <TabStatePanel title="Loading Lessons Learned" message="Loading lessons, source mapping, distribution, acknowledgements, verification, review, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Lessons Learned" message={error instanceof Error ? error.message : 'The Lessons API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Lessons Learned data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted lessons" message={data.lockedReason ?? 'Lessons Learned is redacted for your permissions.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const add = () => { setForm({ lessonType: 'Process safety lesson', sourceType: 'RCA root cause', applicabilityScope: 'Site / unit', reviewStatus: 'Draft', communicationRequired: true }); setDrawerOpen(true); };
  const edit = (row: any) => { setForm({ id: row.id, title: row.title, lessonStatement: row.lesson_statement, lessonType: row.lesson_type, sourceType: row.source_type, applicabilityScope: row.applicability_scope, targetAudienceText: JSON.stringify(row.target_audience_json ?? []), trainingRequired: row.training_required, procedureUpdateRequired: row.procedure_update_required, communicationRequired: row.communication_required, ownerId: row.owner_id, dueDate: row.due_date?.slice(0, 10), reviewStatus: row.review_status, notes: row.notes }); setDrawerOpen(true); };
  const payload = () => ({ ...form, targetAudience: parseJson(form.targetAudienceText, []) });
  const run = async (fn: () => Promise<any>, success: string) => { try { await fn(); setMessage(success); } catch (event) { setMessage(errorText(event)); } };
  const save = () => run(async () => { if (form.id) await mutations.update.mutateAsync({ lessonId: form.id, values: payload() }); else await mutations.create.mutateAsync(payload()); setDrawerOpen(false); }, 'Lesson saved.');
  const generate = () => run(() => mutations.generate.mutateAsync({ reason: 'Generated from Lessons Learned tab' }), 'Lessons generated from RCA/CAPA sources.');
  const distribute = (row?: any) => { const lesson = row ?? data.lessonsRegister?.[0]; if (!lesson) return setMessage('No lesson selected for distribution.'); return run(() => mutations.distribute.mutateAsync({ lessonId: lesson.id, values: { channel: 'Notification Center', message: 'Please review and acknowledge this lesson learned.', acknowledgementRequired: true } }), 'Lesson distributed.'); };
  const verify = (row: any) => run(() => mutations.verify.mutateAsync({ lessonId: row.id, values: { effective: window.confirm('Was this lesson communication effective?'), notes: 'Verified from Lessons Learned tab' } }), 'Lesson verification saved.');
  const archive = (row: any) => { const reason = window.prompt('Archive/supersede reason'); if (!reason) return; run(() => mutations.remove.mutateAsync({ lessonId: row.id, values: { reason } }), 'Lesson archived/superseded.'); };
  const linkSource = (row: any) => { const sourceType = window.prompt('Source type'); if (!sourceType) return; run(() => mutations.linkSource.mutateAsync({ lessonId: row.id, values: { sourceType, sourceId: window.prompt('Source record ID') ?? undefined, sourceTitleSnapshot: window.prompt('Source title/summary') ?? undefined, coverageStatus: 'Linked' } }), 'Lesson source linked.'); };
  const requestReview = () => run(() => mutations.requestReview.mutateAsync({ reason: 'Lessons review requested' }), 'Lessons review requested.');
  const approveReview = () => run(() => mutations.approveReview.mutateAsync({ reason: 'Lessons approved' }), 'Lessons review approved.');
  const rejectReview = () => { const reason = window.prompt('Rejection reason'); if (!reason) return; run(() => mutations.rejectReview.mutateAsync({ reason }), 'Lessons review rejected.'); };
  const createAction = () => setMessage('Use the Universal Action Engine linked action flow; backend readiness already detects missing training/procedure actions.');

  return <div className="grid gap-4">
    <LessonsLearnedHeader data={data} saving={saving} message={message} onAdd={add} onGenerate={generate} onDistribute={() => distribute()} onTrainingAction={createAction} onProcedureAction={createAction} onRequestReview={requestReview} onRefresh={() => refetch()} />
    <LessonsSummaryCards cards={data.summaryCards ?? []} />
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><LessonsRegister rows={data.lessonsRegister ?? []} onView={edit} onEdit={edit} onLinkSource={linkSource} onCreateAction={createAction} onDistribute={distribute} onVerify={verify} onArchive={archive} /><LessonsReadinessPanel readiness={data.readiness} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><LessonsSourceReadinessPanel items={data.sourceReadiness ?? []} /><LessonSourceMappingPanel data={data.sourceMapping} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><ApplicabilityReplicationPanel data={data.applicability} /><CommunicationDistributionPanel data={data.communicationDistribution} /><TrainingProcedureDocumentUpdatePanel data={data.trainingProcedureDocumentUpdate} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><LessonAcknowledgementPanel rows={data.acknowledgements ?? []} /><LessonEffectivenessVerificationPanel data={data.effectivenessVerification} /><LessonsReviewPanel review={data.review} onApprove={approveReview} onReject={rejectReview} onReopen={requestReview} onCreateAction={createAction} /></div>
    <LessonsChangeHistoryPanel rows={data.changeHistory ?? []} />
    <AddEditLessonDrawer open={drawerOpen} form={form} set={set} saving={saving} onClose={() => setDrawerOpen(false)} onSave={save} />
  </div>;
}

function parseJson(value: any, fallback: any) { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
