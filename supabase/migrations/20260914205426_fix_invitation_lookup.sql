-- ============================================================
-- WEDDING CHECKIN
-- Fix public invitation lookup return type
-- ============================================================

create extension if not exists pgcrypto;

-- PostgreSQL does not allow CREATE OR REPLACE FUNCTION
-- when the OUT/RETURNS TABLE types change.
drop function if exists public.get_invitation_by_token(text);


create function public.get_invitation_by_token(
  p_token text
)
returns table (
  invitation_id uuid,
  status text,
  first_name text,
  last_name text,
  category text,
  event_name text,
  event_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_hash text;
begin

  /*
   * Hash the raw invitation token using SHA-256.
   *
   * This matches the application:
   *
   * crypto
   *   .createHash("sha256")
   *   .update(token)
   *   .digest("hex")
   */

  v_token_hash := encode(
    extensions.digest(
      convert_to(p_token, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  return query
  select
    i.id as invitation_id,
    i.status::text as status,
    g.first_name,
    g.last_name,
    g.category,
    e.name as event_name,
    e.event_date
  from public.invitations i

  inner join public.guests g
    on g.id = i.guest_id

  inner join public.events e
    on e.id = i.event_id

  where i.token_hash = v_token_hash
    and g.deleted_at is null
    and e.archived_at is null;

end;
$$;


-- The public invitation page needs to be able to call
-- this function without requiring the guest to be logged in.
grant execute on function public.get_invitation_by_token(text)
to anon, authenticated;