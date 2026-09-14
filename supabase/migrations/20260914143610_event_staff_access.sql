-- ============================================================
-- WEDDING CHECKIN
-- Event-level staff access
-- ============================================================


-- ============================================================
-- 1. EVENT STAFF
-- ============================================================

create table public.event_staff (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.events(id)
    on delete restrict,

  user_id uuid not null
    references auth.users(id)
    on delete restrict,

  assigned_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint event_staff_unique
    unique (event_id, user_id)
);


-- ============================================================
-- 2. INDEXES
-- ============================================================

create index event_staff_event_id_idx
  on public.event_staff(event_id);

create index event_staff_user_id_idx
  on public.event_staff(user_id);


-- ============================================================
-- 3. HELPER FUNCTION
-- ============================================================

create or replace function public.has_event_access(
  p_event_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and (
        -- Organization owner/admin
        public.is_organization_admin(e.organization_id)

        -- OR specifically assigned event staff
        or exists (
          select 1
          from public.event_staff es
          where es.event_id = e.id
            and es.user_id = auth.uid()
        )
      )
  );
$$;


-- ============================================================
-- 4. RLS
-- ============================================================

alter table public.event_staff
enable row level security;


-- ============================================================
-- 5. VIEW EVENT STAFF
-- ============================================================

create policy "Users can view event staff"
on public.event_staff
for select
to authenticated
using (
  public.has_event_access(event_id)
);


-- ============================================================
-- 6. ASSIGN STAFF
--
-- Only organization admins can assign staff to events.
-- ============================================================

create policy "Admins can assign event staff"
on public.event_staff
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_staff.event_id
      and public.is_organization_admin(e.organization_id)
  )
);


-- ============================================================
-- 7. REMOVE STAFF
-- ============================================================

create policy "Admins can remove event staff"
on public.event_staff
for delete
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_staff.event_id
      and public.is_organization_admin(e.organization_id)
  )
);