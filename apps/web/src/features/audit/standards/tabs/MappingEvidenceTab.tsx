import { MappingLinkedRecordsTab } from "./MappingLinkedRecordsTab";
export function MappingEvidenceTab({ detail }: { detail: Record<string, any> }) { return <MappingLinkedRecordsTab detail={{ links: (detail.links ?? []).filter((l: Record<string, any>) => l.link_role === "Evidence" || l.linked_object_type === "evidence") }} />; }
