'use client';

import { useState } from 'react';
import { mocTrainingService } from '../services/moc-training.service';
import { TrainingButton, TrainingCard, TrainingErrorState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';

export function MocTrainingImportPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<unknown>(null);
  async function run() {
    setError(null);
    try {
      const rows = text.trim() ? JSON.parse(text) : [];
      setResult(await mocTrainingService.importRows({ rows }));
    } catch (err) {
      setError(err);
    }
  }
  return <div className="space-y-6"><TrainingMocHeader title="Import MOC Training Requirements" /><TrainingCard title="Import JSON Rows" subtitle="Import is processed by backend validation and audit/history rules."><textarea className="min-h-64 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-xs" placeholder='[{"moc_number_or_id":"MOC-2026-0001","requirement_title":"Operator training"}]' value={text} onChange={(event) => setText(event.target.value)} />{error ? <TrainingErrorState message={error} /> : null}{result ? <pre className="mt-3 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(result, null, 2)}</pre> : null}<div className="mt-3"><TrainingButton onClick={run}>Import Rows</TrainingButton></div></TrainingCard></div>;
}
