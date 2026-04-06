-- Migration: AI Pipeline, Billing & Notifications (Sprint 7)
-- Description: Tables for wizard drafts, AI jobs, notifications, certificates, and billing updates.

-- 1. Track Drafts (Wizard Step 1-7 Persistence)
create table public.track_drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  description text,
  language text default 'en',
  visibility text default 'public',
  thumbnail_url text,
  steps_data jsonb default '{}'::jsonb,
  current_step integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. AI Jobs (Tracking background generation)
create table public.ai_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_draft_id uuid references public.track_drafts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  job_type text not null check (job_type in ('fragmentation', 'generation', 'copilot')),
  payload jsonb default '{}'::jsonb,
  result jsonb default '{}'::jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Notifications (RF-17)
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('invite', 'track_assigned', 'breaking_change', 'creator_approved', 'creator_rejected', 'track_completion', 'cert_outdated')),
  title text not null,
  message text not null,
  link text,
  is_read boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4. Certificates (RF-18)
create table public.certificates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  issued_at timestamptz default now(),
  is_outdated boolean default false,
  share_token uuid default uuid_generate_v4() unique,
  metadata jsonb default '{}'::jsonb,
  unique(user_id, track_id)
);

-- 5. Update org_track_assignments for billing
alter table public.org_track_assignments
  add column status text not null default 'pending' check (status in ('pending', 'active', 'expired')),
  add column stripe_session_id text,
  add column seat_count integer default 1;

-- 6. RLS
alter table public.track_drafts enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.notifications enable row level security;
alter table public.certificates enable row level security;

create policy "Track Drafts: users can manage own drafts." on public.track_drafts
  for all using (auth.uid() = user_id);

create policy "AI Jobs: users can view own jobs." on public.ai_jobs
  for select using (auth.uid() = user_id);

create policy "Notifications: users can manage own notifications." on public.notifications
  for all using (auth.uid() = user_id);

create policy "Certificates: users can view own certificates." on public.certificates
  for select using (auth.uid() = user_id);

create policy "Certificates: public view for sharing." on public.certificates
  for select using (true); -- Public verification

-- 7. Trigger: Issue certificate on track completion
-- This requires checking if all atoms in a track are completed by the user.

create or replace function public.check_track_completion_and_issue_cert()
returns trigger as $$
declare
  v_track_id uuid;
  v_atoms_required bigint;
  v_atoms_completed bigint;
begin
  -- Find all tracks that contain the completed atom
  for v_track_id in 
    select distinct tc.track_id 
    from public.track_cells tc
    join public.cell_atoms ca on ca.cell_id = tc.cell_id
    where ca.atom_id = new.atom_id
  loop
    -- Count required atoms in track
    select count(distinct ca.atom_id) into v_atoms_required
    from public.track_cells tc
    join public.cell_atoms ca on ca.cell_id = tc.cell_id
    where tc.track_id = v_track_id and ca.is_required = true;

    -- Count atoms completed by user in this track
    select count(distinct up.atom_id) into v_atoms_completed
    from public.user_progress up
    join public.cell_atoms ca on ca.atom_id = up.atom_id
    join public.track_cells tc on tc.cell_id = ca.cell_id
    where tc.track_id = v_track_id 
      and up.user_id = new.user_id
      and ca.is_required = true;

    -- If completed all, issue certificate
    if v_atoms_completed >= v_atoms_required then
      insert into public.certificates (user_id, track_id)
      values (new.user_id, v_track_id)
      on conflict (user_id, track_id) do nothing;
      
      -- Notify user
      insert into public.notifications (user_id, type, title, message, link)
      values (
        new.user_id, 
        'track_completion', 
        'Track Complete!', 
        'You have completed the track and earned a certificate.',
        '/certificates'
      );
    end if;
  end loop;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_progress_issue_cert
  after insert on public.user_progress
  for each row execute procedure public.check_track_completion_and_issue_cert();

-- 8. RPC: issue_certificate (manual fallback or explicit call)
create or replace function public.issue_certificate(p_track_id uuid)
returns void as $$
begin
  insert into public.certificates (user_id, track_id)
  values (auth.uid(), p_track_id)
  on conflict (user_id, track_id) do nothing;
end;
$$ language plpgsql security definer;

-- 9. Indices
create index idx_track_drafts_user_id on public.track_drafts(user_id);
create index idx_ai_jobs_user_id on public.ai_jobs(user_id);
create index idx_notifications_user_id_unread on public.notifications(user_id) where is_read = false;
create index idx_certificates_user_id on public.certificates(user_id);
create index idx_certificates_share_token on public.certificates(share_token);
