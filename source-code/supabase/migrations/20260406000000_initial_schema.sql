-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'learner' check (role in ('learner', 'creator', 'platform_admin')),
  skin_preference text default 'dark_vibrant',
  language_preference text default 'en',
  created_at timestamptz default now()
);

-- 2. Organizations table
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  domain text unique,
  domain_matching_enabled boolean default true,
  logo_url text,
  created_at timestamptz default now()
);

-- 3. Org members table
create table public.org_members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- 4. Waitlist table
create table public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  status text not null default 'pending' check (status in ('pending', 'invited', 'rejected')),
  invite_token text unique,
  created_at timestamptz default now(),
  invited_at timestamptz
);

-- 5. Trigger to handle new user registration (RF-01, RN-05)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  matching_org_id uuid;
  email_domain text;
begin
  -- 1. Create profile
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');

  -- 2. Domain matching for auto-join
  email_domain := split_part(new.email, '@', 2);
  
  select id into matching_org_id
  from public.organizations
  where domain = email_domain and domain_matching_enabled = true
  limit 1;

  if matching_org_id is not null then
    insert into public.org_members (org_id, user_id, role)
    values (matching_org_id, new.id, 'member')
    on conflict (org_id, user_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.waitlist enable row level security;

-- RLS Policies (Initial set)
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

create policy "Waitlist: platform_admin has full access." on public.waitlist
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'platform_admin'
    )
  );

create policy "Organizations: public view for matching." on public.organizations
  for select using (true);
