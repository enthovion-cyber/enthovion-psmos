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
  const documentTypes = [
    ...new Set([
      ...requirements.map((item: any) => item.documentType),
      'Vendor document',
      'Engineering calculation',
      'Other engineering evidence'
    ])
  ] as string[];
  const answers = moc.impact?.answers ?? {};

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load engineering package from API." />;

  const previewDocument = async (doc: any) => {
    setPreviewDoc(doc);
    setPreview(await mocEngineeringService.previewDocument(moc.id, doc.id));
  };

  return (
    <div className="space-y-6 w-full">
      {/* Engineering Summary */}
      <EngineeringPackageSummaryCard summary={data?.summary} />

      {data?.summary?.missingRequiredDocumentsCount ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-700 dark:text-rose-300">
          Missing required engineering documents must be uploaded and verified before technical review and PSSR authorization.
        </div>
      ) : null}

      {/* Engineering Actions & Upload Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
        <EngineeringDocumentUploadPanel
          documentTypes={documentTypes}
          onUpload={(values) => mutations.upload.mutate(values as any)}
          onLink={(values) => mutations.link.mutate(values)}
          saving={mutations.upload.isPending || mutations.link.isPending}
          readOnly={data?.readOnly}
        />
        <EngineeringReviewStatus
          pkg={data?.package}
          reviews={data?.reviews ?? []}
          busy={mutations.submitReview.isPending || mutations.approve.isPending || mutations.reject.isPending}
          onSubmit={() => mutations.submitReview.mutate()}
          onApprove={() => mutations.approve.mutate({ comments: 'Engineering package approved.' })}
          onReject={() => {
            const reason = window.prompt('Reason for returning engineering package?');
            if (reason) mutations.reject.mutate({ reason });
          }}
          onRequestDocument={() => {
            const documentType = window.prompt('Which missing document is required?');
            if (documentType) mutations.requestDocument.mutate({ documentType, comments: `Please provide ${documentType}` });
          }}
        />
      </div>

      {/* Requirements Checklist & Documents Register */}
      <RequiredEngineeringChecklist
        requirements={requirements}
        onRegenerate={() => mutations.regenerateRequirements.mutate()}
        regenerating={mutations.regenerateRequirements.isPending}
      />

      <EngineeringDocumentsTable
        documents={docs}
        onPreview={previewDocument}
        onDownload={(doc) => mocEngineeringService.downloadDocument(moc.id, doc.id)}
        onDelete={(id) => mutations.deleteDocument.mutate(id)}
        onUnlink={(id) => mutations.unlink.mutate(id)}
        readOnly={data?.readOnly}
      />

      {/* Structured Engineering Sections */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PIDRedlineSection documents={docs} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <EngineeringCalculationsSection documents={docs} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <EquipmentDatasheetsSection documents={docs} equipment={moc.equipment ?? []} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <VendorDocumentsSection documents={docs} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <HazardousAreaClassificationSection documents={docs} affected={answers.hazardousAreaAffected} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <DesignBasisSection documents={docs} riskLevel={moc.risk_level} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      </div>

      <SISDCSSoftwareChangeSection documents={docs} answers={answers} onUploadType={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

      {previewDoc && (
        <EngineeringDocumentPreviewDrawer
          document={previewDoc}
          preview={preview}
          onClose={() => {
            setPreviewDoc(null);
            setPreview(null);
          }}
        />
      )}
    </div>
  );
}
