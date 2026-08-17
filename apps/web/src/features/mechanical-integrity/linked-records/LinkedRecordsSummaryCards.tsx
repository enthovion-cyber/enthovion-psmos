import { SummaryGrid } from '../safeguards/SafeguardUiPrimitives';

export function LinkedRecordsSummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  return <SummaryGrid cards={[
    ['Total Links', summary?.totalLinks ?? 0],
    ['Equipment Links', summary?.equipmentLinks ?? 0],
    ['Document Links', summary?.documentLinks ?? 0],
    ['MOC Links', summary?.mocLinks ?? 0],
    ['PSSR Links', summary?.pssrLinks ?? 0],
    ['Incident Links', summary?.incidentLinks ?? 0],
    ['Deficiency Links', summary?.deficiencyLinks ?? 0],
    ['Work Order Links', summary?.workOrderLinks ?? 0],
    ['Inspection Links', summary?.inspectionLinks ?? 0],
    ['PSV/SIF Links', summary?.psvSifLinks ?? 0],
    ['Broken Links', summary?.brokenLinks ?? 0],
    ['Permission Limited', summary?.permissionLimitedLinks ?? 0],
    ['Added This Month', summary?.linksAddedThisMonth ?? 0]
  ]} />;
}
