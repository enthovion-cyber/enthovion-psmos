import type { SafeguardDetail } from '../../types/safeguard.types';
import { SafeguardListPanel } from '../SafeguardPrimitives';

export function SafeguardDocumentsTab({ detail }: { detail: SafeguardDetail }) {
  return <SafeguardListPanel title="Documents / Evidence" subtitle="Document Control evidence links with document number, title, status, revision snapshot, relationship type, required flag, and readiness impact." rows={detail.documents} emptyTitle="No documents linked" emptyMessage="Link approved Document Control evidence; do not upload raw files into PSI Safeguards." />;
}
