import { MiniField, PanelGrid } from '../MocTrainingPanelPrimitives';

export function MocRequiredEvidenceSection({ values }: { values: Record<string, any> }) {
  return <div className="space-y-3"><h2 className="text-base font-semibold">Required Evidence</h2><PanelGrid><MiniField label="Attendance required" value={values.attendance_required ?? values.attendanceRequired} /><MiniField label="SOP acknowledgement required" value={values.sop_ack_required ?? values.sopAckRequired} /><MiniField label="Assessment required" value={values.assessment_required ?? values.assessmentRequired} /><MiniField label="Certificate required" value={values.certificate_required ?? values.certificateRequired} /><MiniField label="Evidence required" value={values.evidence_required ?? values.evidenceRequired} /><MiniField label="Verification required" value={values.verification_required ?? values.verificationRequired} /></PanelGrid></div>;
}
