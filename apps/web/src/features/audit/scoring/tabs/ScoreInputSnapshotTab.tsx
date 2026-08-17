import { AuditCard } from "../../shared/AuditUi";
import { Json } from "./ScoreRunOverviewTab";
export function ScoreInputSnapshotTab({ detail }: { detail: Record<string, any> }) { return <AuditCard title="Input Snapshot" subtitle="Immutable backend source snapshot used for this score run."><Json value={detail.scoreRun.input_snapshot_json} /></AuditCard>; }
