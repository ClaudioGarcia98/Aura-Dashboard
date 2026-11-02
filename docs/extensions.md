# Aura new-tab extensions

The extension uses the same React application as the website. Its Manifest V3 `chrome_url_overrides.newtab` opens a packaged `index.html`, with local JavaScript, CSS, fonts, icons, and the default video wallpaper. The UI can open offline; live services still need a connection. No service worker, content script, browser-history access, or browser-bookmark access is needed.

## Build and package

Use Node.js 22.12 or newer and the committed lockfile:

```sh
npm ci
npm run build:extensions
npm run lint:extension
npm run test:extension
npm run package:extensions
```

`build:extension:chromium` and `build:extension:firefox` build one target. `package:extensions` rebuilds and validates both targets, runs Mozilla's manifest/code validator, and creates:

- `dist-extensions/chromium/`: unpacked Chrome and Edge extension.
- `dist-extensions/firefox/`: unpacked Firefox extension.
- `dist-extensions/packages/aura-<version>-chromium.zip`: Chrome Web Store / Edge Add-ons upload.
- `dist-extensions/packages/aura-<version>-firefox.zip`: Firefox Add-ons upload.
- `dist-extensions/packages/aura-<version>-source.zip`: source and build instructions for review.
- `dist-extensions/packages/SHA256SUMS.txt`: archive checksums.

The manifest is at each binary archive's root. Version comes from `package.json`. Archive file order and timestamps are deterministic. Normal builds require no font-download step: the licensed font assets are committed under `extensions/assets/fonts/`. A maintainer can deliberately refresh them with `node scripts/vendor-extension-fonts.js`; inspect the resulting files, source URLs, checksums, and licenses before release.

`npm run build` continues to generate the standalone website in `dist/index.html`. Extension builds never overwrite it.

## Install locally

**Chrome:** open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist-extensions/chromium`. Open a new tab and accept the browser's new-tab change confirmation if shown.

**Edge:** use `edge://extensions` → Developer mode → **Load unpacked** with the same Chromium folder. Accept the browser's confirmation of the new-tab change.

**Firefox:** use desktop Firefox 142 or later. Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist-extensions/firefox/manifest.json`. Temporary installations last until Firefox restarts. For persistent installation, submit the ZIP to Mozilla for signing; renaming a ZIP to XPI does not sign it.

Only one enabled extension controls the new-tab page at a time. Disable competing new-tab extensions when testing. Chrome does not replace its incognito new-tab page with an extension page. New tabs initially focus the address bar; Aura does not steal that focus. Its search shortcuts apply once the page has keyboard focus.

## Settings, privacy, and lifecycle

Settings and focus tasks use localStorage; uploaded wallpapers use IndexedDB. Open Aura tabs receive settings and wallpaper changes. Hidden tabs pause background video, and focus chimes coordinate across tabs where Web Locks are available. Lofi starts paused in each new tab. Closing all dashboard tabs stops playback and completion sounds; the saved timer deadline catches up when Aura next opens. Browser-wide playback and background notifications are not part of this package.

The website, each extension installation, and each browser use separate storage. Export settings from the website and import them into the extension to migrate. For an uploaded wallpaper, export an appearance preset with its wallpaper or upload the original file. Full settings backups do not contain focus tasks or wallpaper blobs. Browser upgrades preserve the installed extension's data; uninstalling/reinstalling or changing its identity may not.

See [the privacy disclosure](../extensions/PRIVACY.md) for network recipients and data. Firefox requests optional data-transmission consent before sending personal feature data. Device GPS requires its own optional permission; city-based weather remains available without GPS. Search suggestions remain off by default.

## MyAnimeList relay

The frontend uses the existing Cloudflare Worker, whose source is under `workers/mal`. Deploy the extension-compatible Worker before claiming live MAL support for a release. The Worker accepts syntactically valid browser extension origins in addition to the website and localhost, while retaining its fixed upstream/path/query validation, bounded responses, caching, and rate limits. Extension origins are not credentials or an authentication mechanism, and Firefox runtime origins vary by installation. See [Worker deployment instructions](../workers/mal/README.md).

## Validation and release checks

The extension smoke suite launches Playwright's bundled Chromium with a persistent profile and loads the unpacked package. It checks actual `chrome://newtab` routing, local/offline startup, CSP, persistence, multiple tabs, and controlled service responses. The website suite remains separate: run `npm run build` followed by `npm run test:browser`.

`lint:extension` invokes Mozilla's `addons-linter`. It fails on errors or unexpected warnings. Two audited warnings about React DOM's unused `dangerouslySetInnerHTML` implementation are allowed only in the separate React vendor chunk and only at its `__html` assignments; Aura does not use that API. The source archive lets reviewers inspect this distinction.

Controlled YouTube responses verify the iframe message contract, not real playback or provider policy acceptance. Before each store submission, load the actual release package in Chrome, Edge, and Firefox and record these checks:

- A real new tab shows Aura, leaves the address bar focused, and has no manifest/CSP errors.
- The shell, selected bundled font, saved tasks, and uploaded wallpaper work offline.
- Settings and wallpaper changes propagate to another open tab and survive restart/update.
- Denied and revoked Firefox data permissions stop the relevant requests. GPS denial leaves city-based weather usable.
- Real weather, AniList, MAL refresh, quotes, favicon requests, and opt-in suggestions behave as described.
- Real YouTube Lofi/trailers play after a user gesture, volume/mute work, and pause/teardown work. Check for YouTube error 153 (missing HTTP Referer or client identity), origin rejection, blocked autoplay, and disabled embeds. The recommended referrer policy is set, but extension-origin playback still requires real-browser verification. Do not spoof website identity to work around provider restrictions.
- Import/export, reset, two simultaneous focus completions, and extension upgrades behave correctly.

## Store submission

Prepare developer accounts, listing screenshots, a description identifying the new-tab replacement, support links, and a publicly accessible copy of the privacy disclosure. Upload the Chromium ZIP separately to Chrome Web Store and Edge Add-ons. Upload the Firefox ZIP and the source archive to Mozilla; build instructions are included in this document. The Firefox ID `aura-dashboard@claudiogarcia98` is stable and must remain unchanged after publication.

The package requests only the listed API hosts, optional geolocation, and Firefox's declared optional data categories. Explain each in store disclosures. No store credentials, signing keys, or upload tokens belong in the repository. Packaging does not publish, sign, or deploy anything; releases require the appropriate store review and signing process.

References: [Chrome new-tab pages](https://developer.chrome.com/docs/extensions/develop/ui/override-chrome-pages), [extension CSP](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy), [Playwright extension testing](https://playwright.dev/docs/chrome-extensions), [Firefox consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/), [Firefox source review](https://extensionworkshop.com/documentation/publish/source-code-submission/), [YouTube client identification](https://developers.google.com/youtube/terms/required-minimum-functionality#api-client-identity-and-credentials).
