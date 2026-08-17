export function criticalityExportUrl(query = '') {
  return `/api/v1/mechanical-integrity/criticality/export${query ? `?${query}` : ''}`;
}
