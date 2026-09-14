-- ============================================================
-- WEDDING CHECKIN
-- Guests - incremental updates
-- ============================================================

-- The guests table already exists in the initial schema.
-- This migration intentionally does not recreate it.
--
-- We only ensure the updated_at trigger exists.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guests_set_updated_at
on public.guests;

create trigger guests_set_updated_at
before update on public.guests
for each row
execute function public.set_updated_at();