export type RegulatoryAuditMappingLink = Record<string, any> & {
  id: string;
  mapping_id?: string;
  link_type?: string;
  target_object_type?: string;
  target_object_id?: string;
  link_status?: string;
};
