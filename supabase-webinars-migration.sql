-- MyInvest webinar system
-- Run once in Supabase -> SQL Editor.

create table if not exists public.webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_date date not null,
  event_time time not null,
  timezone text not null default 'America/Toronto',
  meeting_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  registered_at timestamptz not null default now(),
  welcome_sent_at timestamptz,
  link_sent_at timestamptz,
  unique (webinar_id, email)
);

alter table public.webinars enable row level security;
alter table public.webinar_registrations enable row level security;

-- Public visitors may see only published webinars. Meeting links are intentionally
-- not displayed by the website even though the row is readable; access links are
-- delivered to registrants by email.
drop policy if exists "Public can view published webinars" on public.webinars;
create policy "Public can view published webinars"
on public.webinars for select
to anon
using (published = true);

-- Keep the private meeting URL out of the browser/API for anonymous visitors.
-- Public visitors may read only the columns needed to display the schedule.
revoke select on public.webinars from anon;
grant select (id, title, description, event_date, event_time, timezone, published)
on public.webinars to anon;

-- Admins can fully manage webinars.
drop policy if exists "Admins can view all webinars" on public.webinars;
create policy "Admins can view all webinars"
on public.webinars for select
to authenticated
using (public.is_site_admin());

drop policy if exists "Admins can insert webinars" on public.webinars;
create policy "Admins can insert webinars"
on public.webinars for insert
to authenticated
with check (public.is_site_admin());

drop policy if exists "Admins can update webinars" on public.webinars;
create policy "Admins can update webinars"
on public.webinars for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admins can delete webinars" on public.webinars;
create policy "Admins can delete webinars"
on public.webinars for delete
to authenticated
using (public.is_site_admin());

-- Registrations are private. Public registration is handled by the
-- webinar-register Edge Function using a server-side secret key.
drop policy if exists "Admins can view webinar registrations" on public.webinar_registrations;
create policy "Admins can view webinar registrations"
on public.webinar_registrations for select
to authenticated
using (public.is_site_admin());

drop policy if exists "Admins can update webinar registrations" on public.webinar_registrations;
create policy "Admins can update webinar registrations"
on public.webinar_registrations for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admins can delete webinar registrations" on public.webinar_registrations;
create policy "Admins can delete webinar registrations"
on public.webinar_registrations for delete
to authenticated
using (public.is_site_admin());
