-- Pengo migration 0007 — change all "Case" units to "Unit".
update public.inventory_items set unit = 'Unit' where unit = 'Case';
