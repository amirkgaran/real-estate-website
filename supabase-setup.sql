-- myinvest.ca Supabase setup
-- Run this entire file in Supabase -> SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Residential','Multi Residential','Commercial','Financial Market')),
  listing_type text check (listing_type in ('Sale','Lease') or listing_type is null),
  title text not null,
  price text,
  location text,
  description text not null,
  highlights text,
  images text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe migration for sites that already have the listings table.
alter table public.listings add column if not exists listing_type text;
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

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;
alter table public.site_admins enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

drop policy if exists "Public can view published listings" on public.listings;
create policy "Public can view published listings"
on public.listings for select
to anon
using (published = true);

drop policy if exists "Admins can view all listings" on public.listings;
create policy "Admins can view all listings"
on public.listings for select
to authenticated
using (public.is_site_admin());

drop policy if exists "Admins can insert listings" on public.listings;
create policy "Admins can insert listings"
on public.listings for insert
to authenticated
with check (public.is_site_admin());

drop policy if exists "Admins can update listings" on public.listings;
create policy "Admins can update listings"
on public.listings for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admins can delete listings" on public.listings;
create policy "Admins can delete listings"
on public.listings for delete
to authenticated
using (public.is_site_admin());

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public listing image access" on storage.objects;
create policy "Public listing image access"
on storage.objects for select
to public
using (bucket_id = 'listing-images');

drop policy if exists "Admins upload listing images" on storage.objects;
create policy "Admins upload listing images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-images' and public.is_site_admin());

drop policy if exists "Admins update listing images" on storage.objects;
create policy "Admins update listing images"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-images' and public.is_site_admin())
with check (bucket_id = 'listing-images' and public.is_site_admin());

drop policy if exists "Admins delete listing images" on storage.objects;
create policy "Admins delete listing images"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-images' and public.is_site_admin());

-- AFTER you create your admin user in Supabase Authentication,
-- copy that user's UUID and run the line below separately:
--
-- insert into public.site_admins (user_id)
-- values ('PASTE_ADMIN_USER_UUID_HERE');
