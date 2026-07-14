import { api } from '@/services/api';
import type { Permit } from '@/services/ptw.service';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type PTWMapFilters = {
  site_id?: string;
  unit_id?: string;
  area_id?: string;
  equipment_id?: string;
  permit_type?: string;
  status?: string;
  risk_level?: string;
  has_conflict?: string;
  gas_status?: string;
  isolation_status?: string;
  handover_status?: string;
  expiring_within?: string;
  contractor_company_id?: string;
  holder_id?: string;
};

export type PTWMapPermitItem = {
  permit_id: string;
  permit_number: string;
  permit_title: string;
  permit_type: string;
  status: string;
  risk_level: string;
  company_id?: string | null;
  site_id?: string | null;
  unit_id?: string | null;
  unit_name?: string | null;
  area_id?: string | null;
  area_name?: string | null;
  equipment_id?: string | null;
  equipment_tag?: string | null;
  holder_name?: string | null;
  contractor_company?: string | null;
  planned_start?: string | null;
  planned_end?: string | null;
  expiry_at?: string | null;
  expires_in_minutes?: number | null;
  has_conflict: boolean;
  highest_conflict_severity?: string | null;
  gas_status: string;
  isolation_status: string;
  handover_status: string;
  signature_status: string;
  latitude?: number | null;
  longitude?: number | null;
  svg_x: number;
  svg_y: number;
  map_zone_id?: string | null;
  permit?: Permit;
  conflicts?: Array<Record<string, any>>;
};

export type PTWMapAreaItem = {
  area_id?: string | null;
  area_name: string;
  unit_id?: string | null;
  unit_name: string;
  active_permit_count: number;
  high_risk_count: number;
  critical_risk_count: number;
  conflict_count: number;
  expiring_count: number;
  gas_retest_due_count: number;
  isolation_pending_count: number;
  handover_pending_count: number;
  highest_risk: string;
  permits: PTWMapPermitItem[];
};

export type PTWMapEquipmentItem = {
  equipment_id: string;
  equipment_tag: string;
  equipment_name: string;
  equipment_type?: string | null;
  criticality?: string | null;
  area_id?: string | null;
  active_permit_count: number;
  latitude?: number | null;
  longitude?: number | null;
  svg_x?: number | null;
  svg_y?: number | null;
  permits?: PTWMapPermitItem[];
};

export type PTWMapLayout = {
  id: string;
  site_id: string;
  unit_id?: string | null;
  area_id?: string | null;
  layout_name: string;
  layout_type: 'SVG' | 'IMAGE' | 'DATA';
  svg_file_url?: string | null;
  image_file_url?: string | null;
  width: number;
  height: number;
  version: string;
  is_active: boolean;
};

export type PTWMapData = {
  generatedAt: string;
  mode: 'SVG' | 'DATA' | 'IMAGE';
  realtime: { connected: boolean; channel: string; refreshIntervalMs: number };
  layout: PTWMapLayout | null;
  zones: Array<Record<string, any>>;
  configuredMarkers: Array<Record<string, any>>;
  permits: PTWMapPermitItem[];
  areas: PTWMapAreaItem[];
  equipment: PTWMapEquipmentItem[];
  conflicts: Array<Record<string, any>>;
  alerts: Array<Record<string, any>>;
  summary: Record<string, number>;
};

export const ptwMapService = {
  data: (params?: PTWMapFilters) => api.get('/ptw/map', { params }).then(unwrap<PTWMapData>),
  summary: (params?: PTWMapFilters) => api.get('/ptw/map/summary', { params }).then(unwrap<Record<string, number>>),
  areas: (params?: PTWMapFilters) => api.get('/ptw/map/areas', { params }).then(unwrap<PTWMapAreaItem[]>),
  equipment: (params?: PTWMapFilters) => api.get('/ptw/map/equipment', { params }).then(unwrap<PTWMapEquipmentItem[]>),
  conflicts: (params?: PTWMapFilters) => api.get('/ptw/map/conflicts', { params }).then(unwrap<Array<Record<string, any>>>),
  alerts: (params?: PTWMapFilters) => api.get('/ptw/map/alerts', { params }).then(unwrap<Array<Record<string, any>>>),
  permitPreview: (permitId: string) => api.get(`/ptw/map/permit/${permitId}/preview`).then(unwrap<Permit>),
  layouts: (params?: PTWMapFilters) => api.get('/ptw/map/layouts', { params }).then(unwrap<PTWMapLayout[]>),
  createLayout: (input: Record<string, any>) => api.post('/ptw/map/layouts', input).then(unwrap<PTWMapLayout>),
  updateLayout: (layoutId: string, input: Record<string, any>) => api.patch(`/ptw/map/layouts/${layoutId}`, input).then(unwrap<PTWMapLayout>),
  deleteLayout: (layoutId: string) => api.delete(`/ptw/map/layouts/${layoutId}`).then(unwrap<{ deleted: boolean; id: string }>),
  uploadSvg: (layoutId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/ptw/map/layouts/${layoutId}/upload-svg`, form).then(unwrap<PTWMapLayout>);
  },
  zones: (layoutId: string) => api.get(`/ptw/map/layouts/${layoutId}/zones`).then(unwrap<Array<Record<string, any>>>),
  createZone: (layoutId: string, input: Record<string, any>) => api.post(`/ptw/map/layouts/${layoutId}/zones`, input).then(unwrap<Record<string, any>>),
  updateZone: (layoutId: string, zoneId: string, input: Record<string, any>) => api.patch(`/ptw/map/layouts/${layoutId}/zones/${zoneId}`, input).then(unwrap<Record<string, any>>),
  deleteZone: (layoutId: string, zoneId: string) => api.delete(`/ptw/map/layouts/${layoutId}/zones/${zoneId}`).then(unwrap<{ deleted: boolean; id: string }>),
  markers: (layoutId: string) => api.get(`/ptw/map/layouts/${layoutId}/markers`).then(unwrap<Array<Record<string, any>>>),
  createMarker: (layoutId: string, input: Record<string, any>) => api.post(`/ptw/map/layouts/${layoutId}/markers`, input).then(unwrap<Record<string, any>>),
  updateMarker: (layoutId: string, markerId: string, input: Record<string, any>) => api.patch(`/ptw/map/layouts/${layoutId}/markers/${markerId}`, input).then(unwrap<Record<string, any>>),
  deleteMarker: (layoutId: string, markerId: string) => api.delete(`/ptw/map/layouts/${layoutId}/markers/${markerId}`).then(unwrap<{ deleted: boolean; id: string }>)
};
