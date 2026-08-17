import { FoundationTab } from './WorkerOverviewTab';
export function WorkerAccountLinkTab({ row }: { row: Record<string, any> | null }) { return <FoundationTab title="Linked User Account" message="No linked IAM account. Worker profiles can exist without login accounts." rows={row ? [row] : []} />; }
