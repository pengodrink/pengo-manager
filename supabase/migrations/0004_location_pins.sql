-- Pengo migration 0004 — per-location PIN codes for stock counting.
-- Run AFTER 0003. Safe to run more than once.

alter table public.locations add column if not exists pin text;

-- Initial PINs (managers can change these on the Team page).
update public.locations set pin = '4821' where code = 'MV' and pin is null;
update public.locations set pin = '5390' where code = 'LF' and pin is null;
update public.locations set pin = '6174' where code = 'AP' and pin is null;
