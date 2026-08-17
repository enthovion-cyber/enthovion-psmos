'use client';

import { useState } from 'react';
import { useEquipmentMiDocuments } from '../../hooks/useMiDocuments';
import { miDocumentService } from '../../services/mi-document.service';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { ExpiredDocumentsPanel } from '../../documents/ExpiredDocumentsPanel';
import { LinkDocumentDialog } from '../../documents/LinkDocumentDialog';
import { MiDocumentsSummaryCards } from '../../documents/MiDocumentsSummaryCards';
import { MiDocumentsTable } from '../../documents/MiDocumentsTable';
import { MissingDocumentsPanel } from '../../documents/MissingDocumentsPanel';
import { PendingApprovalPanel } from '../../documents/PendingApprovalPanel';
import { RequiredDocumentsPanel } from '../../documents/RequiredDocumentsPanel';
import { PrimaryButton, SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function DocumentsTab({ equipmentId }: { equipmentId: string }) {
  const query = useEquipmentMiDocuments(equipmentId);
  const [dialog, setDialog] = useState(false);
  const queryClient = useQueryClient();
  const link = useMutation({ mutationFn: miDocumentService.link, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity'] }); setDialog(false); } });
  const remove = useMutation({ mutationFn: (id: string) => miDocumentService.remove(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity'] }) });
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load equipment documents.</div>;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-5"><SectionCard title="Document Completeness Summary" actions={<PrimaryButton onClick={() => setDialog(true)}>Add / Link Document</PrimaryButton>}><MiDocumentsSummaryCards summary={query.data?.summary} /></SectionCard><div className="grid gap-5 xl:grid-cols-4"><RequiredDocumentsPanel rows={(query.data?.requirements as any)?.rows} /><MissingDocumentsPanel rows={(query.data?.requirements as any)?.missing} /><ExpiredDocumentsPanel rows={rows} /><PendingApprovalPanel rows={rows} /></div><SectionCard title="Current Approved Documents / Certificates / Drawings / Procedures / Reports / Evidence"><MiDocumentsTable rows={rows} onRemove={(id) => remove.mutate(id)} /></SectionCard>{dialog ? <LinkDocumentDialog defaults={{ linkedModule: 'Equipment', linkedRecordId: equipmentId, equipmentId }} saving={link.isPending} onClose={() => setDialog(false)} onSubmit={(input) => link.mutate({ ...input, equipmentId })} /> : null}</div>;
}
