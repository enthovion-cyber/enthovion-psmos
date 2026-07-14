import { StatGrid } from './RecommendationUi';

export function LopaRecommendationsSummaryCards({ summary }: { summary: any }) {
  return <StatGrid cards={[
    ['Total recs', summary.totalRecommendations ?? 0],
    ['Open recs', summary.openRecommendations ?? 0, 'warning'],
    ['Closed recs', summary.closedRecommendations ?? 0, 'success'],
    ['Linked actions', summary.totalLinkedActions ?? 0],
    ['Overdue actions', summary.overdueActions ?? 0, 'danger'],
    ['Ready review', summary.readyForReview ? 'Ready' : 'Blocked', summary.readyForReview ? 'success' : 'danger']
  ]} />;
}
