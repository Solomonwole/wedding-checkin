-- ============================================================
-- WEDDING CHECKIN
-- Scanner Activation
-- ============================================================

-- Add a human-friendly activation code.
-- This is used by staff to connect a phone to an
-- administrator-created scanner.

alter table public.scanner_devices
add column if not exists activation_code text;

-- Existing scanner records, if any, need codes.
-- Generate temporary unique codes for them.
update public.scanner_devices
set activation_code =
  'WC-' ||
  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where activation_code is null;

-- Every scanner must have a unique activation code.
alter table public.scanner_devices
alter column activation_code set not null;

create unique index if not exists
scanner_devices_activation_code_key
on public.scanner_devices (activation_code);

-- Helpful index for activation lookup.
create index if not exists
scanner_devices_activation_code_idx
on public.scanner_devices (activation_code);

-- ============================================================
-- Function: generate_scanner_activation_code
-- ============================================================

create or replace function public.generate_scanner_activation_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  loop
    v_code :=
      'WC-' ||
      upper(
        substr(
          replace(gen_random_uuid()::text, '-', ''),
          1,
          8
        )
      );

    exit when not exists (
      select 1
      from public.scanner_devices
      where activation_code = v_code
    );
  end loop;

  return v_code;
end;
$$;