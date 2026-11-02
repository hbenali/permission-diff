# permission-diff

Chrome (Manifest V3) extension that tells you when a site starts using a capability (geolocation, camera/mic, clipboard read, service worker, notifications, WebRTC, screen capture) or loading a third-party domain it did not use on earlier visits.

Status: prototype. Everything stays local (`chrome.storage`); nothing is sent anywhere.

## Features

- Flags new third-party domains and newly used capabilities (geolocation, camera/mic, clipboard read, service worker, notifications, WebRTC, screen capture) compared with your earlier visits.
- **Script change detection:** external scripts are hashed (SHA-256, truncated); a known script URL whose content changed is flagged. Brand-new scripts are not (new origins are covered by the domain diff). Sites that serve different content per request, or rotate content-hashed file names, can give false positives or no signal.
- **Trust and mute:** mark an item (or all items of a kind) as expected for a site, or mute a site's badge.

## Try it

**Chrome / Brave:** `chrome://extensions` (`brave://extensions`) → Developer mode → Load unpacked → select this folder.

**Firefox:** run `node scripts/build.mjs`, then `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `build/firefox/manifest.json`; click the toolbar icon and grant site access.

 The first visit to a site builds its baseline; later visits show new items on the toolbar badge and in the popup.

## Test

```sh
node --test test/diff.test.mjs
```

Privacy policy: [PRIVACY.md](PRIVACY.md), published at https://www.hbenali.ovh/permission-diff-privacy.html (the URL for store listings). Icons: `icons/icon.svg` is the source; the PNGs are rendered from it.

License: [MIT](LICENSE).

## Known gaps

- Naive registrable-domain logic (no public-suffix list).
- No behavioural baselining yet (what a script does, not only its bytes).
- Not yet verified in a real browser.
