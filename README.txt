MYINVEST — IPHONE MENU STATE FIX

Replace ONLY:
script.js

in the GitHub root.

WHY:
The live premium-header.css already has the correct mobile rules.
iPhone Safari can restore the page with the old `.open` menu state from its
back/forward cache. This script explicitly removes `.open`:
- on initial page load
- on Safari `pageshow` restore
- when the tab becomes visible again
- on mobile resize/orientation changes
- after a navigation link is selected

It also changes the premium-header.css query from ?v=2 to ?v=3 to force Safari
to reload the latest CSS.

AFTER UPLOAD:
1. Commit.
2. Wait about 1 minute.
3. On iPhone, CLOSE the MyInvest Safari tab completely.
4. Open a NEW Safari tab.
5. Visit https://www.myinvest.ca

The menu should now be closed until the hamburger is tapped.
