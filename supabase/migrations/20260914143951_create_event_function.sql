-- ============================================================
-- WEDDING CHECKIN
-- Create Event Function
-- ============================================================

create or replace function public.create_event(
  p_name text,
  p_event_date date,
  p_venue text default null,
  p_organization_name text default null
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();

  v_organization_id uuid;

  v_slug text;

  v_event public.events;

begin

  -- ==========================================================
  -- 1. Make sure the user is authenticated
  -- ==========================================================

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;


  -- ==========================================================
  -- 2. Find an organization the user owns
  --
  -- For the initial product experience, one user gets one
  -- default organization.
  -- ==========================================================

  select om.organization_id
  into v_organization_id
  from public.organization_members om
  where om.user_id = v_user_id
    and om.role = 'owner'
  order by om.created_at
  limit 1;


  -- ==========================================================
  -- 3. Create organization if user doesn't have one
  -- ==========================================================

  if v_organization_id is null then

    v_slug :=
      regexp_replace(
        lower(
          coalesce(
            nullif(trim(p_organization_name), ''),
            'my-wedding-checkin'
          )
        ),
        '[^a-z0-9]+',
        '-',
        'g'
      );

    v_slug :=
      trim(both '-' from v_slug);


    -- Guarantee slug uniqueness.
    v_slug := v_slug || '-' ||
      substring(
        replace(gen_random_uuid()::text, '-', '')
        from 1 for 8
      );


    insert into public.organizations (
      name,
      slug,
      created_by
    )
    values (
      coalesce(
        nullif(trim(p_organization_name), ''),
        'My Wedding Checkin'
      ),
      v_slug,
      v_user_id
    )
    returning id
    into v_organization_id;


    -- Make creator the organization owner.

    insert into public.organization_members (
      organization_id,
      user_id,
      role
    )
    values (
      v_organization_id,
      v_user_id,
      'owner'
    );

  end if;


  -- ==========================================================
  -- 4. Create event
  -- ==========================================================

  insert into public.events (
    organization_id,
    name,
    event_date,
    venue,
    created_by
  )
  values (
    v_organization_id,
    trim(p_name),
    p_event_date,
    nullif(trim(p_venue), ''),
    v_user_id
  )
  returning *
  into v_event;


  -- ==========================================================
  -- 5. Return event
  -- ==========================================================

  return v_event;

end;
$$;


-- ============================================================
-- SECURITY
-- ============================================================

revoke execute
on function public.create_event(text, date, text, text)
from public;

revoke execute
on function public.create_event(text, date, text, text)
from anon;

grant execute
on function public.create_event(text, date, text, text)
to authenticated;