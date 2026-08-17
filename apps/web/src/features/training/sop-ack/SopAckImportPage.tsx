'use client';

import { useState } from 'react';
import { sopAckService } from '../services/sop-acknowledgement.service';
import { TrainingButton, TrainingCard, TrainingErrorState } from '../shared/TrainingUi';
import { SopAckHeader } from './SopAckHeader';

export function SopAckImportPage() {
  const [rows, setRows] = useState('[{}]');
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  return <div className="space-y-5"><SopAckHeader title="Import SOP Acknowledgement Requirements" subtitle="Bulk import backend-validated requirement rules. Import creates audit/history and does not bypass controlled SOP version rules." actions={false} /><TrainingCard title="Import rows JSON"><textarea value={rows} onChange={(event) => setRows(event.target.value)} className="min-h-60 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-xs" /><div className="mt-3 flex flex-wrap gap-2"><TrainingButton onClick={async () => { try { setError(null); setResult(await sopAckService.importRows({ rows: JSON.parse(rows) })); } catch (err) { setError(err); } }}>Import</TrainingButton><TrainingButton variant="secondary" onClick={async () => setResult(await sopAckService.importTemplate())}>Load Template</TrainingButton><TrainingButton variant="secondary" onClick={async () => setResult(await sopAckService.exportRows())}>Export Index</TrainingButton></div>{error ? <div className="mt-3"><TrainingErrorState message={error} /></div> : null}{result ? <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(result, null, 2)}</pre> : null}</TrainingCard></div>;
}
