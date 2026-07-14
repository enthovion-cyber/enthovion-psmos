'use client';
import { Card } from '../FormBits';
import { IncidentEvidenceUploader } from '../IncidentEvidenceUploader';
export function InitialEvidenceStep({ values, update, context, draftId }: any) {
  return <Card title="10. Initial Evidence / Attachments"><IncidentEvidenceUploader values={values} update={update} context={context} draftId={draftId} canUpload={context?.permissions?.canUploadEvidence} /><p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Evidence content must be uploaded through configured storage. This wizard stores secure storage metadata and preserves draft data if upload fails.</p></Card>;
}
