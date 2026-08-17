import { MappingLinkedRecordsTab } from "./MappingLinkedRecordsTab";
export function MappingCapaTab({ detail }: { detail: Record<string, any> }) { return <MappingLinkedRecordsTab detail={{ links: (detail.links ?? []).filter((l: Record<string, any>) => l.link_role === "CAPA" || l.linked_object_type === "capa") }} />; }
