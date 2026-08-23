MYINVEST — CONTINUOUS SIMPLE VOICE

WHAT CHANGES
- Tap the microphone ONCE to start.
- The assistant keeps listening after commands automatically.
- It also continues after navigating to another MyInvest page.
- Say "stop listening", "goodbye", or simply "stop" to turn the voice session off.
- Tapping the microphone again also turns it off.
- No OpenAI API is used. No paid AI is required.

UPLOAD
Replace ONLY this file in the GitHub root:
voice-assistant.js

No SQL changes.
No Supabase Edge Function changes.
No CSS changes.
No script.js changes.

TEST
1. Open https://www.myinvest.ca
2. Ctrl+Shift+R
3. Tap the mic once
4. Say "Go to Insights"
5. When the new page loads, say "Read the Buying article" WITHOUT tapping the mic again.
6. After it finishes, say "Go to Webinars" WITHOUT tapping again.
7. Say "Stop listening" to end the session.

NOTE
Browsers can occasionally stop speech recognition on their own. This version automatically restarts it while the voice session is active.
During long text-to-speech reading, the microphone pauses so it does not hear the website's own voice. It resumes automatically when reading finishes. You can tap the mic to stop immediately during a long reading.
