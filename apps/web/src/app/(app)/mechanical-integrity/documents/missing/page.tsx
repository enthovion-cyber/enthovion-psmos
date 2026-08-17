import { MiDocumentsDashboardPage } from '@/features/mechanical-integrity/documents/MiDocumentsDashboardPage';

export default function Page() {
  return <MiDocumentsDashboardPage initialFilters={{ missing: 'true' }} />;
}
