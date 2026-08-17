'use client';

import { useMocTrainingRequirementDetail } from '../hooks/useMocTrainingRequirementDetail';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { TrainingMocRequirementForm } from './TrainingMocRequirementForm';

export function TrainingMocRequirementFormPage({ requirementId }: { requirementId?: string }) {
  const query = useMocTrainingRequirementDetail(requirementId ?? '');
  if (requirementId && query.isLoading) return <TrainingLoadingState rows={4} />;
  if (requirementId && query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const formProps = requirementId ? { requirementId, initialValues: query.data?.requirement ?? {} } : { initialValues: { requirementSource: 'MOC Impact Assessment', impactLevel: 'Medium', trainingRequired: true } };
  return <div className="space-y-6"><TrainingMocHeader title={requirementId ? 'Edit MOC Training Requirement' : 'Create MOC Training Requirement'} /><TrainingMocRequirementForm {...formProps} /></div>;
}
