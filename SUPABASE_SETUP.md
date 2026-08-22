# myinvest.ca — Supabase Listing Admin Setup

The website files are ready. You only need to connect them to a Supabase project.

## 1. Create a Supabase project

Create a free project at Supabase.

## 2. Create the database and image-storage rules

Open:

**Supabase → SQL Editor → New query**

Paste the entire contents of `supabase-setup.sql` and run it.

This creates:

- `listings` table
- `site_admins` table
- security policies
- `listing-images` storage bucket
- administrator security function

## 3. Create your private admin login

Open:

**Supabase → Authentication → Users → Add user**

Create your own admin email and password.

Copy the new user's **UUID**.

Then return to the SQL Editor and run:

```sql
insert into public.site_admins (user_id)
values ('PASTE_YOUR_USER_UUID_HERE');
```

Replace the placeholder with the UUID you copied.

## 4. Connect the website

Open:

**Supabase → Project Settings → API**

Copy:

- Project URL
- anon / public key

Open `config.js` and replace:

```js
supabaseUrl: "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE",
supabaseAnonKey: "PASTE_YOUR_SUPABASE_ANON_KEY_HERE"
```

The anon key is intended for public browser use. **Never put the Supabase service-role key in GitHub or in this website.**

## 5. Upload the website files to GitHub

Upload/replace:

- `index.html`
- `about.html`
- `contact.html`
- `residential.html`
- `multi-residential.html`
- `commercial.html`
- `financial-market.html`
- `styles.css`
- `script.js`
- `config.js`
- `listings.js`
- `admin.html`
- `admin.js`

Keep your existing `CNAME` file unchanged.

You do NOT need to upload `supabase-setup.sql` or this setup guide to the public repository unless you want to keep them there.

## 6. Use the admin page

After GitHub Pages rebuilds, open:

`https://www.myinvest.ca/admin.html`

Sign in with the Supabase admin user you created.

From there you can:

- choose Residential / Multi Residential / Commercial / Financial Market
- choose For Sale / For Lease when the category is Residential
- enter title
- enter price
- enter location
- write description
- write investment highlights
- upload multiple photos
- publish or save as draft
- edit listings
- delete listings

Published listings automatically appear on the matching public category page. Residential visitors first choose For Sale or For Lease and then see only matching listings.

## Security

The admin interface is public as a web page, but access to listing changes is protected by Supabase Authentication and Row Level Security. A visitor cannot create, edit or delete listings unless their authenticated user UUID is in `site_admins`.

## Existing database: Residential Sale / Lease migration

If the Supabase project was created before the Residential Sale / Lease feature, run `supabase-residential-sale-lease-migration.sql` once in **Supabase → SQL Editor**. Existing Residential listings are assigned to **For Sale** so they remain visible; edit any lease listings in `admin.html` afterward.
