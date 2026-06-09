-- ============================================================
-- PG Manager — Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text unique not null,
  full_name   text,
  role        text not null default 'staff' check (role in ('superadmin', 'staff')),
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── PGS ──────────────────────────────────────────────────────
create table if not exists pgs (
  id               uuid default uuid_generate_v4() primary key,
  name             text not null,
  owner_name       text not null,
  owner_phone      text not null,
  owner_email      text,
  location         text not null,
  area_sqft        numeric,
  bhk_type         text,
  rooms_available  integer default 0,
  rent             numeric not null,
  deposit          numeric,
  amenities        text[] default '{}',
  status           text not null default 'active' check (status in ('active', 'inactive')),
  images           text[] default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── ROOMS ────────────────────────────────────────────────────
create table if not exists rooms (
  id             uuid default uuid_generate_v4() primary key,
  pg_id          uuid references pgs(id) on delete cascade not null,
  room_number    text not null,
  bhk_type       text,
  total_beds     integer not null default 1,
  occupied_beds  integer not null default 0,
  floor          integer default 0,
  created_at     timestamptz default now()
);

-- ─── BOOKINGS ─────────────────────────────────────────────────
create table if not exists bookings (
  id               uuid default uuid_generate_v4() primary key,
  pg_id            uuid references pgs(id) on delete cascade not null,
  room_id          uuid references rooms(id) on delete set null,
  student_name     text not null,
  student_phone    text not null,
  student_email    text,
  move_in_date     date,
  status           text not null default 'booked'
                     check (status in ('booked', 'partially_confirmed', 'vacated')),
  booking_details  text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── LEADS ────────────────────────────────────────────────────
create table if not exists leads (
  id            uuid default uuid_generate_v4() primary key,
  pg_id         uuid references pgs(id) on delete set null,
  student_name  text not null,
  phone         text not null,
  status        text not null default 'new'
                  check (status in ('new', 'called', 'visited', 'booked', 'rejected')),
  assigned_to   uuid references profiles(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── NOTES ────────────────────────────────────────────────────
create table if not exists notes (
  id          uuid default uuid_generate_v4() primary key,
  pg_id       uuid references pgs(id) on delete cascade not null,
  content     text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- ─── REMINDERS ────────────────────────────────────────────────
create table if not exists reminders (
  id          uuid default uuid_generate_v4() primary key,
  pg_id       uuid references pgs(id) on delete cascade,
  lead_id     uuid references leads(id) on delete set null,
  title       text not null,
  due_date    date not null,
  is_done     boolean not null default false,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- ─── UPDATED_AT triggers ─────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pgs_updated_at before update on pgs
  for each row execute function set_updated_at();
create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();
create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
alter table profiles  enable row level security;
alter table pgs       enable row level security;
alter table rooms     enable row level security;
alter table bookings  enable row level security;
alter table leads     enable row level security;
alter table notes     enable row level security;
alter table reminders enable row level security;

-- Profiles: users can read all, update only their own
create policy "profiles_select" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- All other tables: authenticated users have full access
create policy "pgs_all"       on pgs       for all using (auth.role() = 'authenticated');
create policy "rooms_all"     on rooms     for all using (auth.role() = 'authenticated');
create policy "bookings_all"  on bookings  for all using (auth.role() = 'authenticated');
create policy "leads_all"     on leads     for all using (auth.role() = 'authenticated');
create policy "notes_all"     on notes     for all using (auth.role() = 'authenticated');
create policy "reminders_all" on reminders for all using (auth.role() = 'authenticated');

-- ─── SEED SUPERADMIN (run after creating user in Auth) ────────
-- Replace the UUID below with the actual user ID from:
-- Supabase Dashboard → Authentication → Users → copy the UUID
--
-- update profiles set role = 'superadmin', full_name = 'Your Name'
-- where id = 'PASTE-USER-UUID-HERE';

-- ─── INDEXES for performance ──────────────────────────────────
create index if not exists pgs_location_idx      on pgs(location);
create index if not exists pgs_status_idx        on pgs(status);
create index if not exists pgs_bhk_idx           on pgs(bhk_type);
create index if not exists leads_status_idx      on leads(status);
create index if not exists leads_pg_id_idx       on leads(pg_id);
create index if not exists bookings_pg_id_idx    on bookings(pg_id);
create index if not exists bookings_status_idx   on bookings(status);
create index if not exists reminders_due_idx     on reminders(due_date);
create index if not exists reminders_done_idx    on reminders(is_done);
create index if not exists rooms_pg_id_idx       on rooms(pg_id);
create index if not exists notes_pg_id_idx       on notes(pg_id);
