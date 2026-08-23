MYINVEST — EDITABLE INSIGHTS UPDATE

WHAT THIS DOES
- Adds an Insights manager directly inside https://www.myinvest.ca/admin.html
- Lets you add, edit, publish/hide, reorder and delete Insight articles
- Public https://www.myinvest.ca/insights.html loads the content from Supabase
- Seeds the seven existing topics so you do not lose the current content
- No Edge Function or Resend changes are required

STEP 1 — SUPABASE
Open Supabase -> SQL Editor -> New query.
Paste and run:
supabase-insights-migration.sql

You should get Success.

STEP 2 — GITHUB
Upload these files to the ROOT of your GitHub repository:
- script.js (replace)
- insights.html (replace)
- insights.css (replace)
- insights.js (new)
- admin-insights.js (new)

You do NOT need to upload the SQL file to GitHub.

STEP 3 — REFRESH
After GitHub Pages deploys:
https://www.myinvest.ca/admin.html

Use Ctrl+Shift+R once if needed.

A new "Insights" panel will appear in Admin.

HOW TO FORMAT AN ARTICLE
Normal text = paragraph.

Numbered steps:
1. First step
2. Second step

Bullet points:
- First point
- Second point

DISPLAY ORDER
10 = before 20.
20 = before 30.
You can use any whole number.

PUBLISH
Uncheck "Publish on website" to keep an article in Admin but hide it publicly.
