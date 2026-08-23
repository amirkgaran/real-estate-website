MYINVEST — VOICE ASSISTANT UPDATE

WHAT THIS ADDS
- Site-wide Voice button on all public pages
- Voice navigation between Home, About, Webinars, Insights, Contact and investment categories
- Reads Insight articles aloud
- Pause / resume / stop reading
- Lists upcoming webinars aloud
- Guided webinar registration by voice
- Shows Residential homes for sale or lease
- Reads current listing summaries
- Guided inquiry / request-details form by voice
- Typed command box as a fallback
- Final confirmation is required before submitting a webinar registration or inquiry

NO SUPABASE SQL CHANGES ARE REQUIRED.
NO EDGE FUNCTION CHANGES ARE REQUIRED.
NO API KEY IS REQUIRED.

UPLOAD TO GITHUB ROOT
1. script.js              REPLACE the existing file
2. voice-assistant.js     NEW
3. voice-assistant.css    NEW

After GitHub Pages deploys, open:
https://www.myinvest.ca

Then press Ctrl+Shift+R once.

TEST
1. Click Voice
2. Click Speak
3. Allow microphone access when Chrome asks
4. Try:
   "Go to Insights"
   "Read the Buying article"
   "Stop reading"
   "What webinars are coming up"
   "Register for the next webinar"
   "Show homes for sale"
   "Read listings"
   "Request details"

IMPORTANT
- The visitor must grant microphone permission to the browser.
- Voice recognition support depends on the browser. Chrome and Edge generally work best.
- Typed commands remain available when voice recognition is unavailable.
- Registration and inquiry submission are NEVER sent immediately from the first voice command. The assistant fills the form, reads back key details and requires the visitor to confirm.
