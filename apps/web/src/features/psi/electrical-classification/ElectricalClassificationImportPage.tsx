'use client';

import { useState } from 'react';
import { electricalClassificationService } from '../services/electrical-classification.service';
import { PsiButton, PsiCard, PsiErrorState } from '../shared/PsiUi';

export function ElectricalClassificationImportPage() {
  const [rawRows, setRawRows] = useState('');
  const [template, setTemplate] = useState<Record<string, unknown> | null>(null);
  const [preview, setPreview] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadTemplate() {
    setError(null);
    setBusy(true);
    try {
      setTemplate(await electricalClassificationService.importTemplate());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load import template.');
    } finally {
      setBusy(false);
    }
  }

  async function runPreview() {
    setError(null);
    setBusy(true);
    try {
      const rows = rawRows.trim() ? JSON.parse(rawRows) : [];
      setPreview(await electricalClassificationService.importPreview({ rows }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to preview import rows. Paste a JSON array of rows from the template.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PsiCard title="Import Electrical Classifications" subtitle="Preview bulk hazardous-area classifications before creation. Backend validates company/site/unit access, required columns, duplicates, missing area drawings, rating data gaps, and audit/import job metadata.">
        <div className="flex flex-wrap gap-2"><PsiButton variant="secondary" onClick={() => void loadTemplate()} disabled={busy} title={busy ? 'Import request is running.' : undefined}>Load Template</PsiButton><PsiButton onClick={() => void runPreview()} disabled={busy} title={busy ? 'Import request is running.' : undefined}>Preview Import</PsiButton></div>
      </PsiCard>
      {error ? <PsiErrorState message={error} /> : null}
      {template ? <PsiCard title="Template Columns"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-sm">{JSON.stringify(template, null, 2)}</pre></PsiCard> : null}
      <PsiCard title="Import Rows" subtitle="Paste JSON array rows mapped to the PDF-required fields. File upload can be enabled by wiring this page to the configured storage/import bucket.">
        <textarea className="min-h-72 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 font-mono text-sm" value={rawRows} onChange={(event) => setRawRows(event.target.value)} placeholder='[{"classification_title":"Pump bay Zone 2","unit_id":"...","classification_system":"IEC Zone","hazardous_material_name":"Propane"}]' />
      </PsiCard>
      {preview ? <PsiCard title="Import Preview"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-sm">{JSON.stringify(preview, null, 2)}</pre></PsiCard> : null}
    </div>
  );
}
