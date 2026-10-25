-- Migration: 20261023230000_incident_capa_action_center_and_moc.sql
-- Description: Connects Incident CAPA to Action Center and adds 1-click MOC tracking

ALTER TABLE public.incident_capa_items
  ADD COLUMN IF NOT EXISTS moc_id text,
  ADD COLUMN IF NOT EXISTS moc_number text,
  ADD COLUMN IF NOT EXISTS action_number_snapshot text,
  ADD COLUMN IF NOT EXISTS action_center_synced_at timestamptz;

-- Add index on universal_action_id for fast lookup in Action Center
CREATE INDEX IF NOT EXISTS idx_incident_capa_items_universal_action_id
  ON public.incident_capa_items(universal_action_id);

-- Add index on moc_id
CREATE INDEX IF NOT EXISTS idx_incident_capa_items_moc_id
  ON public.incident_capa_items(moc_id);

-- Add index on incident_linked_records module and record_id
CREATE INDEX IF NOT EXISTS idx_incident_linked_records_module_record
  ON public.incident_linked_records(module, record_id);
