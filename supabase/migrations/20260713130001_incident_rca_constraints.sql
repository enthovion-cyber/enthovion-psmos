do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'incident_rca_incident_unique') then
    alter table public.incident_rca add constraint incident_rca_incident_unique unique (tenant_id, incident_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_rca_status_check') then
    alter table public.incident_rca add constraint incident_rca_status_check check (rca_status in ('Not Started','Required','In Progress','Review Requested','Approved','Rejected','Completed','Reopened','Not Required'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_rca_factor_status_check') then
    alter table public.incident_rca_causal_factors add constraint incident_rca_factor_status_check check (status in ('Draft','Hypothesis','Under investigation','Evidence required','Confirmed','Rejected','Superseded'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_rca_factor_evidence_check') then
    alter table public.incident_rca_causal_factors add constraint incident_rca_factor_evidence_check check (evidence_support_level is null or evidence_support_level in ('Strong evidence','Partial evidence','Weak evidence','Unsupported assumption','Disputed','Not determined'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_rca_root_capa_justification_check') then
    alter table public.incident_rca_root_causes add constraint incident_rca_root_capa_justification_check check (capa_required = true or nullif(capa_required_justification, '') is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_rca_root_evidence_check') then
    alter table public.incident_rca_root_causes add constraint incident_rca_root_evidence_check check (evidence_support_level is null or evidence_support_level in ('Strong evidence','Partial evidence','Weak evidence','Unsupported assumption','Disputed','Not determined'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incident_rca_root_systemic_element_check') then
    alter table public.incident_rca_root_causes add constraint incident_rca_root_systemic_element_check check (systemic_cause = false or nullif(management_system_element, '') is not null);
  end if;
end $$;
