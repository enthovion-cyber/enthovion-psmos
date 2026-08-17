import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistReviewTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable title="Review Records" rows={detail.reviews} />
);
