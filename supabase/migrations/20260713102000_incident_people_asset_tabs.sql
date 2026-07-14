alter table public.incidents
  add column if not exists people_review_status text,
  add column if not exists people_review_requested_by text,
  add column if not exists people_review_requested_at timestamptz,
  add column if not exists people_review_decision text,
  add column if not exists people_review_decided_by text,
  add column if not exists people_review_decided_at timestamptz,
  add column if not exists people_review_reason text,
  add column if not exists asset_review_status text,
  add column if not exists asset_review_requested_by text,
  add column if not exists asset_review_requested_at timestamptz,
  add column if not exists asset_review_decision text,
  add column if not exists asset_review_decided_by text,
  add column if not exists asset_review_decided_at timestamptz,
  add column if not exists asset_review_reason text;

alter table public.incident_people_initial
  add column if not exists visitor_company text,
  add column if not exists public_involved boolean not null default false,
  add column if not exists injury_severity text,
  add column if not exists lost_time_days integer,
  add column if not exists restricted_work_days integer,
  add column if not exists work_restriction_notes text,
  add column if not exists return_to_work_status text,
  add column if not exists ppe_description text,
  add column if not exists control_failure_notes text,
  add column if not exists exposure_duration text,
  add column if not exists dose_estimate text,
  add column if not exists medical_notes text,
  add column if not exists review_status text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz;

alter table public.incident_equipment_chemical_initial
  add column if not exists equipment_location text,
  add column if not exists condition_at_event text,
  add column if not exists operating_status text,
  add column if not exists failure_mode text,
  add column if not exists damage_description text,
  add column if not exists last_inspection_date date,
  add column if not exists inspection_due date,
  add column if not exists proof_test_due date,
  add column if not exists sds_available boolean,
  add column if not exists hazard_classification text,
  add column if not exists release_duration text,
  add column if not exists containment_status text,
  add column if not exists followup_required boolean not null default false,
  add column if not exists review_status text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz;

create index if not exists idx_incident_people_initial_review on public.incident_people_initial(tenant_id, incident_id, review_status);
create index if not exists idx_incident_equipment_chemical_initial_review on public.incident_equipment_chemical_initial(tenant_id, incident_id, review_status);

do $$
declare
  tenant_record record;
  permission_row text[];
  permission_label text;
  permission_rows text[][] := array[
    array['incidents.people.view','View incident people/injury/exposure'],
    array['incidents.people.edit','Edit incident people/injury/exposure'],
    array['incidents.people.delete','Delete incident people/injury/exposure'],
    array['incidents.people.review.request','Request people/injury review'],
    array['incidents.people.review.approve','Approve people/injury review'],
    array['incidents.people.review.reject','Reject people/injury review'],
    array['incidents.injury.view','View incident injury details'],
    array['incidents.injury.edit','Edit incident injury details'],
    array['incidents.exposure.view','View incident exposure details'],
    array['incidents.exposure.edit','Edit incident exposure details'],
    array['incidents.assets.view','View incident asset/equipment/chemical'],
    array['incidents.assets.edit','Edit incident asset/equipment/chemical'],
    array['incidents.assets.delete','Delete incident asset/equipment/chemical'],
    array['incidents.sds.view','View incident SDS information'],
    array['incidents.release.view','View incident release details'],
    array['incidents.release.edit','Edit incident release details'],
    array['incidents.safeguards.view','View incident safeguard involvement'],
    array['incidents.safeguards.edit','Edit incident safeguard involvement'],
    array['incidents.asset.review.request','Request asset/chemical review'],
    array['incidents.asset.review.approve','Approve asset/chemical review'],
    array['incidents.asset.review.reject','Reject asset/chemical review'],
    array['incidents.followups.create','Create incident follow-up actions']
  ];
begin
  for tenant_record in select id from public."Tenant" loop
    foreach permission_row slice 1 in array permission_rows loop
      permission_label := permission_row[2];
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_row[1], 'INCIDENTS', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_row[1]
      );
    end loop;
  end loop;
end $$;
