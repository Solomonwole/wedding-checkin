-- ============================================================
-- WEDDING CHECKIN
-- Store invitation token for reusable invitation sharing
-- ============================================================

alter table public.invitations
add column if not exists token text;

-- Every invitation has one unique token.
create unique index if not exists invitations_token_key
on public.invitations(token);

-- Existing invitations were created before we started storing
-- the raw token. They cannot be recovered because token_hash is
-- a one-way SHA-256 hash.
--
-- Therefore, only allow the column to become NOT NULL after
-- existing rows have been handled.
--
-- For a fresh database this can be uncommented immediately:
--
-- alter table public.invitations
-- alter column token set not null;