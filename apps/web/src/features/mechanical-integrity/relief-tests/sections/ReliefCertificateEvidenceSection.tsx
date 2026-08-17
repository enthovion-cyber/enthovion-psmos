import { Field, SectionShell } from '../../relief-devices/sections/section-utils';

export function ReliefCertificateEvidenceSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Certificate / Evidence" description="Certificate linkage foundation for Document Control and storage-backed evidence.">
      <Field label="Certificate document ID" name="certificateDocumentId" value={values.certificateDocumentId} onChange={onChange} />
      <Field label="Certificate number" name="certificateNumber" value={values.certificateNumber} onChange={onChange} />
      <Field label="Issued by" name="issuedBy" value={values.issuedBy} onChange={onChange} />
      <Field label="Issued date" name="issuedAt" value={values.issuedAt} onChange={onChange} type="date" />
      <Field label="Expiry date" name="expiryDate" value={values.expiryDate} onChange={onChange} type="date" />
    </SectionShell>
  );
}
