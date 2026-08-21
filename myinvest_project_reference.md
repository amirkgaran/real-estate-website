# myinvest.ca Project Reference

_Last updated: August 21, 2026_

## Project Identity
- Website: https://www.myinvest.ca
- GitHub repository: https://github.com/amirkgaran/real-estate-website
- Hosting: GitHub Pages
- Publishing source: `main` branch, `/ (root)`
- Custom domain file: `CNAME`
- Important: Keep `CNAME` unchanged unless the domain changes.

## Current Homepage Design
The homepage follows the user's hand-drawn layout:
- Top-right navigation: Home | About | Contact
- Top-left profile block:
  - Amir Geran
  - Broker
  - International Realty Firm
  - Cell: 416-616-4634
  - Email: amirkgaran@gmail.com
- The profile block has a bold border.
- Main investment categories shown below:
  - Residential
  - Multi Residential
  - Commercial
  - Financial Market
- Large right-side message:
  - “Your true pathway for profitable investment.”

## Page Structure
The site was changed from a one-page site to separate pages.

Core pages:
- `index.html` — Home
- `about.html` — About
- `contact.html` — Contact

Investment category pages:
- `residential.html`
- `multi-residential.html`
- `commercial.html`
- `financial-market.html`

Shared files:
- `styles.css`
- `script.js`
- `CNAME`

## Listing Page Behavior
Each investment category on the homepage is clickable and opens its own page.

Each category page includes:
- Category explanation
- Investment perspective / what to look at
- Current listings area
- Listing photos
- Listing title
- Price
- Location
- Description
- Investment highlights
- Contact link

## Admin Listing System
A Supabase-backed admin system was added so listings can be managed without editing HTML.

Admin page:
- `admin.html`

Admin features:
- Private sign-in
- Add listing
- Edit listing
- Delete listing
- Choose category
- Add title
- Add price
- Add location
- Add description
- Add investment highlights
- Upload multiple photos
- Publish / unpublish listing
- Draft support

Supporting files:
- `admin.js`
- `listings.js`
- `config.js`

## Supabase Project
Supabase project name:
- `myinvest`

Project URL:
- `https://mkkouaoqnyskffeabeyx.supabase.co`

The project was created in the Americas region.

Authentication:
- A private admin user was created in Supabase Authentication.
- That user was added to the `site_admins` table.
- Do not store database passwords or secret/service-role keys in GitHub.

Browser API key:
- The site uses a Supabase publishable key in `config.js`.
- Only the publishable/anon key belongs in browser code.
- Never use the Supabase secret/service-role key in GitHub Pages.

## Supabase Database Setup
The Supabase SQL setup created:
- `public.listings`
- `public.site_admins`
- `public.is_site_admin()` security function
- Row Level Security policies
- Public read access only for published listings
- Authenticated admin create/update/delete access
- `listing-images` storage bucket
- Storage policies for public image reading and admin-only uploads/updates/deletes

Relevant setup file:
- `supabase-setup.sql`

Setup guide:
- `SUPABASE_SETUP.md`

## Public Listing Loading
The public category pages load listings dynamically from Supabase.

A category page filters by:
- matching category
- `published = true`

Listings are ordered newest first.

## Multiple Photo Gallery
Initial behavior displayed only the first uploaded photo because the original public listing code used the first image in the array.

This was updated so each listing can show:
- One large main image
- Thumbnail gallery underneath
- Clicking a thumbnail changes the main image

Files involved:
- Updated `listings.js`
- Multi-photo gallery CSS appended to `styles.css`

Latest fix package created:
- `myinvest-multi-photo-fix.zip`

## GitHub Pages Recovery
The GitHub Pages site temporarily stopped working after repository visibility was changed.

The fix was:
- Set repository public again
- Re-enable GitHub Pages
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`
- Custom domain: `www.myinvest.ca`
- Trigger a new commit so GitHub Pages rebuilds

The site came back online after the rebuild.

## Current Website Packages Created During Development
- `myinvest-homepage-redesign.zip`
- `myinvest-three-page-redesign.zip`
- `myinvest-expanded-site.zip`
- `myinvest-supabase-admin.zip`
- `myinvest-multi-photo-fix.zip`

The Supabase admin version is the main current architecture.

## Important Working Rule
For future changes:
1. Keep `CNAME`.
2. Keep GitHub Pages on `main / (root)`.
3. Do not expose Supabase secret/service-role keys.
4. Use `admin.html` for listing management.
5. Public category pages should load listings from Supabase rather than hard-coded HTML.
6. New listing photos should be stored in the `listing-images` Supabase bucket.
7. Published listings should automatically appear on the correct category page.

## Next Likely Improvements
Possible future work:
- Better multi-image slideshow / lightbox
- Reorder listing photos
- Delete individual photos while editing a listing
- Featured listing toggle
- Sold / leased status
- Beds / baths / square footage fields
- Property type field
- MLS number field
- Search and filtering
- Contact form connected to email
- SEO metadata per listing
- Better mobile photo gallery
- Admin dashboard image previews and reordering
