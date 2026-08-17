import { FormSection, TextArea, TextField } from './section-fields';
export function DocumentsEvidenceSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Documents / Evidence" description="Cause/effect charts, SRS, proof-test procedures, calibration references, and controlled document links.">
    <TextField label="Cause/effect document" value={value.causeEffectDocumentId ?? value.cause_effect_document_id} onChange={(causeEffectDocumentId) => onChange({ causeEffectDocumentId })} />
    <TextField label="SRS document" value={value.srsDocumentId ?? value.srs_document_id} onChange={(srsDocumentId) => onChange({ srsDocumentId })} />
    <TextField label="Proof-test procedure" value={value.proofTestProcedureDocumentId ?? value.proof_test_procedure_document_id} onChange={(proofTestProcedureDocumentId) => onChange({ proofTestProcedureDocumentId })} />
    <TextArea label="Evidence notes" value={value.evidenceNotes ?? value.evidence_notes} onChange={(evidenceNotes) => onChange({ evidenceNotes })} />
  </FormSection>;
}
