create index if not exists idx_incident_immediate_actions_initial_status on public.incident_immediate_actions_initial(tenant_id, incident_id, status);
create index if not exists idx_incident_immediate_actions_initial_owner on public.incident_immediate_actions_initial(tenant_id, owner_id);
create index if not exists idx_incident_immediate_actions_initial_expiry on public.incident_immediate_actions_initial(tenant_id, temporary_control_expiry);
create index if not exists idx_incident_restart_controls_incident on public.incident_restart_controls(tenant_id, incident_id);
create index if not exists idx_incident_restart_controls_status on public.incident_restart_controls(tenant_id, restart_blocked, approval_status);
