'use client';

import { useState } from 'react';
import { pssrTrainingService } from '../services/pssr-training.service';
import { TrainingButton, TrainingCard, TrainingErrorState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';

export function PssrTrainingImportPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<unknown>(null);
  async function run() {
    setError(null);
    try {
      const rows = text.trim() ? JSON.parse(text) : [];
      setResult(await pssrTrainingService.importRows({ rows }));
    } catch (err) {
      setError(err);
    }
  }
  return <div className="space-y-6"><TrainingPssrHeader title="Import PSSR Training Readiness" /><TrainingCard title="Import JSON Rows" subtitle="Import is processed by backend validation and audit/history rules."><textarea className="min-h-64 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-xs" placeholder='[{"pssr_number_or_id":"PSSR-2026-0001","readiness_title":"Operator training"}]' value={text} onChange={(event) => setText(event.target.value)} />{error ? <TrainingErrorState message={error} /> : null}{result ? <pre className="mt-3 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(result, null, 2)}</pre> : null}<div className="mt-3"><TrainingButton onClick={run}>Import Rows</TrainingButton></div></TrainingCard></div>;
}

