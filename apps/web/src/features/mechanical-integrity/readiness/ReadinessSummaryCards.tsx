import { SummaryGrid } from '../safeguards/SafeguardUiPrimitives';
import type { MiReadinessSummary } from '../types/readiness.types';

export function ReadinessSummaryCards({ summary }: { summary?: MiReadinessSummary | undefined }) {
  const cards: Array<[string, unknown, string?]> = [
    ['Total Equipment Assessed', summary?.totalAssessed, 'Assessments in scope'],
    ['Fit for Service', summary?.fitForService, 'Approved or recommended fit'],
    ['Fit With Restrictions', summary?.fitWithRestrictions, 'Operation has controls'],
    ['Not Fit for Service', summary?.notFit, 'Operation not allowed'],
    ['Startup Blocked', summary?.startupBlocked, 'Critical startup blockers'],
    ['Pending Review', summary?.pendingReview, 'Submitted or in review'],
    ['Pending Approval', summary?.pendingApproval, 'Waiting final approval'],
    ['Engineering Review Required', summary?.engineeringReviewRequired, 'FFS or engineering basis required'],
    ['Critical Deficiencies', summary?.criticalDeficiencies, 'Open critical deficiency blockers'],
    ['Active Impairments', summary?.activeImpairments, 'Bypasses or impairments'],
    ['Failed PSV Tests', summary?.failedPsvTests, 'Relief device readiness blockers'],
    ['Failed Safeguard Tests', summary?.failedSafeguardTests, 'SIS/interlock/alarm blockers'],
    ['Overdue Inspection', summary?.overdueInspection, 'Inspection readiness issues'],
    ['Overdue PM', summary?.overduePm, 'PM readiness issues'],
    ['Overdue Calibration', summary?.overdueCalibration, 'Calibration readiness issues'],
    ['Low Remaining Life', summary?.lowRemainingLife, 'FFS/remaining-life blockers'],
    ['Missing Certificate', summary?.missingCertificate, 'Required evidence not linked'],
    ['Waiting Work Verification', summary?.waitingVerification, 'Work awaiting technical verification'],
    ['PSSR Startup Blockers', summary?.pssrStartupBlockers, 'Startup cannot proceed'],
    ['Temporary Deviation', summary?.temporaryDeviation, 'Temporary operation under deviation']
  ];
  return <SummaryGrid cards={cards} />;
}
