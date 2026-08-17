'use client';

import { useState } from 'react';
import { reliefSystemService } from '../services/relief-system.service';
import { PsiButton } from '../shared/PsiUi';

export function ReliefSystemExportButton({ params }: { params?: Record<string, unknown> | undefined }) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function exportRows() {
    setExporting(true);
    setError(null);
    try {
      const payload = await reliefSystemService.exportRows(params ?? {});
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `psi-relief-systems-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export relief systems.');
    } finally {
      setExporting(false);
    }
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <PsiButton variant="secondary" disabled={exporting} title={exporting ? 'Export is running.' : error ?? 'Export relief-system registry using backend permissions and redaction rules.'} onClick={() => void exportRows()}>{exporting ? 'Exporting...' : 'Export'}</PsiButton>
      {error ? <span className="max-w-44 text-xs text-danger">{error}</span> : null}
    </span>
  );
}
