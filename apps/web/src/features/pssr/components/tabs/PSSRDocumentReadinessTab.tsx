'use client';

import { ControlledDocumentsTable } from '../documents/ControlledDocumentsTable';
import { DocumentApprovalVersionStatus } from '../documents/DocumentApprovalVersionStatus';
import { DocumentReadinessSummaryCard } from '../documents/DocumentReadinessSummaryCard';
import { EmergencyOperatingLimitDocumentReadiness } from '../documents/EmergencyOperatingLimitDocumentReadiness';
import { EngineeringDocumentReadinessSection } from '../documents/EngineeringDocumentReadinessSection';
import { MissingDocumentBlockersPanel } from '../documents/MissingDocumentBlockersPanel';
import { PIDReadinessSection } from '../documents/PIDReadinessSection';
import { PSISDSChemicalDataReadinessSection } from '../documents/PSISDSChemicalDataReadinessSection';
import { RequiredDocumentChecklist } from '../documents/RequiredDocumentChecklist';
import { SOPProcedureReadinessSection } from '../documents/SOPProcedureReadinessSection';
import { EmptyState, ErrorState, LoadingState, PSSRCard } from '../pssr-ui';
import { usePSSRDocumentMutations } from '../../hooks/usePSSRDocumentMutations';
import { usePSSRDocumentReadiness } from '../../hooks/usePSSRDocumentReadiness';

export function PSSRDocumentReadinessTab({ pssr }: { pssr: any }) {
  const query = usePSSRDocumentReadiness(pssr.id);
  const mutations = usePSSRDocumentMutations(pssr.id);
  const data = query.data;

  function link(row: any) {
    const documentNumber = window.prompt('Controlled document number');
    if (!documentNumber) return;
    const documentTitle = window.prompt('Controlled document title') ?? row.document_title ?? documentNumber;
    const currentVersion = window.prompt('Current approved version') ?? 'Current';
    mutations.linkDocument.mutate({ readinessId: row.id, documentNumber, documentTitle, currentVersion, status: 'Current' });
  }

  function revision(row: any) {
    const reason = window.prompt('Revision request reason');
    if (reason) mutations.requestRevision.mutate({ readinessId: row.id, reason });
  }

  function justify(row: any) {
    const justification = window.prompt('Justification for not required');
    if (justification) mutations.justifyNotRequired.mutate({ readinessId: row.id, justification });
  }

  function verify(row: any) {
    const comment = window.prompt('Verification comment') ?? '';
    mutations.verify.mutate({ readinessId: row.id, comment });
  }

  function reject(row: any) {
    const reason = window.prompt('Reject reason');
    if (reason) mutations.reject.mutate({ readinessId: row.id, reason });
  }

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load document readiness from API." />;
  if (!data?.requirements?.length && !data?.readiness?.length) {
    return (
      <div className="space-y-4">
        <PSSRCard title="Document Readiness" action={<button onClick={() => mutations.generate.mutate()} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white">Generate Requirements</button>}>
          <EmptyState title="No document readiness requirements generated yet." />
        </PSSRCard>
      </div>
    );
  }
  const rows = data.readiness ?? [];
  return (
    <div className="space-y-4">
      <DocumentReadinessSummaryCard summary={data.summary} />
      <PSSRCard title="Document Readiness Controls">
        <div className="grid gap-2 md:grid-cols-2">
          <button onClick={() => mutations.generate.mutate()} className="rounded-md border border-blue-300/20 bg-blue-500/10 px-3 py-2 text-sm font-black text-blue-100">Generate Required Documents</button>
          <button onClick={() => mutations.syncFromMoc.mutate()} className="rounded-md border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-sm font-black text-amber-100">Sync From Linked MOC</button>
        </div>
      </PSSRCard>
      <RequiredDocumentChecklist requirements={data.requirements ?? []} />
      <ControlledDocumentsTable readiness={rows} onLink={link} onUnlink={(row) => mutations.unlinkDocument.mutate(row.id)} onRevision={revision} onJustify={justify} onVerify={verify} onReject={reject} />
      <div className="grid gap-4 xl:grid-cols-2">
        <PIDReadinessSection rows={rows} />
        <SOPProcedureReadinessSection rows={rows} />
        <PSISDSChemicalDataReadinessSection rows={rows} />
        <EngineeringDocumentReadinessSection rows={rows} />
      </div>
      <EmergencyOperatingLimitDocumentReadiness rows={rows} />
      <div className="grid gap-4 xl:grid-cols-2">
        <MissingDocumentBlockersPanel blockers={data.blockers ?? []} />
        <DocumentApprovalVersionStatus readiness={rows} />
      </div>
    </div>
  );
}
