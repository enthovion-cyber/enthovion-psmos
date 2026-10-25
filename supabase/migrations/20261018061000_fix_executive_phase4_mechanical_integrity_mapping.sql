-- Phase 4 stores module keys, which must match the aggregation adapter registry.
-- Earlier Phase 4 installs used an underscore while the registered module key uses a hyphen.
update public.executive_psm_element_module_mappings
set source_module = 'mechanical-integrity',
    updated_at = now()
where source_module = 'mechanical_integrity';

-- Retain only the newest score for each element and scope from earlier releases
-- that appended a score on every aggregation run.
with ranked_scores as (
  select id,
         row_number() over (
           partition by company_id, element_id, coalesce(site_id, ''), coalesce(unit_id, '')
           order by calculated_at desc, created_at desc
         ) as row_number
  from public.executive_psm_element_scores
), obsolete_scores as (
  select id from ranked_scores where row_number > 1
)
delete from public.executive_psm_element_gaps
where element_score_id in (select id from obsolete_scores);

with ranked_scores as (
  select id,
         row_number() over (
           partition by company_id, element_id, coalesce(site_id, ''), coalesce(unit_id, '')
           order by calculated_at desc, created_at desc
         ) as row_number
  from public.executive_psm_element_scores
)
delete from public.executive_psm_element_scores
where id in (select id from ranked_scores where row_number > 1);

create unique index if not exists executive_psm_element_score_current_scope_unique
on public.executive_psm_element_scores (
  company_id,
  element_id,
  coalesce(site_id, ''),
  coalesce(unit_id, '')
);
