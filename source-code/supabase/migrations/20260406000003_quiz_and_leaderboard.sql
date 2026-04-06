-- Migration: Quiz Scoring and Leaderboard Snapshots (Sprint 5)
-- Description: Implements submit_quiz_attempt RPC and leaderboard snapshot logic.

-- 1. Create leaderboard_snapshots table
create table public.leaderboard_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('global', 'org', 'group')),
  scope_id uuid, -- org_id or group_id, null for global
  period text not null check (period in ('weekly', 'monthly', 'all_time')),
  period_key text not null, -- 'all' for all_time, '2026-W14' for weekly, etc.
  atoms_completed int not null default 0,
  rank int not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.leaderboard_snapshots enable row level security;

-- RLS Policies
create policy "Leaderboard snapshots are viewable by everyone." on public.leaderboard_snapshots
  for select using (true);

-- 2. Indices for performance
create index idx_leaderboard_snapshots_query on public.leaderboard_snapshots(scope, period, period_key, atoms_completed desc);
create index idx_leaderboard_snapshots_user_id on public.leaderboard_snapshots(user_id);

-- 3. RPC: submit_quiz_attempt
create or replace function public.submit_quiz_attempt(p_atom_id uuid, p_answers int[])
returns jsonb as $$
declare
  v_atom_content jsonb;
  v_questions jsonb;
  v_passing_score float;
  v_total_questions int;
  v_correct_count int := 0;
  v_correct_indices int[] := '{}';
  v_hints text[] := '{}';
  v_score float;
  v_passed boolean;
  v_completion_status jsonb := null;
  v_i int;
  v_correct_idx int;
begin
  -- 1. Get atom content
  select content into v_atom_content from public.atoms where id = p_atom_id and type = 'quiz';
  if v_atom_content is null then
    raise exception 'Quiz atom not found or not a quiz';
  end if;

  v_questions := v_atom_content->'questions';
  if v_questions is null or jsonb_array_length(v_questions) = 0 then
    raise exception 'Quiz has no questions';
  end if;
  
  v_passing_score := coalesce((v_atom_content->>'passing_score')::float, 0.8);
  v_total_questions := jsonb_array_length(v_questions);

  -- 2. Validate answers
  for v_i in 0..v_total_questions-1 loop
    v_correct_idx := (v_questions->v_i->>'correct_index')::int;
    v_correct_indices := v_correct_indices || v_correct_idx;
    
    -- Check if answer exists for this index (p_answers is 1-based in PL/pgSQL)
    if array_length(p_answers, 1) >= (v_i + 1) and p_answers[v_i + 1] = v_correct_idx then
      v_correct_count := v_correct_count + 1;
    else
      v_hints := v_hints || coalesce(v_questions->v_i->>'review_hint', '');
    end if;
  end loop;

  v_score := v_correct_count::float / v_total_questions;
  v_passed := v_score >= v_passing_score;

  -- 3. Mark complete if passed
  if v_passed then
    v_completion_status := public.mark_atom_complete(p_atom_id);
  end if;

  return jsonb_build_object(
    'score', v_score,
    'passed', v_passed,
    'correct_indices', v_correct_indices,
    'hints', v_hints,
    'completion_status', v_completion_status
  );
end;
$$ language plpgsql security definer;

-- 4. RPC: update_leaderboard (Simplified version for Sprint 5)
create or replace function public.update_leaderboard()
returns void as $$
begin
  -- Clear old snapshots (In a real scenario, we might keep history, but for now we refresh)
  delete from public.leaderboard_snapshots;

  -- Global All Time
  insert into public.leaderboard_snapshots (user_id, scope, period, period_key, atoms_completed, rank)
  select 
    user_id, 
    'global', 
    'all_time', 
    'all', 
    count(*),
    row_number() over (order by count(*) desc, user_id)
  from public.user_progress
  group by user_id;

  -- Org All Time
  insert into public.leaderboard_snapshots (user_id, scope, scope_id, period, period_key, atoms_completed, rank)
  select 
    om.user_id, 
    'org', 
    om.org_id,
    'all_time', 
    'all', 
    count(up.atom_id),
    row_number() over (partition by om.org_id order by count(up.atom_id) desc, om.user_id)
  from public.org_members om
  left join public.user_progress up on om.user_id = up.user_id
  group by om.org_id, om.user_id;

  -- Weekly Global
  insert into public.leaderboard_snapshots (user_id, scope, period, period_key, atoms_completed, rank)
  select 
    user_id, 
    'global', 
    'weekly', 
    to_char(now(), 'IYYY-"W"IW'), 
    count(*),
    row_number() over (order by count(*) desc, user_id)
  from public.user_progress
  where completed_at > now() - interval '7 days'
  group by user_id;
end;
$$ language plpgsql security definer;
