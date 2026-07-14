create index if not exists idx_incident_team_members_incident on public.incident_investigation_team_members(tenant_id, incident_id);
create index if not exists idx_incident_team_members_user on public.incident_investigation_team_members(tenant_id, user_id);
create index if not exists idx_incident_team_members_role on public.incident_investigation_team_members(tenant_id, incident_id, team_role);
create index if not exists idx_incident_team_roles_incident on public.incident_team_required_roles(tenant_id, incident_id);
create index if not exists idx_incident_team_sessions_incident on public.incident_team_sessions(tenant_id, incident_id);
create index if not exists idx_incident_team_notifications_incident on public.incident_team_notifications(tenant_id, incident_id);
