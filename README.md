# MACSEKY Website Refresh

A refreshed static multi-page website for the existing GitHub Pages project. It preserves the current filenames and external links and adds shared styles/scripts.

## Included
- `index.html`, `about.html`, `videos.html`, `rules.html`, `support.html`, `shop.html`, `contact.html`
- `assets/css/style.css`: responsive shared design system
- `assets/js/site.js`: shared responsive navigation and current year
- `assets/js/stats.js`: live-stat loading, refresh, timeouts, graceful errors
- `backend/worker.js`: optional server-side Kick API proxy starter

## Install into the current repository
1. Make a backup or create a branch in GitHub before replacing files.
2. Upload/replace the listed HTML files and add the `assets/` and `backend/` folders.
3. Keep your existing `logo.png` and `videos/` folder. They are intentionally not duplicated in this ZIP; existing media paths are preserved where applicable.
4. GitHub Pages can serve the front end, but it cannot safely store Kick OAuth secrets.

## Live statistics status
The browser-side fallback attempts `https://kick.com/api/v2/channels/macseky`. It may be blocked by CORS or rate limits and therefore is not a guaranteed data source. The UI will show an error state rather than fabricate numbers.

For a more reliable connection, deploy `backend/worker.js` as a Cloudflare Worker and configure its secrets `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, plus vars `KICK_CHANNEL_SLUG=macseky` and `ALLOWED_ORIGIN=https://albetar25-a11y.github.io`. Check the current Kick developer documentation at https://docs.kick.com for API app setup, permissions, response schemas, and OAuth requirements before deployment. Then set `window.MACSEKY_CONFIG.statsEndpoint` in `index.html` to the Worker URL ending in `/api/stats`.

Do not put OAuth client secrets in browser JavaScript or commit them to GitHub. The Worker starter must be deployed and tested with your own Kick developer app before treating live stats as production-ready.

## Validation performed
- Source files were created and reviewed for consistent filenames, navigation targets, and DOM IDs.
- External live API connectivity and CORS could not be verified in this build environment.
- The Worker requires valid Kick developer credentials and must be tested after deployment.
