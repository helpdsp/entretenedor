-- Migration: Similarity Search with pg_trgm (Sprint 8)
-- Description: Enables pg_trgm for similarity search on atoms to avoid content duplication.

-- 1. Enable pg_trgm extension
create extension if not exists pg_trgm;

-- 2. Add GIN index to atoms(title) for fast similarity search
create index if not exists idx_atoms_title_trgm on public.atoms using gin (title gin_trgm_ops);

-- 3. RPC: check_reutilization
-- Returns existing atoms that are highly similar to the proposed title.
create or replace function public.check_reutilization(p_title text, p_similarity_threshold float default 0.3)
returns table (
  id uuid,
  title text,
  type text,
  similarity float
) as $$
begin
  return query
  select 
    a.id, 
    a.title, 
    a.type, 
    similarity(a.title, p_title) as similarity
  from 
    public.atoms a
  where 
    similarity(a.title, p_title) > p_similarity_threshold
  order by 
    similarity desc
  limit 5;
end;
$$ language plpgsql security definer;

-- 4. RPC: get_similar_tracks
-- For finding related content or avoiding duplicate tracks.
create or replace function public.get_similar_tracks(p_title text, p_similarity_threshold float default 0.3)
returns table (
  id uuid,
  title text,
  similarity float
) as $$
begin
  return query
  select 
    t.id, 
    t.title, 
    similarity(t.title, p_title) as similarity
  from 
    public.tracks t
  where 
    similarity(t.title, p_title) > p_similarity_threshold
  order by 
    similarity desc
  limit 5;
end;
$$ language plpgsql security definer;
