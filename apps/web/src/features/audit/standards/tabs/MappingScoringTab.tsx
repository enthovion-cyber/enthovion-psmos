import { MappingLinkedRecordsTab } from "./MappingLinkedRecordsTab";
export function MappingScoringTab({ detail }: { detail: Record<string, any> }) { return <MappingLinkedRecordsTab detail={{ links: (detail.links ?? []).filter((l: Record<string, any>) => l.link_role === "Score" || l.linked_object_type === "score-run") }} />; }
