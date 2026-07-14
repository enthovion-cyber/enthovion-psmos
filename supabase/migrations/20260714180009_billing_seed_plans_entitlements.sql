insert into public.subscription_plans (name, code, description, plan_type, status, public_visible, sort_order, trial_days, default_currency)
values
  ('Trial', 'trial', 'Limited trial access for workspace evaluation.', 'trial', 'active', true, 10, 14, 'USD'),
  ('Starter', 'starter', 'Small team plan with core PSM modules and basic reports.', 'starter', 'active', true, 20, null, 'USD'),
  ('Pro', 'pro', 'Full PSM operations plan with reports, exports, and standard storage.', 'pro', 'active', true, 30, null, 'USD'),
  ('Enterprise', 'enterprise', 'Custom enterprise plan with all modules and advanced support.', 'enterprise', 'active', true, 40, null, 'USD'),
  ('Custom', 'custom', 'Company-specific custom billing and entitlements.', 'custom', 'active', false, 50, null, 'USD')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  plan_type = excluded.plan_type,
  status = excluded.status,
  public_visible = excluded.public_visible,
  sort_order = excluded.sort_order,
  trial_days = excluded.trial_days,
  updated_at = now();

insert into public.subscription_plan_prices (plan_id, currency, billing_interval, amount_cents, seat_pricing_type, status)
select id, 'USD', 'monthly',
  case code when 'trial' then 0 when 'starter' then 29900 when 'pro' then 99900 when 'enterprise' then 0 else 0 end,
  case code when 'enterprise' then 'custom' when 'custom' then 'custom' else 'fixed' end,
  'active'
from public.subscription_plans
where code in ('trial','starter','pro','enterprise','custom')
on conflict (plan_id, currency, billing_interval) do update set
  amount_cents = excluded.amount_cents,
  seat_pricing_type = excluded.seat_pricing_type,
  status = excluded.status,
  updated_at = now();

with plan_rows as (
  select id, code from public.subscription_plans where code in ('trial','starter','pro','enterprise','custom')
),
entitlements(plan_code, entitlement_key, entitlement_type, enabled, limit_value, limit_unit, config_json) as (
  values
    ('trial','module.dashboard','module',true,null,null,'{"upgradeMessage":"Trial includes dashboard access."}'::jsonb),
    ('trial','module.ptw','module',true,null,null,'{}'::jsonb),
    ('trial','module.moc','module',true,null,null,'{}'::jsonb),
    ('trial','module.pssr','module',false,null,null,'{"disabledReason":"Upgrade to Pro for PSSR."}'::jsonb),
    ('trial','module.hazop','module',false,null,null,'{"disabledReason":"Upgrade to Pro for HAZOP/PHA."}'::jsonb),
    ('trial','module.lopa','module',false,null,null,'{"disabledReason":"Upgrade to Pro for LOPA/SIL."}'::jsonb),
    ('trial','module.incidents','module',true,null,null,'{}'::jsonb),
    ('trial','module.equipment','module',true,null,null,'{}'::jsonb),
    ('trial','module.documents','module',true,null,null,'{}'::jsonb),
    ('trial','module.reports','module',false,null,null,'{}'::jsonb),
    ('trial','limit.seats','limit',true,5,'users','{}'::jsonb),
    ('trial','limit.sites','limit',true,1,'sites','{}'::jsonb),
    ('trial','limit.storage','storage',true,5,'GB','{}'::jsonb),
    ('trial','limit.exports.monthly','export',true,5,'exports','{}'::jsonb),
    ('starter','module.dashboard','module',true,null,null,'{}'::jsonb),
    ('starter','module.ptw','module',true,null,null,'{}'::jsonb),
    ('starter','module.moc','module',true,null,null,'{}'::jsonb),
    ('starter','module.pssr','module',true,null,null,'{}'::jsonb),
    ('starter','module.hazop','module',false,null,null,'{"disabledReason":"Upgrade to Pro for HAZOP/PHA."}'::jsonb),
    ('starter','module.lopa','module',false,null,null,'{"disabledReason":"Upgrade to Pro for LOPA/SIL."}'::jsonb),
    ('starter','module.incidents','module',true,null,null,'{}'::jsonb),
    ('starter','module.equipment','module',true,null,null,'{}'::jsonb),
    ('starter','module.documents','module',true,null,null,'{}'::jsonb),
    ('starter','module.reports','module',true,null,null,'{}'::jsonb),
    ('starter','limit.seats','limit',true,15,'users','{}'::jsonb),
    ('starter','limit.sites','limit',true,2,'sites','{}'::jsonb),
    ('starter','limit.storage','storage',true,25,'GB','{}'::jsonb),
    ('starter','limit.exports.monthly','export',true,25,'exports','{}'::jsonb),
    ('pro','module.dashboard','module',true,null,null,'{}'::jsonb),
    ('pro','module.ptw','module',true,null,null,'{}'::jsonb),
    ('pro','module.moc','module',true,null,null,'{}'::jsonb),
    ('pro','module.pssr','module',true,null,null,'{}'::jsonb),
    ('pro','module.hazop','module',true,null,null,'{}'::jsonb),
    ('pro','module.lopa','module',true,null,null,'{}'::jsonb),
    ('pro','module.incidents','module',true,null,null,'{}'::jsonb),
    ('pro','module.equipment','module',true,null,null,'{}'::jsonb),
    ('pro','module.documents','module',true,null,null,'{}'::jsonb),
    ('pro','module.reports','module',true,null,null,'{}'::jsonb),
    ('pro','module.signatures','module',true,null,null,'{}'::jsonb),
    ('pro','module.actions','module',true,null,null,'{}'::jsonb),
    ('pro','limit.seats','limit',true,50,'users','{}'::jsonb),
    ('pro','limit.sites','limit',true,5,'sites','{}'::jsonb),
    ('pro','limit.storage','storage',true,100,'GB','{}'::jsonb),
    ('pro','limit.exports.monthly','export',true,250,'exports','{}'::jsonb),
    ('enterprise','module.dashboard','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.ptw','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.moc','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.pssr','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.hazop','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.lopa','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.incidents','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.equipment','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.documents','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.reports','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.signatures','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.actions','module',true,null,null,'{}'::jsonb),
    ('enterprise','module.api','module',true,null,null,'{}'::jsonb),
    ('enterprise','limit.seats','limit',true,null,'users','{"unlimited":true}'::jsonb),
    ('enterprise','limit.sites','limit',true,null,'sites','{"unlimited":true}'::jsonb),
    ('enterprise','limit.storage','storage',true,null,'GB','{"unlimited":true}'::jsonb),
    ('enterprise','limit.exports.monthly','export',true,null,'exports','{"unlimited":true}'::jsonb)
)
insert into public.subscription_plan_entitlements (plan_id, entitlement_key, entitlement_type, enabled, limit_value, limit_unit, config_json)
select p.id, e.entitlement_key, e.entitlement_type, e.enabled, e.limit_value, e.limit_unit, e.config_json
from entitlements e
join plan_rows p on p.code = e.plan_code
on conflict (plan_id, entitlement_key) do update set
  entitlement_type = excluded.entitlement_type,
  enabled = excluded.enabled,
  limit_value = excluded.limit_value,
  limit_unit = excluded.limit_unit,
  config_json = excluded.config_json,
  updated_at = now();

do $$
declare
  permission_key text;
  permission_label text;
begin
  for permission_key, permission_label in
    select * from (values
      ('billing.view','View billing'),
      ('billing.manage','Manage billing'),
      ('billing.checkout','Start billing checkout'),
      ('billing.plan.view','View billing plans'),
      ('billing.plan.change','Change subscription plan'),
      ('billing.cancel','Cancel subscription'),
      ('billing.reactivate','Reactivate subscription'),
      ('billing.payment_method.view','View payment methods'),
      ('billing.payment_method.manage','Manage payment methods'),
      ('billing.invoice.view','View invoices'),
      ('billing.invoice.download','Download invoices'),
      ('billing.usage.view','View billing usage'),
      ('billing.usage.export','Export billing usage'),
      ('billing.audit.view','View billing audit'),
      ('entitlements.view','View company entitlements'),
      ('entitlements.manage','Manage company entitlements'),
      ('entitlements.override','Override company entitlements'),
      ('platform.billing.view','View platform billing'),
      ('platform.billing.manage','Manage platform billing'),
      ('platform.plans.view','View platform plans'),
      ('platform.plans.manage','Manage platform plans'),
      ('platform.webhooks.view','View billing webhooks'),
      ('platform.webhooks.replay','Replay billing webhooks')
    ) as p(key, label)
  loop
    insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
    select gen_random_uuid()::text, t."id", permission_key, 'BILLING', permission_label
    from public."Tenant" t
    where not exists (
      select 1 from public."Permission" existing
      where existing."tenantId" = t."id" and existing."key" = permission_key
    );
  end loop;
end $$;
