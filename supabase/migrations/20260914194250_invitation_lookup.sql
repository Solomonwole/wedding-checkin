-- ============================================================
-- WEDDING CHECKIN
-- Public Invitation Lookup
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.get_invitation_by_token(
  p_token text
)
returns table (
  invitation_id uuid,
  status text,
  first_name text,
  last_name text,
  category text,
  event_name text,
  event_date timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_hash text;
begin

  /*
   * Must match:
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
    i.id,
    i.status::text,
    g.first_name,
    g.last_name,
    g.category,
    e.name,
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