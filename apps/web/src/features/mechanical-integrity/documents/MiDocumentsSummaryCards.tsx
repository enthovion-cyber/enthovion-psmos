import { SummaryGrid } from '../safeguards/SafeguardUiPrimitives';

export function MiDocumentsSummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  return <SummaryGrid cards={[
    ['Total MI Document Links', summary?.totalMiDocumentLinks ?? 0],
    ['Required Documents', summary?.requiredDocuments ?? 0],
    ['Missing Required Documents', summary?.missingRequiredDocuments ?? 0],
    ['Expired Documents', summary?.expiredDocuments ?? 0],
    ['Pending Approval', summary?.pendingApproval ?? 0],
    ['Superseded Documents', summary?.supersededDocuments ?? 0],
    ['Current Approved Documents', summary?.currentApprovedDocuments ?? 0],
    ['Equipment With Missing', summary?.equipmentWithMissingDocuments ?? 0],
    ['Readiness Blocked', summary?.readinessBlockedByDocuments ?? 0],
    ['Certificates Expiring Soon', summary?.certificatesExpiringSoon ?? 0],
    ['PSV Certificates Missing', summary?.psvCertificatesMissing ?? 0],
    ['Calibration Certs Missing', summary?.calibrationCertificatesMissing ?? 0],
    ['SIF Proof Tests Missing', summary?.sifProofTestReportsMissing ?? 0],
    ['Inspection Reports Missing', summary?.inspectionReportsMissing ?? 0],
    ['FFS Evidence Missing', summary?.ffsEvidenceMissing ?? 0]
  ]} />;
}
