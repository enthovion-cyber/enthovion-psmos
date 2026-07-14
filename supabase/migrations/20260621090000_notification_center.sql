create table if not exists notifications (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete set null,
  user_id text not null references "User"(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  module text not null,
  related_record_id text,
  related_record_type text,
  related_url text,
  priority text not null default 'Normal',
  status text not null default 'Unread',
  read_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notification_preferences (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  user_id text not null references "User"(id) on delete cascade,
  module text not null,
  event_type text not null,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  digest_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, module, event_type)
);

create table if not exists notification_deliveries (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  notification_id text not null references notifications(id) on delete cascade,
  channel text not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_logs (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  notification_id text references notifications(id) on delete set null,
  user_id text references "User"(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'queued',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sms_logs (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  notification_id text references notifications(id) on delete set null,
  user_id text references "User"(id) on delete set null,
  to_phone text not null,
  body text not null,
  status text not null default 'queued',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists notification_templates (
  id text primary key,
  tenant_id text references "Tenant"(id) on delete cascade,
  event_type text not null,
  module text not null,
  title_template text not null,
  message_template text not null,
  email_subject text,
  email_body text,
  sms_body text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, event_type)
);

create table if not exists notification_subscriptions (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  user_id text not null references "User"(id) on delete cascade,
  source_module text not null,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, source_module, source_record_id)
);

create index if not exists notifications_tenant_user_status_idx on notifications(tenant_id, user_id, status, created_at desc);
create index if not exists notifications_tenant_site_idx on notifications(tenant_id, site_id, created_at desc);
create index if not exists notifications_related_idx on notifications(tenant_id, module, related_record_id);
create index if not exists notification_deliveries_retry_idx on notification_deliveries(status, channel, attempts);
create index if not exists notification_preferences_user_idx on notification_preferences(user_id, module, event_type);

alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table notification_deliveries enable row level security;
alter table email_logs enable row level security;
alter table sms_logs enable row level security;
alter table notification_templates enable row level security;
alter table notification_subscriptions enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_notifications_manage', 'tenant_alkylation', 'notifications.manage', 'notifications', 'Manage Notifications'),
  ('perm_notifications_preferences', 'tenant_alkylation', 'notifications.preferences', 'notifications', 'Manage Notification Preferences'),
  ('perm_notifications_test', 'tenant_alkylation', 'notifications.test', 'notifications', 'Test Notification Channels')
on conflict (id) do update set key = excluded.key, label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
cross join "Permission" p
where r.id in ('role_platform_admin', 'role_corporate_admin', 'role_site_admin', 'role_hse_manager')
  and p.id in ('perm_notifications_view', 'perm_notifications_manage', 'perm_notifications_preferences', 'perm_notifications_test')
on conflict do nothing;

insert into notification_templates (id, tenant_id, event_type, module, title_template, message_template, email_subject, email_body, sms_body)
values
  ('ntpl_action_assigned', 'tenant_alkylation', 'action.assigned', 'actions', 'Action assigned', '{{actionNumber}} assigned: {{title}}', 'Action assigned: {{actionNumber}}', '{{message}}', '{{title}}'),
  ('ntpl_action_overdue', 'tenant_alkylation', 'action.overdue', 'actions', 'Action overdue', '{{actionNumber}} is overdue', 'Action overdue: {{actionNumber}}', '{{message}}', 'Overdue action {{actionNumber}}'),
  ('ntpl_equipment_safety_changed', 'tenant_alkylation', 'equipment.safety_critical.changed', 'equipment', 'Safety-critical equipment changed', '{{tag}} was updated', 'Safety-critical equipment changed', '{{message}}', '{{tag}} changed'),
  ('ntpl_equipment_qr_generated', 'tenant_alkylation', 'equipment.qr.generated', 'equipment', 'Equipment QR generated', 'QR generated for {{tag}}', 'Equipment QR generated', '{{message}}', '{{title}}'),
  ('ntpl_user_invited', 'tenant_alkylation', 'iam.user.invited', 'iam', 'User invited', '{{email}} was invited', 'PSM OS invitation', '{{message}}', '{{title}}'),
  ('ntpl_daily_digest', 'tenant_alkylation', 'system.daily_digest', 'system', 'Daily digest', 'Your daily PSM OS digest is ready', 'Daily PSM OS digest', '{{message}}', '{{title}}')
on conflict (id) do update set title_template = excluded.title_template, message_template = excluded.message_template, updated_at = now();

insert into notifications (id, tenant_id, company_id, site_id, user_id, title, message, type, module, related_record_id, related_record_type, related_url, priority, status)
values
  ('notif_demo_action_overdue', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'user_imran_shah', 'Action overdue', 'ACT-2026-000001 requires attention before escalation.', 'action.overdue', 'actions', 'action_p_101a_seal_followup', 'Action', '/actions/action_p_101a_seal_followup', 'High', 'Unread'),
  ('notif_demo_equipment_qr', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'user_imran_shah', 'QR generated', 'QR label generated for P-101A.', 'equipment.qr.generated', 'equipment', 'eq_p_101a', 'Equipment', '/equipment/eq_p_101a', 'Normal', 'Unread')
on conflict (id) do update set status = excluded.status, message = excluded.message;
