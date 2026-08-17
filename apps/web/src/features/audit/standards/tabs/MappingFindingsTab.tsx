import { MappingLinkedRecordsTab } from "./MappingLinkedRecordsTab";
export function MappingFindingsTab({ detail }: { detail: Record<string, any> }) { return <MappingLinkedRecordsTab detail={{ links: (detail.links ?? []).filter((l: Record<string, any>) => l.link_role === "Finding" || l.linked_object_type === "finding") }} />; }
