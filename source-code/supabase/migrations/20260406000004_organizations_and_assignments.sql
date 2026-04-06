-- Migration: Organizations and Assignments (RF-12)
-- Description: Implements org teams, team members, track assignments and related RPCs.

-- 1. Org teams table
create table public.org_teams (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  unique(org_id, name)
);

-- 2. Org team members table
create table public.org_team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.org_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(team_id, user_id)
);

-- 3. Org track assignments table
create table public.org_track_assignments (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete cascade,
  assigned_to_type text not null check (assigned_to_type in ('user', 'team')),
  assigned_to_id uuid not null, -- Can be user_id or team_id
  deadline_at timestamptz,
  created_at timestamptz default now()
);

-- 4. Enable RLS
alter table public.org_teams enable row level security;
alter table public.org_team_members enable row level security;
alter table public.org_track_assignments enable row level security;

-- 5. RLS Policies

-- Helper function to check if user is admin/owner of an organization
create or replace function public.is_org_admin(p_org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.org_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
end;
$$ language plpgsql security definer;

-- Org Teams: members can view, admins can manage
create policy "Org Teams: members can view." on public.org_teams
  for select using (
    exists (
      select 1 from public.org_members
      where org_id = org_teams.org_id and user_id = auth.uid()
    )
  );

create policy "Org Teams: admins can manage." on public.org_teams
  for all using (public.is_org_admin(org_id));

-- Org Team Members: members of the org can view, admins can manage
create policy "Org Team Members: members can view." on public.org_team_members
  for select using (
    exists (
      select 1 from public.org_teams t
      join public.org_members m on m.org_id = t.org_id
      where t.id = org_team_members.team_id and m.user_id = auth.uid()
    )
  );

create policy "Org Team Members: admins can manage." on public.org_team_members
  for all using (
    exists (
      select 1 from public.org_teams
      where id = team_id and public.is_org_admin(org_id)
    )
  );

-- Org Track Assignments: users can see their own assignments (direct or via team), admins can manage
create policy "Org Track Assignments: users can view own." on public.org_track_assignments
  for select using (
    (assigned_to_type = 'user' and assigned_to_id = auth.uid())
    or
    (assigned_to_type = 'team' and exists (
      select 1 from public.org_team_members
      where team_id = assigned_to_id and user_id = auth.uid()
    ))
    or
    public.is_org_admin(org_id)
  );

create policy "Org Track Assignments: admins can manage." on public.org_track_assignments
  for all using (public.is_org_admin(org_id));

-- 6. RPC: get_org_dashboard_stats
create or replace function public.get_org_dashboard_stats(p_org_id uuid, p_period text default '30d')
returns jsonb as $$
declare
  v_total_members bigint;
  v_active_learners bigint;
  v_completions bigint;
  v_start_date timestamptz;
begin
  -- Verify admin access
  if not public.is_org_admin(p_org_id) then
    raise exception 'Unauthorized';
  end if;

  v_start_date := case 
    when p_period = '7d' then now() - interval '7 days'
    when p_period = '30d' then now() - interval '30 days'
    when p_period = '90d' then now() - interval '90 days'
    else now() - interval '30 days'
  end;

  select count(*) into v_total_members
  from public.org_members
  where org_id = p_org_id;

  select count(distinct user_id) into v_active_learners
  from public.user_progress up
  join public.org_members om on om.user_id = up.user_id
  where om.org_id = p_org_id
    and up.completed_at >= v_start_date;

  select count(*) into v_completions
  from public.user_progress up
  join public.org_members om on om.user_id = up.user_id
  where om.org_id = p_org_id
    and up.completed_at >= v_start_date;

  return jsonb_build_object(
    'total_members', v_total_members,
    'active_learners', v_active_learners,
    'completions', v_completions,
    'period', p_period
  );
end;
$$ language plpgsql security definer;

-- 7. RPC: get_org_members
create or replace function public.get_org_members(p_org_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  role text,
  joined_at timestamptz
) as $$
begin
  -- Verify member access
  if not exists (select 1 from public.org_members where org_id = p_org_id and user_id = auth.uid()) then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    m.user_id,
    p.display_name,
    p.avatar_url,
    m.role,
    m.created_at as joined_at
  from public.org_members m
  join public.profiles p on p.id = m.user_id
  where m.org_id = p_org_id
  order by m.role desc, p.display_name asc;
end;
$$ language plpgsql security definer;

-- 8. RPC: assign_track
create or replace function public.assign_track(
  p_org_id uuid,
  p_track_id uuid,
  p_assigned_to_type text,
  p_assigned_to_id uuid,
  p_deadline_at timestamptz default null
)
returns uuid as $$
declare
  v_assignment_id uuid;
begin
  -- Verify admin access
  if not public.is_org_admin(p_org_id) then
    raise exception 'Unauthorized';
  end if;

  insert into public.org_track_assignments (
    org_id,
    track_id,
    assigned_by,
    assigned_to_type,
    assigned_to_id,
    deadline_at
  )
  values (
    p_org_id,
    p_track_id,
    auth.uid(),
    p_assigned_to_type,
    p_assigned_to_id,
    p_deadline_at
  )
  returning id into v_assignment_id;

  return v_assignment_id;
end;
$$ language plpgsql security definer;

-- 9. RPC: get_recent_org_activity
create or replace function public.get_recent_org_activity(p_org_id uuid, p_limit integer default 10)
returns table (
  user_id uuid,
  display_name text,
  atom_id uuid,
  atom_title text,
  completed_at timestamptz
) as $$
begin
  -- Verify member access
  if not exists (select 1 from public.org_members where org_id = p_org_id and user_id = auth.uid()) then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    up.user_id,
    p.display_name,
    up.atom_id,
    a.title as atom_title,
    up.completed_at
  from public.user_progress up
  join public.profiles p on p.id = up.user_id
  join public.atoms a on a.id = up.atom_id
  join public.org_members om on om.user_id = up.user_id
  where om.org_id = p_org_id
  order by up.completed_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;

-- 10. Indices
create index idx_org_teams_org_id on public.org_teams(org_id);
create index idx_org_team_members_team_id on public.org_team_members(team_id);
create index idx_org_team_members_user_id on public.org_team_members(user_id);
create index idx_org_track_assignments_org_id on public.org_track_assignments(org_id);
create index idx_org_track_assignments_assigned_to on public.org_track_assignments(assigned_to_type, assigned_to_id);
