-- Migration: Progress Tracking (RF-04)
-- Description: Implements atoms, tracks, cells, user_progress, user_streaks and completion logic.

-- 1. Atoms table
create table public.atoms (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type text not null check (type in ('video', 'playbook', 'quiz', 'flashcard', 'task')),
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  language text not null default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tracks table
create table public.tracks (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'public' check (visibility in ('public', 'private', 'org_only')),
  language text not null default 'en',
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Cells table (Reusable across tracks)
create table public.cells (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4. Track-Cell relation (Ordered)
create table public.track_cells (
  id uuid primary key default uuid_generate_v4(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  cell_id uuid not null references public.cells(id) on delete cascade,
  position integer not null,
  unique(track_id, cell_id),
  unique(track_id, position)
);

-- 5. Cell-Atom relation (Ordered)
create table public.cell_atoms (
  id uuid primary key default uuid_generate_v4(),
  cell_id uuid not null references public.cells(id) on delete cascade,
  atom_id uuid not null references public.atoms(id) on delete cascade,
  position integer not null,
  is_required boolean default true,
  unique(cell_id, atom_id),
  unique(cell_id, position)
);

-- 6. User progress table (The core of Cross-Track Progress)
create table public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  atom_id uuid not null references public.atoms(id) on delete cascade,
  completed_at timestamptz default now(),
  -- RF-04: UNIQUE constraint ensures cross-track recognition
  unique(user_id, atom_id)
);

-- 7. User streaks table
create table public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  last_activity_at timestamptz,
  created_at timestamptz default now()
);

-- 8. Enable RLS
alter table public.atoms enable row level security;
alter table public.tracks enable row level security;
alter table public.cells enable row level security;
alter table public.track_cells enable row level security;
alter table public.cell_atoms enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_streaks enable row level security;

-- 9. RLS Policies
-- Atoms: Learners can read published atoms
create policy "Atoms: published are viewable by learners." on public.atoms
  for select using (status = 'published');

-- Atoms: Creators have full access to their own atoms
create policy "Atoms: creators can manage own atoms." on public.atoms
  for all using (auth.uid() = creator_id);

-- Tracks, Cells, Relations: similar visibility rules
create policy "Tracks: public are viewable." on public.tracks
  for select using (visibility = 'public' and status = 'published');

create policy "Tracks: creators can manage own." on public.tracks
  for all using (auth.uid() = creator_id);

create policy "Cells: viewable if creator or public track." on public.cells
  for select using (true); -- Simplified for now, should be linked to track visibility

create policy "Cells: creators can manage own." on public.cells
  for all using (auth.uid() = creator_id);

create policy "Relations: viewable by all." on public.track_cells for select using (true);
create policy "Relations: viewable by all." on public.cell_atoms for select using (true);

-- User Progress: Users can see and manage their own progress
create policy "User Progress: users can manage own progress." on public.user_progress
  for all using (auth.uid() = user_id);

-- User Progress: Creators can see progress on their atoms (for analytics)
create policy "User Progress: creators can view progress on own atoms." on public.user_progress
  for select using (
    exists (
      select 1 from public.atoms
      where id = user_progress.atom_id and creator_id = auth.uid()
    )
  );

-- User Streaks: Users can see their own streaks
create policy "User Streaks: users can view own streak." on public.user_streaks
  for select using (auth.uid() = user_id);

-- 10. RPC: mark_atom_complete
create or replace function public.mark_atom_complete(p_atom_id uuid)
returns void as $$
begin
  insert into public.user_progress (user_id, atom_id)
  values (auth.uid(), p_atom_id)
  on conflict (user_id, atom_id) do nothing;
end;
$$ language plpgsql security definer;

-- 11. Trigger: Update streaks on activity
create or replace function public.handle_user_activity_streak()
returns trigger as $$
declare
  v_last_activity date;
  v_today date := current_date;
begin
  select (last_activity_at at time zone 'utc')::date into v_last_activity
  from public.user_streaks
  where user_id = new.user_id;

  if v_last_activity is null then
    insert into public.user_streaks (user_id, current_streak, max_streak, last_activity_at)
    values (new.user_id, 1, 1, now())
    on conflict (user_id) do update
    set current_streak = 1, max_streak = greatest(user_streaks.max_streak, 1), last_activity_at = now();
  elsif v_last_activity = v_today then
    update public.user_streaks
    set last_activity_at = now()
    where user_id = new.user_id;
  elsif v_last_activity = v_today - interval '1 day' then
    update public.user_streaks
    set current_streak = current_streak + 1,
        max_streak = greatest(max_streak, current_streak + 1),
        last_activity_at = now()
    where user_id = new.user_id;
  else
    update public.user_streaks
    set current_streak = 1,
        last_activity_at = now()
    where user_id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_progress_created
  after insert on public.user_progress
  for each row execute procedure public.handle_user_activity_streak();

-- 12. Indices
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_atoms_creator_id on public.atoms(creator_id);
create index idx_atoms_status_language on public.atoms(status, language);
create index idx_tracks_search on public.tracks using gin(search_vector);
create index idx_track_cells_track_id on public.track_cells(track_id);
create index idx_cell_atoms_cell_id on public.cell_atoms(cell_id);

-- 13. Search Vector Trigger
create or replace function public.tracks_search_vector_update()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end;
$$ language plpgsql;

create trigger on_track_upsert_search_vector
  before insert or update on public.tracks
  for each row execute procedure public.tracks_search_vector_update();

-- 14. Dashboard RPCs
-- Get main stats for the dashboard
create or replace function public.get_dashboard_stats()
returns jsonb as $$
declare
  v_streak integer;
  v_atoms_completed bigint;
begin
  select current_streak into v_streak
  from public.user_streaks
  where user_id = auth.uid();

  select count(*) into v_atoms_completed
  from public.user_progress
  where user_id = auth.uid();

  return jsonb_build_object(
    'current_streak', coalesce(v_streak, 0),
    'atoms_completed', v_atoms_completed
  );
end;
$$ language plpgsql security definer;

-- Get weekly activity for heatmap (last 7 days)
create or replace function public.get_weekly_activity()
returns table(activity_date date, completion_count bigint) as $$
begin
  return query
  select (completed_at at time zone 'utc')::date as activity_date, count(*) as completion_count
  from public.user_progress
  where user_id = auth.uid()
    and completed_at > now() - interval '7 days'
  group by activity_date
  order by activity_date desc;
end;
$$ language plpgsql security definer;

