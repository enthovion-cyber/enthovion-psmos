import { LinkedStatGrid } from './LinkedRecordUi';

export function LinkedRecordsSummaryCards({ summary }: { summary: any }) {
  return <LinkedStatGrid cards={[
    ['Total links', summary.totalLinkedRecords ?? 0],
    ['Required', summary.requiredRecords ?? 0, 'warning'],
    ['Blocking', summary.blockingRecords ?? 0, 'danger'],
    ['Source changed', summary.sourceChanged ?? 0, 'warning'],
    ['Restricted', summary.restrictedRecords ?? 0, 'danger'],
    ['Ready review', summary.readyForReview ? 'Ready' : 'Blocked', summary.readyForReview ? 'success' : 'danger']
  ]} />;
}
