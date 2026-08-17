create extension if not exists pgcrypto;

create table if not exists public.audit_evidence_records (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 equipment_id text,
 evidence_code text not null,
 evidence_title text not null,
 evidence_description text,
 evidence_type text not null,
 evidence_status text not null default 'Draft',
 review_status text not null default 'Not Required',
 readiness_status text not null default 'Not Ready',
 criticality text not null default 'Medium',
 confidentiality_level text not null default 'Internal',
 evidence_owner_user_id text references public."User"(id) on delete set null,
 reviewer_user_id text references public."User"(id) on delete set null,
 source_mode text not null default 'Text Evidence Note',
 document_id text,
 storage_file_id text,
 linked_module text,
 linked_record_id text,
 linked_record_title text,
 text_evidence_note text,
 external_reference text,
 evidence_date date,
 evidence_period_start date,
 evidence_period_end date,
 related_standard text,
 related_clause text,
 tags_json jsonb,
 access_restrictions_json jsonb,
 retention_requirement text,
 expires_at timestamptz,
 superseded_at timestamptz,
 superseded_by_evidence_id text references public.audit_evidence_records(id) on delete set null,
 redaction_required boolean not null default false,
 created_by text references public."User"(id) on delete set null,
 updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 verified_by text references public."User"(id) on delete set null,
 verified_at timestamptz,
 rejected_by text references public."User"(id) on delete set null,
 rejected_at timestamptz,
 rejection_reason text,
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text,
 archived_at timestamptz,
 archived_by text references public."User"(id) on delete set null,
 archive_reason text
);
create unique index if not exists audit_evidence_records_company_site_code_uidx on public.audit_evidence_records(company_id, coalesce(site_id,''), evidence_code);
create index if not exists audit_evidence_records_status_idx on public.audit_evidence_records(company_id, site_id, evidence_status);
create index if not exists audit_evidence_records_code_idx on public.audit_evidence_records(evidence_code);
create index if not exists audit_evidence_records_type_source_idx on public.audit_evidence_records(evidence_type, source_mode);
create index if not exists audit_evidence_records_document_idx on public.audit_evidence_records(document_id);
create index if not exists audit_evidence_records_module_record_idx on public.audit_evidence_records(linked_module, linked_record_id);

create table if not exists public.audit_evidence_requirements (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 requirement_code text,
 requirement_title text not null,
 requirement_type text not null default 'Manual Evidence Requirement',
 source_module text not null,
 source_record_id text not null,
 source_snapshot_json jsonb,
 required_evidence_type text,
 required_document_category text,
 required_source_module text,
 mandatory boolean not null default true,
 criticality text not null default 'Medium',
 due_date date,
 owner_user_id text references public."User"(id) on delete set null,
 reviewer_user_id text references public."User"(id) on delete set null,
 acceptance_criteria text,
 requirement_status text not null default 'Open',
 fulfilled_by_evidence_ids_json jsonb,
 waived boolean not null default false,
 waiver_reason text,
 waived_by text references public."User"(id) on delete set null,
 waived_at timestamptz,
 created_by text references public."User"(id) on delete set null,
 updated_by text references public."User"(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 cancelled_by text references public."User"(id) on delete set null,
 cancelled_at timestamptz,
 cancel_reason text
);
create index if not exists audit_evidence_requirements_status_idx on public.audit_evidence_requirements(company_id, site_id, requirement_status);
create index if not exists audit_evidence_requirements_source_idx on public.audit_evidence_requirements(source_module, source_record_id);

create table if not exists public.audit_evidence_links (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 evidence_id text not null references public.audit_evidence_records(id) on delete cascade,
 linked_object_type text not null,
 linked_module text not null,
 linked_record_id text not null,
 program_id text references public.audit_programs(id) on delete set null,
 plan_id text references public.audit_plans(id) on delete set null,
 checklist_id text references public.audit_checklist_templates(id) on delete set null,
 checklist_section_id text,
 checklist_item_id text,
 execution_id text references public.audit_executions(id) on delete set null,
 response_id text,
 field_finding_id text,
 finding_id text references public.audit_findings(id) on delete set null,
 capa_id text references public.audit_capa_packages(id) on delete set null,
 capa_action_id text references public.audit_capa_actions(id) on delete set null,
 action_engine_id text,
 requirement_id text references public.audit_evidence_requirements(id) on delete set null,
 primary_link boolean not null default false,
 link_reason text,
 source_snapshot_json jsonb,
 linked_by text references public."User"(id) on delete set null,
 linked_at timestamptz not null default now(),
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text
);
create index if not exists audit_evidence_links_evidence_idx on public.audit_evidence_links(evidence_id);
create index if not exists audit_evidence_links_module_record_idx on public.audit_evidence_links(linked_module, linked_record_id);
create index if not exists audit_evidence_links_finding_idx on public.audit_evidence_links(finding_id);
create index if not exists audit_evidence_links_capa_idx on public.audit_evidence_links(capa_id);
create index if not exists audit_evidence_links_execution_idx on public.audit_evidence_links(execution_id);

create table if not exists public.audit_evidence_requests (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 request_code text,
 request_title text not null,
 request_description text,
 source_module text not null,
 source_record_id text not null,
 requirement_id text references public.audit_evidence_requirements(id) on delete set null,
 requested_evidence_type text,
 requested_from_user_id text references public."User"(id) on delete set null,
 requested_from_role text,
 requested_from_department_id text,
 due_date date not null,
 priority text not null default 'Medium',
 criticality text not null default 'Medium',
 request_status text not null default 'Draft',
 reminder_settings_json jsonb,
 notes text,
 requested_by text references public."User"(id) on delete set null,
 requested_at timestamptz,
 acknowledged_by text references public."User"(id) on delete set null,
 acknowledged_at timestamptz,
 fulfilled_at timestamptz,
 cancelled_by text references public."User"(id) on delete set null,
 cancelled_at timestamptz,
 cancel_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists audit_evidence_requests_status_idx on public.audit_evidence_requests(company_id, site_id, request_status);
create index if not exists audit_evidence_requests_user_due_idx on public.audit_evidence_requests(requested_from_user_id, due_date);

create table if not exists public.audit_evidence_request_submissions (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 request_id text not null references public.audit_evidence_requests(id) on delete cascade,
 evidence_id text references public.audit_evidence_records(id) on delete set null,
 submitted_by text references public."User"(id) on delete set null,
 submitted_at timestamptz not null default now(),
 submission_note text,
 submission_status text not null default 'Submitted',
 reviewed_by text references public."User"(id) on delete set null,
 reviewed_at timestamptz,
 review_decision text,
 review_comment text,
 rework_instructions text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.audit_evidence_reviews (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 evidence_id text not null references public.audit_evidence_records(id) on delete cascade,
 review_decision text not null,
 review_status text not null default 'In Review',
 verification_method text,
 review_comment text,
 quality_rating text,
 missing_information text,
 rework_instructions text,
 reviewed_by text references public."User"(id) on delete set null,
 reviewed_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index if not exists audit_evidence_reviews_evidence_idx on public.audit_evidence_reviews(evidence_id, reviewed_at);

create table if not exists public.audit_evidence_chain_of_custody_events (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 evidence_id text not null references public.audit_evidence_records(id) on delete cascade,
 event_type text not null,
 event_title text not null,
 event_description text,
 actor_user_id text references public."User"(id) on delete set null,
 ip_address text,
 user_agent text,
 before_value_json jsonb,
 after_value_json jsonb,
 reason text,
 source_module text,
 source_record_id text,
 created_at timestamptz not null default now()
);
create index if not exists audit_evidence_custody_idx on public.audit_evidence_chain_of_custody_events(evidence_id, created_at);

create table if not exists public.audit_evidence_access_events (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 evidence_id text references public.audit_evidence_records(id) on delete cascade,
 document_id text,
 storage_file_id text,
 access_type text not null,
 access_status text not null default 'Allowed',
 accessed_by text references public."User"(id) on delete set null,
 accessed_at timestamptz not null default now(),
 denied_reason text,
 ip_address text,
 user_agent text,
 created_at timestamptz not null default now()
);
create index if not exists audit_evidence_access_idx on public.audit_evidence_access_events(evidence_id, accessed_at);

create table if not exists public.audit_evidence_gaps (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 source_module text not null,
 source_record_id text not null,
 requirement_id text references public.audit_evidence_requirements(id) on delete set null,
 gap_title text not null,
 gap_description text,
 gap_status text not null default 'Open',
 gap_severity text not null default 'Medium',
 criticality text not null default 'Medium',
 owner_user_id text references public."User"(id) on delete set null,
 due_date date,
 related_finding_id text references public.audit_findings(id) on delete set null,
 related_capa_id text references public.audit_capa_packages(id) on delete set null,
 action_id text,
 detected_at timestamptz not null default now(),
 resolved_by text references public."User"(id) on delete set null,
 resolved_at timestamptz,
 resolution_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists audit_evidence_gaps_status_idx on public.audit_evidence_gaps(company_id, site_id, gap_status);

create table if not exists public.audit_evidence_package_foundations (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 package_code text,
 package_title text not null,
 package_type text not null,
 source_module text not null,
 source_record_id text not null,
 package_status text not null default 'Draft',
 manifest_json jsonb,
 included_evidence_count integer not null default 0,
 excluded_evidence_count integer not null default 0,
 restricted_evidence_count integer not null default 0,
 prepared_by text references public."User"(id) on delete set null,
 prepared_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.audit_evidence_package_items (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 package_id text not null references public.audit_evidence_package_foundations(id) on delete cascade,
 evidence_id text not null references public.audit_evidence_records(id) on delete cascade,
 included boolean not null default true,
 excluded_reason text,
 confidentiality_level text,
 added_by text references public."User"(id) on delete set null,
 added_at timestamptz not null default now(),
 removed_by text references public."User"(id) on delete set null,
 removed_at timestamptz,
 remove_reason text
);

create table if not exists public.audit_evidence_history_events (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 unit_id text references public."Unit"(id) on delete set null,
 area_id text references public."Area"(id) on delete set null,
 program_id text references public.audit_programs(id) on delete set null,
 plan_id text references public.audit_plans(id) on delete set null,
 execution_id text references public.audit_executions(id) on delete set null,
 finding_id text references public.audit_findings(id) on delete set null,
 capa_id text references public.audit_capa_packages(id) on delete set null,
 evidence_id text references public.audit_evidence_records(id) on delete set null,
 requirement_id text references public.audit_evidence_requirements(id) on delete set null,
 request_id text references public.audit_evidence_requests(id) on delete set null,
 event_type text not null,
 event_title text not null,
 event_description text not null,
 before_value_json jsonb,
 after_value_json jsonb,
 actor_user_id text references public."User"(id) on delete set null,
 source_module text not null default 'Audit Evidence Collection',
 source_record_id text,
 created_at timestamptz not null default now()
);
create index if not exists audit_evidence_history_idx on public.audit_evidence_history_events(evidence_id, created_at);

create table if not exists public.audit_evidence_settings (
 id text primary key default gen_random_uuid()::text,
 company_id text not null references public."Tenant"(id) on delete cascade,
 site_id text references public."Site"(id) on delete set null,
 require_review_for_safety_critical_evidence boolean not null default true,
 require_review_for_regulatory_critical_evidence boolean not null default true,
 require_review_for_restricted_evidence boolean not null default true,
 allow_uploader_self_verification boolean not null default false,
 require_reason_for_evidence_removal boolean not null default true,
 require_reason_for_evidence_replacement boolean not null default true,
 track_preview_events boolean not null default true,
 track_download_events boolean not null default true,
 allow_external_reference_evidence boolean not null default true,
 allow_text_only_evidence boolean not null default true,
 allow_evidence_package_foundation boolean not null default true,
 auto_create_gap_for_missing_mandatory_evidence boolean not null default true,
 auto_update_source_readiness_on_review boolean not null default true,
 auto_notify_request_recipient boolean not null default true,
 auto_notify_reviewer boolean not null default true,
 auto_notify_owner_on_rejection boolean not null default true,
 settings_json jsonb,
 updated_by text references public."User"(id) on delete set null,
 updated_at timestamptz not null default now(),
 unique(company_id, site_id)
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'audit_evidence_records','audit_evidence_requirements','audit_evidence_links','audit_evidence_requests',
    'audit_evidence_request_submissions','audit_evidence_reviews','audit_evidence_chain_of_custody_events',
    'audit_evidence_access_events','audit_evidence_gaps','audit_evidence_package_foundations',
    'audit_evidence_package_items','audit_evidence_history_events','audit_evidence_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_isolation', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', table_name || '_tenant_isolation', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

do $$
declare tenant_id text;
declare permission_key text;
declare permission_label text;
begin
  for tenant_id in select id from public."Tenant" loop
    foreach permission_key, permission_label in array array[
      ['audit.evidence.view','View audit evidence'],
      ['audit.evidence.dashboard.view','View audit evidence dashboard'],
      ['audit.evidence.register.view','View audit evidence register'],
      ['audit.evidence.create','Create audit evidence'],
      ['audit.evidence.edit','Edit audit evidence'],
      ['audit.evidence.upload','Upload audit evidence'],
      ['audit.evidence.replace','Replace audit evidence'],
      ['audit.evidence.remove','Remove audit evidence'],
      ['audit.evidence.link_document','Link audit evidence document'],
      ['audit.evidence.link_module_record','Link audit evidence module record'],
      ['audit.evidence.preview','Preview audit evidence'],
      ['audit.evidence.download','Download audit evidence'],
      ['audit.evidence.view_restricted','View restricted audit evidence'],
      ['audit.evidence.manage_restricted','Manage restricted audit evidence'],
      ['audit.evidence.requirement.view','View audit evidence requirements'],
      ['audit.evidence.requirement.create','Create audit evidence requirements'],
      ['audit.evidence.requirement.edit','Edit audit evidence requirements'],
      ['audit.evidence.requirement.waive','Waive audit evidence requirements'],
      ['audit.evidence.request.view','View audit evidence requests'],
      ['audit.evidence.request.create','Create audit evidence requests'],
      ['audit.evidence.request.send','Send audit evidence requests'],
      ['audit.evidence.request.submit','Submit audit evidence request'],
      ['audit.evidence.request.cancel','Cancel audit evidence request'],
      ['audit.evidence.review.view','View audit evidence review'],
      ['audit.evidence.review.perform','Perform audit evidence review'],
      ['audit.evidence.verify','Verify audit evidence'],
      ['audit.evidence.reject','Reject audit evidence'],
      ['audit.evidence.request_rework','Request audit evidence rework'],
      ['audit.evidence.chain_of_custody.view','View audit evidence chain of custody'],
      ['audit.evidence.access_log.view','View audit evidence access log'],
      ['audit.evidence.package.view','View audit evidence packages'],
      ['audit.evidence.package.prepare','Prepare audit evidence packages'],
      ['audit.evidence.gap.view','View audit evidence gaps'],
      ['audit.evidence.gap.manage','Manage audit evidence gaps'],
      ['audit.evidence.history.view','View audit evidence history'],
      ['audit.evidence.settings.view','View audit evidence settings'],
      ['audit.evidence.settings.edit','Edit audit evidence settings']
    ] loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id, permission_key, 'AUDIT', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
