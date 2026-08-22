-- Run this once in Supabase -> SQL Editor for an existing MyInvest database.

alter table public.listings add column if not exists listing_type text;

-- Preserve existing Residential listings by treating them as For Sale initially.
update public.listings
set listing_type = 'Sale'
where category = 'Residential' and listing_type is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_listing_type_check'
  ) then
    alter table public.listings
      add constraint listings_listing_type_check
      check (listing_type in ('Sale','Lease') or listing_type is null);
  end if;
end $$;
