'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { ChemistryImpactSection } from '../impact/ChemistryImpactSection';
import { DocumentPSIImpactSection } from '../impact/DocumentPSIImpactSection';
import { EnvironmentalRegulatoryImpactSection } from '../impact/EnvironmentalRegulatoryImpactSection';
import { EquipmentImpactSection } from '../impact/EquipmentImpactSection';
import { GeneratedActionsPreview } from '../impact/GeneratedActionsPreview';
import { ImpactAssessmentSummaryCard } from '../impact/ImpactAssessmentSummaryCard';
import { OperatingLimitsImpactSection } from '../impact/OperatingLimitsImpactSection';
import { ProcedureImpactSection } from '../impact/ProcedureImpactSection';
import { QualityProductionImpactSection } from '../impact/QualityProductionImpactSection';
import { SafetySystemsImpactSection } from '../impact/SafetySystemsImpactSection';
import { TrainingImpactSection } from '../impact/TrainingImpactSection';
import { useMOCImpactAssessment, useMOCImpactBlockers, useMOCImpactGeneratedActions } from '../../hooks/useMOCImpactAssessment';
import { useMOCImpactMutations } from '../../hooks/useMOCImpactMutations';
import { mocImpactSchema, type MOCImpactValues } from '../../schemas/moc-impact.schema';

export function MOCImpactAssessmentTab({ moc }: { moc: any }) {
  const assessment = useMOCImpactAssessment(moc.id);
  const generated = useMOCImpactGeneratedActions(moc.id);
  const blockers = useMOCImpactBlockers(moc.id);
  const mutations = useMOCImpactMutations(moc.id);
  const locked = ['Closed', 'Cancelled', 'Approved'].includes(moc.status);

  const form = useForm<MOCImpactValues>({
    resolver: zodResolver(mocImpactSchema),
    defaultValues: { answers: {}, justifications: {}, metadata: {} }
  });

  useEffect(() => {
    if (!assessment.data?.answers) return;
    form.reset({
      answers: Object.fromEntries(assessment.data.answers.map((row: any) => [row.question_key, row.answer_value])),
      justifications: Object.fromEntries(assessment.data.answers.map((row: any) => [row.question_key, row.justification ?? ''])),
      metadata: Object.fromEntries(assessment.data.answers.map((row: any) => [row.question_key, row.metadata ?? {}]))
    });
  }, [assessment.data, form]);

  const sectionMissing = useMemo(() => {
    const missing = assessment.data?.summary?.missingRequiredAnswers ?? [];
    return missing.length ? `${missing.length} required answers missing: ${missing.join(', ')}` : null;
  }, [assessment.data]);

  const onSave = form.handleSubmit((values) => mutations.save.mutate(values));

  if (assessment.isLoading) return <LoadingState />;
  if (assessment.isError) return <ErrorState message="Unable to load impact assessment from API." />;

  return (
    <form onSubmit={onSave} className="space-y-4">
      <ImpactAssessmentSummaryCard data={assessment.data} isDirty={form.formState.isDirty} locked={locked} />
      {locked ? <div className="rounded-lg border border-amber-300/20 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100">This MOC status is {moc.status}. Return it for revision before editing impact assessment answers.</div> : null}
      {sectionMissing ? <div className="rounded-lg border border-red-300/20 bg-red-500/10 p-3 text-sm font-semibold text-red-100">{sectionMissing}</div> : null}
      {mutations.save.isError ? <ErrorState message={(mutations.save.error as Error).message || 'Impact assessment save failed.'} /> : null}

      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-cyan-300/10 bg-[#061426]/95 p-3 shadow-xl shadow-black/20 backdrop-blur">
        <button type="button" onClick={() => form.reset()} disabled={!form.formState.isDirty || mutations.save.isPending} className="rounded-md border border-white/10 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-50">Cancel Changes</button>
        <button type="submit" disabled={locked || mutations.save.isPending} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{mutations.save.isPending ? 'Saving...' : 'Save / Regenerate Preview'}</button>
        <button type="button" onClick={() => mutations.complete.mutate()} disabled={locked || mutations.complete.isPending} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{mutations.complete.isPending ? 'Completing...' : 'Complete Assessment'}</button>
      </div>

      <EquipmentImpactSection form={form} locked={locked} />
      <ChemistryImpactSection form={form} locked={locked} />
      <ProcedureImpactSection form={form} locked={locked} />
      <OperatingLimitsImpactSection form={form} locked={locked} />
      <SafetySystemsImpactSection form={form} locked={locked} />
      <TrainingImpactSection form={form} locked={locked} />
      <DocumentPSIImpactSection form={form} locked={locked} />
      <EnvironmentalRegulatoryImpactSection form={form} locked={locked} />
      <QualityProductionImpactSection form={form} locked={locked} />

      <GeneratedActionsPreview
        actions={generated.data ?? assessment.data?.generatedActions ?? []}
        blockers={{ startup: blockers.startup.data ?? assessment.data?.startupBlockers ?? [], closure: blockers.closure.data ?? assessment.data?.closureBlockers ?? [] }}
        onRegenerate={() => mutations.regenerate.mutate()}
        onApply={() => mutations.apply.mutate()}
        regenerating={mutations.regenerate.isPending}
        applying={mutations.apply.isPending}
        locked={locked}
      />
    </form>
  );
}
