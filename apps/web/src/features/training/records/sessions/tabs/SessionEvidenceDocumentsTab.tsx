'use client';

import { CompletionEvidencePanel } from '../../completions/CompletionEvidencePanel';

export function SessionEvidenceDocumentsTab({ rows }: { rows: Record<string, any>[] }) {
  return <CompletionEvidencePanel evidence={rows} />;
}
