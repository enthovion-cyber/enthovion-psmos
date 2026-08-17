'use client';

import { useState } from 'react';
import { useMiDocuments } from '../hooks/useMiDocuments';
import { miDocumentService } from '../services/mi-document.service';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { DocumentRequirementConfig } from './DocumentRequirementConfig';
import { ExpiredDocumentsPanel } from './ExpiredDocumentsPanel';
import { LinkDocumentDialog } from './LinkDocumentDialog';
import { MiDocumentsFilters } from './MiDocumentsFilters';
import { MiDocumentsHeader } from './MiDocumentsHeader';
import { MiDocumentsSummaryCards } from './MiDocumentsSummaryCards';
import { MiDocumentsTable } from './MiDocumentsTable';
import { MissingDocumentsPanel } from './MissingDocumentsPanel';
import { PendingApprovalPanel } from './PendingApprovalPanel';
import { RequiredDocumentsPanel } from './RequiredDocumentsPanel';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function MiDocumentsDashboardPage({ initialFilters = {} }: { initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);
  const [dialog, setDialog] = useState(false);
  const query = useMiDocuments(filters);
  const queryClient = useQueryClient();
  const link = useMutation({ mutationFn: miDocumentService.link, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity'] }); setDialog(false); } });
  const remove = useMutation({ mutationFn: (id: string) => miDocumentService.remove(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity'] }) });
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load MI documents. Check permissions and Document Control access.</div>;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-5"><MiDocumentsHeader lastUpdated={query.data?.lastUpdated} onLink={() => setDialog(true)} onRefresh={() => void query.refetch()} /><MiDocumentsSummaryCards summary={query.data?.summary} /><div className="grid gap-5 xl:grid-cols-4"><RequiredDocumentsPanel rows={(query.data?.requirements as any)?.rows} /><MissingDocumentsPanel rows={(query.data?.requirements as any)?.missing} /><ExpiredDocumentsPanel rows={rows} /><PendingApprovalPanel rows={rows} /></div><MiDocumentsFilters filters={filters} savedViews={query.data?.savedViews} onChange={setFilters} /><MiDocumentsTable rows={rows} onRemove={(id) => remove.mutate(id)} /><DocumentRequirementConfig />{dialog ? <LinkDocumentDialog saving={link.isPending} onClose={() => setDialog(false)} onSubmit={(input) => link.mutate(input)} /> : null}</div>;
}
