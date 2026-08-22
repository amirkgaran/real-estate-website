# MYINVEST_PROJECT_REFERENCE.md

_Last updated: August 21, 2026_

## Project Identity
- Website: https://www.myinvest.ca
- GitHub repository: https://github.com/amirkgaran/real-estate-website
- Hosting: GitHub Pages
- Publishing source: `main` branch, `/ (root)`
- Keep `CNAME` unchanged unless the domain changes.

## Homepage Design
- Top-right navigation: Home | About | Contact
- Top-left bold-bordered profile block:
  - Amir Geran
  - Broker
  - International Realty Firm
  - Cell: 416-616-4634
  - Email: amirkgaran@gmail.com
- Main clickable categories:
  - Residential
  - Multi Residential
  - Commercial
  - Financial Market
- Right-side message: “Your true pathway for profitable investment.”
- The profile box and right investment box are aligned at the top.

## Homepage Alignment Fix
Keep this override at the bottom of `styles.css` if earlier rules conflict:

```css
.hero {
    align-items: start !important;
}

.hero-left {
    align-self: start !important;
    margin-top: 0 !important;
    padding-top: 0 !important;
}

.hero-message {
    align-self: start !important;
    margin-top: 0 !important;
    padding-top: 0 !important;
}

.profile-card,
.message-frame {
    margin-top: 0 !important;
}
```

## Page Structure
- `index.html` — Home
- `about.html` — About
- `contact.html` — Contact
- `residential.html`
- `multi-residential.html`
- `commercial.html`
- `financial-market.html`
- `admin.html`
- `styles.css`
- `script.js`
- `listings.js`
- `listing-detail.html`
- `listing-detail.js`
- `admin.js`
- `config.js`
- `CNAME`

## Listing System
Each category page dynamically loads published listings from Supabase.

Listings can include:
- category
- title
- price
- location
- description
- investment highlights
- multiple photos
- published/draft status

## Admin System
`admin.html` provides authenticated listing management:
- add
- edit
- delete
- publish/unpublish
- upload multiple photos

## Supabase
Project name: `myinvest`

Project URL:
`https://mkkouaoqnyskffeabeyx.supabase.co`

The site uses:
- `public.listings`
- `public.site_admins`
- `public.is_site_admin()`
- Row Level Security
- `listing-images` storage bucket

Only the Supabase publishable/anon key belongs in browser code. Never place a secret/service-role key in GitHub.

## Residential Listing Browse Flow
- Residential first asks the visitor to choose **For Sale** or **For Lease**.
- Results are shown as compact listing rows with a thumbnail, price/location, and short description.
- Selecting a listing opens `listing-detail.html?id=<listing UUID>`.
- The detail page shows the full photo gallery, complete description, investment highlights, price/location, and contact CTA.

## Multiple Photo Gallery
The public listing pages were updated so a listing can display:
- one large main image
- thumbnails for all uploaded images
- clicking a thumbnail changes the main image

The related changes are in:
- `listings.js`
- `listing-detail.html`
- `listing-detail.js`
- gallery CSS appended to `styles.css`

## GitHub Pages
Current working configuration:
- repository public
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`
- Custom domain: `www.myinvest.ca`

The site previously stopped publishing after a visibility change and was restored by re-enabling Pages and triggering a new commit.

## Important Rules
1. Do not delete `CNAME`.
2. Keep GitHub Pages on `main / (root)`.
3. Never expose Supabase secret/service-role keys.
4. Manage listings through `admin.html`.
5. Public category pages should load listings from Supabase.
6. Store listing photos in the `listing-images` bucket.
7. Preserve the bold homepage profile border.
8. Preserve the homepage top-alignment CSS override.

## Possible Future Improvements
- Photo slideshow/lightbox
- Reorder photos
- Delete individual photos
- Featured listing flag
- Sold/leased status
- Beds/baths/square footage
- MLS number
- Search/filtering
- Contact form
- SEO metadata
- Better mobile gallery

## Request Details Inquiry Form
- Any “Request details” action opens an on-site inquiry modal.
- Collects name, contact number, email and a brief description.
- Property detail inquiries include the listing title and URL.
- Submissions are routed to `amirkgaran@gmail.com` through FormSubmit.
- FormSubmit requires one-time email activation after the first test submission.
- `inquiry.js` contains the shared inquiry behavior.
- `thank-you.html` is the post-submission confirmation page.
