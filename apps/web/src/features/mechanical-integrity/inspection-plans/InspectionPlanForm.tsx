'use client';

import { useMemo, useState } from 'react';
import type { InspectionPlanFormState } from '../types/inspection-plan.types';
import { PlanAcceptanceCriteriaSection } from './sections/PlanAcceptanceCriteriaSection';
import { PlanChecklistSection } from './sections/PlanChecklistSection';
import { PlanCmlScopeSection } from './sections/PlanCmlScopeSection';
import { PlanDocumentsSection } from './sections/PlanDocumentsSection';
import { PlanEquipmentScopeSection } from './sections/PlanEquipmentScopeSection';
import { PlanIdentificationSection } from './sections/PlanIdentificationSection';
import { PlanInspectionScopeSection } from './sections/PlanInspectionScopeSection';
import { PlanMethodProcedureSection } from './sections/PlanMethodProcedureSection';
import { PlanResponsiblePeopleSection } from './sections/PlanResponsiblePeopleSection';
import { PlanReviewSubmitSection } from './sections/PlanReviewSubmitSection';
import { PlanSchedulerPreviewSection } from './sections/PlanSchedulerPreviewSection';
import { PlanSchedulingRuleSection } from './sections/PlanSchedulingRuleSection';

const initialState: InspectionPlanFormState = {
  planTitle: '',
  planType: '',
  inspectionMethod: '',
  priority: 'Normal',
  scope: {},
  cmlScope: {},
  schedule: { schedulingMode: 'Fixed calendar interval', frequencyUnit: 'Months' },
  checklistItems: [],
  acceptanceCriteria: [],
  documents: []
};

export function InspectionPlanForm({ initial, saving, onSubmit, evaluation }: { initial?: Partial<InspectionPlanFormState>; saving?: boolean; onSubmit: (value: InspectionPlanFormState) => void; evaluation?: Record<string, unknown> | null }) {
  const [value, setValue] = useState<InspectionPlanFormState>({ ...initialState, ...initial });
  const disabledReason = useMemo(() => {
    if (!value.planTitle.trim()) return 'Plan title is required.';
    if (!value.equipmentId) return 'Equipment is required.';
    if (!value.planType) return 'Plan type is required.';
    if (!value.inspectionMethod) return 'Inspection method is required.';
    if (/Fixed/i.test(String(value.schedule.schedulingMode ?? '')) && (!value.schedule.frequencyValue || !value.schedule.frequencyUnit)) return 'Fixed interval requires frequency value and unit.';
    return null;
  }, [value]);
  const update = (patch: Partial<InspectionPlanFormState>) => setValue((current) => ({ ...current, ...patch }));
  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (!disabledReason) onSubmit(value); }}>
      <PlanIdentificationSection value={value} onChange={update} />
      <PlanEquipmentScopeSection value={value} onChange={update} />
      <PlanInspectionScopeSection value={value} onChange={update} />
      <PlanCmlScopeSection value={value} onChange={update} />
      <PlanMethodProcedureSection value={value} onChange={update} />
      <PlanChecklistSection value={value} onChange={update} />
      <PlanAcceptanceCriteriaSection value={value} onChange={update} />
      <PlanSchedulingRuleSection value={value} onChange={update} />
      <PlanSchedulerPreviewSection evaluation={evaluation as any} />
      <PlanResponsiblePeopleSection value={value} onChange={update} />
      <PlanDocumentsSection value={value} onChange={update} />
      <PlanReviewSubmitSection value={value} disabledReason={disabledReason} />
      <div className="sticky bottom-3 flex flex-wrap justify-end gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-lg">
        <button type="submit" disabled={saving || !!disabledReason} title={disabledReason ?? undefined} className="rounded-lg bg-info px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving...' : 'Save Draft'}</button>
      </div>
    </form>
  );
}
