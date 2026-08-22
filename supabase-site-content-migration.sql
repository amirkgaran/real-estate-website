-- MyInvest editable website content migration
-- Run ONCE in Supabase -> SQL Editor -> New query.

create table if not exists public.site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_content_allowed_key check (
    key in ('about_heading', 'about_description')
  )
);

insert into public.site_content (key, value)
values
  ('about_heading', 'Real estate guidance with an investment mindset.'),
  ('about_description', 'Amir Geran is a Broker with International Realty Firm, focused on helping clients evaluate opportunities with attention to value, income potential and long-term growth.')
on conflict (key) do nothing;

alter table public.site_content enable row level security;

drop policy if exists "Public can view site content" on public.site_content;
create policy "Public can view site content"
on public.site_content for select
to anon
using (true);

drop policy if exists "Admins can view site content" on public.site_content;
create policy "Admins can view site content"
on public.site_content for select
to authenticated
using (public.is_site_admin());

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
on public.site_content for insert
to authenticated
with check (public.is_site_admin());

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
on public.site_content for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());
