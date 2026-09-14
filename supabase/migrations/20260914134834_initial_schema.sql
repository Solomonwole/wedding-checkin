-- ============================================================
-- WEDDING CHECKIN
-- Initial Database Schema
--
-- Architecture:
-- User
--   ↓
-- Organization
--   ↓
-- Events
--   ↓
-- Guests
--   ↓
-- Invitations
--   ↓
-- Check-ins
--
-- Important:
-- - Events are NEVER hard-deleted.
-- - Guests are soft-deleted.
-- - Invitations are revoked, never deleted.
-- - Check-ins are permanent audit records.
-- - QR tokens are stored as hashes, never plaintext.
-- - Invitation redemption is atomic.
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists "pgcrypto";


-- ============================================================
-- 2. ENUMS
-- ============================================================

create type public.organization_role as enum (
  'owner',
  'admin',
  'staff'
);


create type public.event_status as enum (
  'draft',
  'active',
  'completed'
);


create type public.guest_status as enum (
  'invited',
  'confirmed',
  'declined',
  'checked_in'
);


create type public.invitation_status as enum (
  'active',
  'used',
  'revoked'
);


create type public.scanner_status as enum (
  'active',
  'revoked'
);


-- ============================================================
-- 3. PROFILES
--
-- Extends Supabase Auth users.
-- One profile per auth user.
-- ============================================================

create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text,

  email text,

  avatar_url text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 4. ORGANIZATIONS
--
-- This allows Wedding Checkin to eventually support:
--
-- Individual user
-- Wedding planner
-- Wedding planning agency
-- Event management company
--
-- without redesigning the database later.
-- ============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  slug text not null unique,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 5. ORGANIZATION MEMBERS
-- ============================================================

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role public.organization_role not null default 'staff',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint organization_members_unique
    unique (organization_id, user_id)
);


-- ============================================================
-- 6. EVENTS
--
-- Events are soft-deleted.
--
-- archived_at IS NULL
--     → visible/active
--
-- archived_at IS NOT NULL
--     → hidden from normal frontend
--
-- We never physically delete an event.
-- ============================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  name text not null,

  event_date date not null,

  venue text,

  status public.event_status not null default 'draft',

  archived_at timestamptz,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 7. GUESTS
--
-- Guests are soft-deleted.
--
-- deleted_at IS NULL
--     → visible
--
-- deleted_at IS NOT NULL
--     → hidden from normal frontend
--
-- We keep the record because it may be associated with:
-- invitations and check-ins.
-- ============================================================

create table public.guests (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.events(id)
    on delete restrict,

  first_name text not null,

  last_name text not null,

  email text,

  phone text,

  category text not null default 'Guest',

  plus_one boolean not null default false,

  notes text,

  status public.guest_status not null default 'invited',

  deleted_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 8. INVITATIONS
--
-- Each guest gets one invitation.
--
-- The QR code contains a random token.
--
-- We DO NOT store the raw token.
-- We only store SHA-256(token).
--
-- The raw token exists only on the invitation being generated
-- and is used to construct the QR code.
--
-- Invitations are never deleted.
-- They can be:
--
-- active
-- used
-- revoked
-- ============================================================

create table public.invitations (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.events(id)
    on delete restrict,

  guest_id uuid not null
    references public.guests(id)
    on delete restrict,

  token_hash text not null unique,

  status public.invitation_status not null default 'active',

  sent_at timestamptz,

  used_at timestamptz,

  used_by uuid
    references auth.users(id)
    on delete set null,

  revoked_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint invitations_guest_unique
    unique (guest_id)
);


-- ============================================================
-- 9. SCANNER DEVICES
--
-- A staff member's phone/tablet can be registered as a
-- scanner device.
--
-- Example:
--
-- iPhone - Entrance 1
-- Android - Entrance 2
-- iPad - VIP Entrance
-- ============================================================

create table public.scanner_devices (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.events(id)
    on delete restrict,

  user_id uuid not null
    references auth.users(id)
    on delete restrict,

  device_name text not null,

  status public.scanner_status not null default 'active',

  last_seen_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 10. CHECK-INS
--
-- IMPORTANT:
--
-- This is an immutable audit record.
--
-- Once a guest enters the event, the check-in record remains.
--
-- We intentionally DO NOT cascade-delete this table.
-- ============================================================

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),

  invitation_id uuid not null
    references public.invitations(id)
    on delete restrict,

  guest_id uuid not null
    references public.guests(id)
    on delete restrict,

  scanner_device_id uuid
    references public.scanner_devices(id)
    on delete set null,

  checked_in_by uuid not null
    references auth.users(id)
    on delete restrict,

  checked_in_at timestamptz not null default now(),

  ip_address inet,

  user_agent text
);


-- ============================================================
-- 11. INDEXES
-- ============================================================

create index profiles_email_idx
  on public.profiles(email);


create index organization_members_organization_id_idx
  on public.organization_members(organization_id);


create index organization_members_user_id_idx
  on public.organization_members(user_id);


create index events_organization_id_idx
  on public.events(organization_id);


create index events_organization_active_idx
  on public.events(organization_id, archived_at);


create index events_created_by_idx
  on public.events(created_by);


create index guests_event_id_idx
  on public.guests(event_id);


create index guests_event_status_idx
  on public.guests(event_id, status);


create index guests_event_deleted_idx
  on public.guests(event_id, deleted_at);


create index invitations_event_id_idx
  on public.invitations(event_id);


create index invitations_guest_id_idx
  on public.invitations(guest_id);


create index invitations_status_idx
  on public.invitations(status);


create index invitations_event_status_idx
  on public.invitations(event_id, status);


create index scanner_devices_event_id_idx
  on public.scanner_devices(event_id);


create index scanner_devices_user_id_idx
  on public.scanner_devices(user_id);


create index scanner_devices_event_status_idx
  on public.scanner_devices(event_id, status);


create index check_ins_invitation_id_idx
  on public.check_ins(invitation_id);


create index check_ins_guest_id_idx
  on public.check_ins(guest_id);


create index check_ins_checked_in_at_idx
  on public.check_ins(checked_in_at);


-- ============================================================
-- 12. UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  return new;
end;
$$;


-- ============================================================
-- 13. UPDATED_AT TRIGGERS
-- ============================================================

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();


create trigger organization_members_set_updated_at
before update on public.organization_members
for each row
execute function public.set_updated_at();


create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();


create trigger guests_set_updated_at
before update on public.guests
for each row
execute function public.set_updated_at();


create trigger invitations_set_updated_at
before update on public.invitations
for each row
execute function public.set_updated_at();


create trigger scanner_devices_set_updated_at
before update on public.scanner_devices
for each row
execute function public.set_updated_at();


-- ============================================================
-- 14. CREATE PROFILE AUTOMATICALLY
--
-- When a user signs up through Supabase Auth,
-- automatically create their profile.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    full_name,
    email
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );

  return new;

end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ============================================================
-- 15. ATOMIC INVITATION REDEMPTION
-- ============================================================
--
-- This is the most important security function.
--
-- The scanner sends:
--
-- token_hash
-- scanner_device_id
--
-- PostgreSQL:
--
-- 1. Finds the invitation.
-- 2. Locks the row.
-- 3. Checks status.
-- 4. If active, marks it used.
-- 5. Creates a permanent check-in record.
--
-- FOR UPDATE prevents two scanners from successfully
-- redeeming the same invitation at the same time.
--
-- Example:
--
-- Scanner A ──┐
--             │
-- Scanner B ──┼──> SAME INVITATION
--             │
--             ↓
--        PostgreSQL lock
--             ↓
--        First request
--             ↓
--           USED
--             ↓
-- Second request → ALREADY USED
--
-- ============================================================

create or replace function public.redeem_invitation(
  p_token_hash text,
  p_scanner_device_id uuid
)
returns table (
  success boolean,
  result text,
  invitation_id uuid,
  guest_id uuid,
  guest_name text,
  guest_category text,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare

  v_invitation public.invitations%rowtype;

  v_guest public.guests%rowtype;

  v_device public.scanner_devices%rowtype;

  v_now timestamptz := now();

begin

  -- ========================================================
  -- 1. Validate scanner device
  -- ========================================================

  select *
  into v_device
  from public.scanner_devices
  where id = p_scanner_device_id
    and status = 'active'
  for update;


  if not found then

    return query
    select
      false,
      'invalid_scanner'::text,
      null::uuid,
      null::uuid,
      null::text,
      null::text,
      null::timestamptz;

    return;

  end if;


  -- ========================================================
  -- 2. Find invitation and lock it
  -- ========================================================

  select *
  into v_invitation
  from public.invitations
  where token_hash = p_token_hash
  for update;


  -- ========================================================
  -- 3. Invalid token
  -- ========================================================

  if not found then

    return query
    select
      false,
      'invalid'::text,
      null::uuid,
      null::uuid,
      null::text,
      null::text,
      null::timestamptz;

    return;

  end if;


  -- ========================================================
  -- 4. Make sure invitation belongs to scanner's event
  -- ========================================================

  if v_invitation.event_id <> v_device.event_id then

    return query
    select
      false,
      'wrong_event'::text,
      v_invitation.id,
      v_invitation.guest_id,
      null::text,
      null::text,
      null::timestamptz;

    return;

  end if;


  -- ========================================================
  -- 5. Already used
  -- ========================================================

  if v_invitation.status = 'used' then

    select *
    into v_guest
    from public.guests
    where id = v_invitation.guest_id;


    return query
    select
      false,
      'already_used'::text,
      v_invitation.id,
      v_invitation.guest_id,
      concat(v_guest.first_name, ' ', v_guest.last_name),
      v_guest.category,
      v_invitation.used_at;

    return;

  end if;


  -- ========================================================
  -- 6. Revoked
  -- ========================================================

  if v_invitation.status = 'revoked' then

    return query
    select
      false,
      'revoked'::text,
      v_invitation.id,
      v_invitation.guest_id,
      null::text,
      null::text,
      null::timestamptz;

    return;

  end if;


  -- ========================================================
  -- 7. Get guest
  -- ========================================================

  select *
  into v_guest
  from public.guests
  where id = v_invitation.guest_id
    and deleted_at is null;


  if not found then

    return query
    select
      false,
      'guest_not_found'::text,
      v_invitation.id,
      v_invitation.guest_id,
      null::text,
      null::text,
      null::timestamptz;

    return;

  end if;


  -- ========================================================
  -- 8. Redeem invitation
  -- ========================================================

  update public.invitations
  set
    status = 'used',
    used_at = v_now,
    used_by = auth.uid(),
    updated_at = v_now
  where id = v_invitation.id;


  -- ========================================================
  -- 9. Update guest
  -- ========================================================

  update public.guests
  set
    status = 'checked_in',
    updated_at = v_now
  where id = v_guest.id;


  -- ========================================================
  -- 10. Create permanent check-in record
  -- ========================================================

  insert into public.check_ins (
    invitation_id,
    guest_id,
    scanner_device_id,
    checked_in_by,
    checked_in_at
  )
  values (
    v_invitation.id,
    v_guest.id,
    v_device.id,
    auth.uid(),
    v_now
  );


  -- ========================================================
  -- 11. Update scanner last seen
  -- ========================================================

  update public.scanner_devices
  set
    last_seen_at = v_now,
    updated_at = v_now
  where id = v_device.id;


  -- ========================================================
  -- 12. Return successful check-in
  -- ========================================================

  return query
  select
    true,
    'success'::text,
    v_invitation.id,
    v_guest.id,
    concat(v_guest.first_name, ' ', v_guest.last_name),
    v_guest.category,
    v_now;

end;
$$;


-- ============================================================
-- 16. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles
enable row level security;

alter table public.organizations
enable row level security;

alter table public.organization_members
enable row level security;

alter table public.events
enable row level security;

alter table public.guests
enable row level security;

alter table public.invitations
enable row level security;

alter table public.scanner_devices
enable row level security;

alter table public.check_ins
enable row level security;


-- ============================================================
-- 17. PROFILE POLICIES
-- ============================================================

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
);


create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);


-- ============================================================
-- 18. ORGANIZATION HELPER
-- ============================================================

create or replace function public.is_organization_member(
  p_organization_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = auth.uid()
  );
$$;


create or replace function public.is_organization_admin(
  p_organization_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;


-- ============================================================
-- 19. ORGANIZATION POLICIES
-- ============================================================

create policy "Members can view organizations"
on public.organizations
for select
to authenticated
using (
  public.is_organization_member(id)
);


create policy "Users can create organizations"
on public.organizations
for insert
to authenticated
with check (
  created_by = auth.uid()
);


create policy "Admins can update organizations"
on public.organizations
for update
to authenticated
using (
  public.is_organization_admin(id)
)
with check (
  public.is_organization_admin(id)
);


-- ============================================================
-- 20. ORGANIZATION MEMBER POLICIES
-- ============================================================

create policy "Members can view organization members"
on public.organization_members
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);


create policy "Admins can add organization members"
on public.organization_members
for insert
to authenticated
with check (
  public.is_organization_admin(organization_id)
);


create policy "Admins can update organization members"
on public.organization_members
for update
to authenticated
using (
  public.is_organization_admin(organization_id)
)
with check (
  public.is_organization_admin(organization_id)
);


create policy "Admins can remove organization members"
on public.organization_members
for delete
to authenticated
using (
  public.is_organization_admin(organization_id)
);


-- ============================================================
-- 21. EVENT POLICIES
-- ============================================================

create policy "Members can view active events"
on public.events
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);


create policy "Members can create events"
on public.events
for insert
to authenticated
with check (
  public.is_organization_member(organization_id)
  and created_by = auth.uid()
);


create policy "Admins can update events"
on public.events
for update
to authenticated
using (
  public.is_organization_admin(organization_id)
)
with check (
  public.is_organization_admin(organization_id)
);


-- ============================================================
-- 22. GUEST POLICIES
-- ============================================================

create policy "Members can view guests"
on public.guests
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = guests.event_id
      and public.is_organization_member(events.organization_id)
  )
);


create policy "Members can create guests"
on public.guests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events
    where events.id = guests.event_id
      and public.is_organization_member(events.organization_id)
  )
);


create policy "Members can update guests"
on public.guests
for update
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = guests.event_id
      and public.is_organization_member(events.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.events
    where events.id = guests.event_id
      and public.is_organization_member(events.organization_id)
  )
);


-- ============================================================
-- 23. INVITATION POLICIES
-- ============================================================

create policy "Members can view invitations"
on public.invitations
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = invitations.event_id
      and public.is_organization_member(events.organization_id)
  )
);


create policy "Members can create invitations"
on public.invitations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events
    where events.id = invitations.event_id
      and public.is_organization_member(events.organization_id)
  )
);


create policy "Admins can update invitations"
on public.invitations
for update
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = invitations.event_id
      and public.is_organization_admin(events.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.events
    where events.id = invitations.event_id
      and public.is_organization_admin(events.organization_id)
  )
);


-- ============================================================
-- 24. SCANNER DEVICE POLICIES
-- ============================================================

create policy "Users can view scanner devices"
on public.scanner_devices
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.events
    where events.id = scanner_devices.event_id
      and public.is_organization_admin(events.organization_id)
  )
);


create policy "Users can create scanner devices"
on public.scanner_devices
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.events
    where events.id = scanner_devices.event_id
      and public.is_organization_member(events.organization_id)
  )
);


create policy "Users can update their scanner devices"
on public.scanner_devices
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);


-- ============================================================
-- 25. CHECK-IN POLICIES
-- ============================================================

create policy "Members can view check-ins"
on public.check_ins
for select
to authenticated
using (
  exists (
    select 1
    from public.invitations
    join public.events
      on events.id = invitations.event_id
    where invitations.id = check_ins.invitation_id
      and public.is_organization_member(events.organization_id)
  )
);


-- ============================================================
-- 26. FUNCTION SECURITY
--
-- Only authenticated users should be able to execute the
-- invitation redemption function.
-- ============================================================

revoke execute
on function public.redeem_invitation(text, uuid)
from public;

revoke execute
on function public.redeem_invitation(text, uuid)
from anon;

grant execute
on function public.redeem_invitation(text, uuid)
to authenticated;


-- ============================================================
-- END OF INITIAL SCHEMA
-- ============================================================