MYINVEST — IPHONE SPEAKER FIX

This version keeps the continuous simple voice assistant and adds iPhone/Safari speech fixes.

WHAT IT FIXES
- Primes iPhone speech output on the first microphone tap.
- Waits for speech recognition/microphone audio to fully stop before text-to-speech begins.
- Explicitly resumes the iPhone speech engine.
- Chooses an available English iPhone voice.
- Adds a short iOS-specific delay when switching between microphone and speaker.
- Keeps automatic listening after the reading finishes.

UPLOAD
Replace ONLY:
voice-assistant.js

in the GitHub root.

No CSS changes.
No SQL changes.
No Supabase changes.

TEST ON IPHONE
1. Open Safari directly (not an in-app browser).
2. Go to https://www.myinvest.ca
3. Refresh the page.
4. Tap the microphone once.
5. Say: "Go to About"
6. When About opens, say: "Read it"

IMPORTANT IPHONE CHECKS
- Make sure iPhone media volume is turned up using the side volume buttons WHILE Safari is open.
- Check Control Center to make sure audio is not routed to Bluetooth/AirPods unexpectedly.
- Safari itself is recommended. Speech recognition can behave differently in embedded iOS web views.

If Safari still produces no speech after this fix, tap the mic once on the About page and say "Read it" again. iOS may require a fresh user interaction after a full page navigation because browser media permissions/user activation are scoped to the current document.
