'use client';

import { useEffect, useState } from 'react';
import { equipmentDesignService } from '../services/equipment-design.service';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';

export function EquipmentDesignImportPage() {
  const [template, setTemplate] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState('[]');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    equipmentDesignService.importTemplate().then(setTemplate).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load import template.')).finally(() => setLoading(false));
  }, []);

  async function preview() {
    setError(null);
    setImporting(true);
    try {
      const parsed = JSON.parse(rows);
      setResult(await equipmentDesignService.importPreview({ rows: parsed, mode: 'preview' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to preview import rows.');
    } finally {
      setImporting(false);
    }
  }

  if (loading) return <PsiLoadingState rows={4} />;
  return (
    <div className="space-y-5">
      {error ? <PsiErrorState message={error} /> : null}
      <PsiCard title="Equipment Design Basis Import" subtitle="Bulk import is backend validated. The API returns row-level errors, completeness impact, conflict impact, and audit/history events for committed imports.">
        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">Required template fields</p>
            <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(template, null, 2)}</pre>
          </div>
          <div>
            <label className="text-sm font-semibold">Rows JSON</label>
            <textarea value={rows} onChange={(event) => setRows(event.target.value)} className="mt-2 min-h-80 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-xs" />
            <div className="mt-3"><PsiButton onClick={() => void preview()} disabled={importing} title={importing ? 'Import preview is running.' : undefined}>{importing ? 'Checking...' : 'Preview Import'}</PsiButton></div>
          </div>
        </div>
      </PsiCard>
      {result ? <PsiCard title="Import Preview Result"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(result, null, 2)}</pre></PsiCard> : null}
    </div>
  );
}
