import { ChecklistTabTable } from "./ChecklistTabTable";
export const ChecklistHistoryTab = ({ detail }: { detail: any }) => (
  <ChecklistTabTable title="History Events" rows={detail.history} />
);
