# Privacy policy: Permission Diff

_Last updated: 2026-11-02_ · Published version: https://www.hbenali.ovh/permission-diff-privacy.html (English and French)

Permission Diff runs entirely in your browser. **It does not send any data anywhere.** There is no server, no account, no analytics and no telemetry.

## What it stores

For each website you visit it keeps, on your device only (`chrome.storage.local` and `chrome.storage.session`):

- the site's hostname (for example `example.com`);
- the hostnames of third-party domains that the page requested resources from;
- the names of browser capabilities the page used (for example `geolocation`, `webrtc`).

It does not store page content, URLs with paths or query strings, form data, cookies, passwords or your identity.

## Why it needs its permissions

- **All sites (`<all_urls>`)**: to observe capability use and requests on the pages you visit, so it can tell you what changed.
- **webRequest**: to see which third-party hosts a page contacts. It only observes; it never blocks or modifies requests.
- **webNavigation, tabs**: to know when a page visit starts and ends, and to show the result for the active tab.
- **storage**: to keep the per-site baseline on your device.

## Your control

The popup has a **Clear stored data** button that deletes everything the extension has stored. Removing the extension also deletes it.

## Changes and contact

If this policy changes, the date above changes and the change is visible in the repository history: https://github.com/hbenali/permission-diff. Questions: open an issue there.
