'use client';

import { useState } from 'react';
import { useAssessmentMutations } from '../hooks/useAssessmentMutations';
import { TrainingButton, TrainingCard, TrainingEmptyState, formatTrainingError } from '../shared/TrainingUi';
import type { AssessmentQuestion } from '../types/assessment.types';

export function AssessmentQuestionBuilder({ assessmentId, questions }: { assessmentId: string; questions: AssessmentQuestion[] }) {
  const mutations = useAssessmentMutations(assessmentId);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = async () => { setError(null); try { await mutations.addQuestion.mutateAsync({ questionText: text, questionType: 'Multiple Choice - Single Answer', questionOrder: questions.length + 1, points: 1 }); setText(''); } catch (err) { setError(formatTrainingError(err)); } };
  return <TrainingCard title="Question Builder" subtitle="Questions are stored in the assessment library and graded by backend rules.">{questions.length ? <div className="space-y-2">{questions.map((question) => <div key={question.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm"><b>{question.question_order}. {question.question_text}</b><p className="text-xs text-[var(--psm-muted)]">{question.question_type} - {question.points} pts</p></div>)}</div> : <TrainingEmptyState title="No questions" message="Add questions before activating or assigning this assessment." />}<div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Question text" value={text} onChange={(event) => setText(event.target.value)} /><TrainingButton onClick={add} disabled={!text || mutations.addQuestion.isPending} title={!text ? 'Question text is required.' : undefined}>Add Question</TrainingButton></div>{error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}</TrainingCard>;
}
