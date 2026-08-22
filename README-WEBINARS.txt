MYINVEST WEBINAR UPDATE
========================

What this adds
--------------
1. A Webinars tab is automatically added to the website navigation by script.js.
2. webinars.html shows published upcoming webinars with day, date, time and registration.
3. Visitors register with name, email and contact number.
4. Registrations are stored privately in Supabase.
5. A welcome email is sent automatically after registration.
   - If the meeting link already exists, the welcome email includes it.
   - If the link is not ready, the welcome email says it will be emailed later.
6. Admin -> Webinars lets you:
   - create/edit/delete webinars
   - set date/time/description
   - publish/unpublish
   - see registrations
   - add the Zoom/Google Meet/etc. link
   - click "Send link" to email the access link to every registrant

STEP 1 — GitHub
---------------
Upload these ROOT files to the GitHub repository root, replacing existing files when applicable:
- index.html
- admin.html
- admin.js
- script.js
- webinars.html
- webinars.js
- webinars.css
- admin-webinars.js

Do NOT upload the Supabase function source folders into the website root unless you want to keep them in source control. They do not run from GitHub Pages.

STEP 2 — Supabase database
--------------------------
Supabase -> SQL Editor -> New query
Run the full contents of:
  supabase-webinars-migration.sql

STEP 3 — Resend account/domain
------------------------------
Create a Resend account and verify the myinvest.ca domain.
A recommended sender is:
  Amir Geran <webinars@myinvest.ca>

Create a Resend API key.
Do NOT place the API key in GitHub or config.js.

STEP 4 — Supabase Edge Function secrets
----------------------------------------
Supabase -> Edge Functions -> Secrets
Add:
  RESEND_API_KEY = your Resend API key
  EMAIL_FROM = Amir Geran <webinars@myinvest.ca>

STEP 5 — Create the public registration function
-------------------------------------------------
Supabase -> Edge Functions -> Deploy a new function -> Via Editor
Name:
  webinar-register
Paste the code from:
  supabase/functions/webinar-register/index.ts
Deploy it.

IMPORTANT: webinar-register is a public registration endpoint. In the function settings/configuration, disable JWT verification (equivalent to --no-verify-jwt).

STEP 6 — Create the admin send-link function
---------------------------------------------
Supabase -> Edge Functions -> Deploy a new function -> Via Editor
Name:
  webinar-send-link
Paste the code from:
  supabase/functions/webinar-send-link/index.ts
Deploy it with JWT verification disabled as well (equivalent to --no-verify-jwt).
The function still requires the signed-in administrator token and verifies the user plus is_site_admin() inside the function. This avoids exposing admin actions while remaining compatible with Supabase's newer publishable keys.

STEP 7 — Test
-------------
1. Open https://www.myinvest.ca/admin.html
2. Sign in.
3. Create a webinar without a meeting link.
4. Open https://www.myinvest.ca/webinars.html
5. Register with an email address you can check.
6. Confirm the welcome email arrives and says the link will be sent later.
7. Return to Admin, edit the webinar, add the Zoom/Meet link and save.
8. Click "Send link" on that webinar.
9. Confirm the registrant receives the access-link email.

Security
--------
- The Resend API key stays only in Supabase Edge Function Secrets.
- Supabase secret/service-role credentials are never placed in the website.
- Public visitors cannot read the registration table.
- Only authenticated MyInvest site admins can view registrants or trigger link emails.
