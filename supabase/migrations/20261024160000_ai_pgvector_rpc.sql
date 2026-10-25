-- Phase 6: pgvector cosine similarity match function
create or replace function public.match_ai_knowledge_chunks (
  query_embedding vector(1536),
  match_threshold double precision,
  match_count int,
  filter_tenant_id text,
  filter_site_ids text[] default null
)
returns table (
  id text,
  tenant_id text,
  site_id text,
  record_type text,
  record_id text,
  revision text,
  page int,
  content text,
  similarity double precision
)
language plpgsql
stable
as $$
begin
  return query
  select
    c."id",
    c."tenantId" as tenant_id,
    c."siteId" as site_id,
    c."recordType" as record_type,
    c."recordId" as record_id,
    c."revision",
    c."page",
    c."content",
    1 - (c."embedding" <=> query_embedding) as similarity
  from public."AiKnowledgeChunk" c
  where c."tenantId" = filter_tenant_id
    and c."embedding" is not null
    and 1 - (c."embedding" <=> query_embedding) >= match_threshold
    and (
      filter_site_ids is null
      or c."siteId" is null
      or c."siteId" = any(filter_site_ids)
    )
  order by c."embedding" <=> query_embedding
  limit match_count;
end;
$$;
