'use client';

import { useState } from 'react';
import { EngineeringDocumentUploadPanel } from '../engineering/EngineeringDocumentUploadPanel';
import { EngineeringDocumentsTable } from '../engineering/EngineeringDocumentsTable';
import { EngineeringPackageSummaryCard } from '../engineering/EngineeringPackageSummaryCard';
import { RequiredEngineeringChecklist } from '../engineering/RequiredEngineeringChecklist';
import { PIDRedlineSection } from '../engineering/PIDRedlineSection';
import { EngineeringCalculationsSection } from '../engineering/EngineeringCalculationsSection';
import { EquipmentDatasheetsSection } from '../engineering/EquipmentDatasheetsSection';
import { VendorDocumentsSection } from '../engineering/VendorDocumentsSection';
import { HazardousAreaClassificationSection } from '../engineering/HazardousAreaClassificationSection';
import { DesignBasisSection } from '../engineering/DesignBasisSection';
import { SISDCSSoftwareChangeSection } from '../engineering/SISDCSSoftwareChangeSection';
import { EngineeringReviewStatus } from '../engineering/EngineeringReviewStatus';
import { EngineeringDocumentPreviewDrawer } from '../engineering/EngineeringDocumentPreviewDrawer';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { useMOCEngineeringPackage } from '../../hooks/useMOCEngineeringPackage';
import { useMOCEngineeringMutations } from '../../hooks/useMOCEngineeringMutations';
import { mocEngineeringService } from '../../services/moc-engineering.service';

export function MOCEngineeringPackageTab({ moc }: { moc: any }) {
  const query = useMOCEngineeringPackage(moc.id);
  const mutations = useMOCEngineeringMutations(moc.id);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const data = query.data;
  const docs = data?.documents ?? [];
  const requirements = data?.requirements ?? [];
  const documentTypes = [...new Set([...requirements.map((item: any) => item.documentType), 'Vendor document', 'Engineering calculation', 'Other engineering evidence'])] as string[];
  const answers = moc.impact?.answers ?? {};

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load engineering package from API." />;

  const previewDocument = async (doc: any) => {
    setPreviewDoc(doc);
    setPreview(await mocEngineeringService.previewDocument(moc.id, doc.id));
  };

  return (
    <div className="space-y-4">
      <EngineeringPackageSummaryCard summary={data?.summary} />
      {data?.summary?.missingRequiredDocumentsCount ? <div className="rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">Missing required engineering documents must be resolved or justified before approval/startup.</div> : null}
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <RequiredEngineeringChecklist requirements={requirements} onRegenerate={() => mutations.regenerateRequirements.mutate()} regenerating={mutations.regenerateRequirements.isPending} />
          <EngineeringDocumentsTable documents={docs} onPreview={previewDocument} onDownload={(doc) => mocEngineeringService.downloadDocument(moc.id, doc.id)} onDelete={(id) => mutations.deleteDocument.mutate(id)} onUnlink={(id) => mutations.unlink.mutate(id)} readOnly={data?.readOnly} />
          <PIDRedlineSection documents={docs} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <EngineeringCalculationsSection documents={docs} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <EquipmentDatasheetsSection documents={docs} equipment={moc.equipment ?? []} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <VendorDocumentsSection documents={docs} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <HazardousAreaClassificationSection documents={docs} affected={answers.hazardousAreaAffected} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <DesignBasisSection documents={docs} riskLevel={moc.risk_level} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <SISDCSSoftwareChangeSection documents={docs} answers={answers} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        </div>
        <aside className="space-y-4">
          <EngineeringDocumentUploadPanel documentTypes={documentTypes} onUpload={(values) => mutations.upload.mutate(values)} onLink={(values) => mutations.link.mutate(values)} saving={mutations.upload.isPending || mutations.link.isPending} readOnly={data?.readOnly} />
          <EngineeringReviewStatus pkg={data?.package} reviews={data?.reviews ?? []} busy={mutations.submitReview.isPending || mutations.approve.isPending || mutations.reject.isPending} onSubmit={() => mutations.submitReview.mutate()} onApprove={() => mutations.approve.mutate({ comments: 'Engineering package approved.' })} onReject={() => { const reason = window.prompt('Reason for returning engineering package?'); if (reason) mutations.reject.mutate({ reason }); }} onRequestDocument={() => { const documentType = window.prompt('Which missing document is required?'); if (documentType) mutations.requestDocument.mutate({ documentType, comments: `Please provide ${documentType}` }); }} />
        </aside>
      </div>
      <EngineeringDocumentPreviewDrawer document={previewDoc} preview={preview} onClose={() => { setPreviewDoc(null); setPreview(null); }} />
    </div>
  );
}
