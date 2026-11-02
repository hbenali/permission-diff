# permission-diff

Chrome (Manifest V3) extension that tells you when a site starts using a capability (geolocation, camera/mic, clipboard read, service worker, notifications, WebRTC, screen capture) or loading a third-party domain it did not use on earlier visits.

Status: prototype. Everything stays local (`chrome.storage`); nothing is sent anywhere.

## Try it

`chrome://extensions` → Developer mode → Load unpacked → select this folder. The first visit to a site builds its baseline; later visits show new items on the toolbar badge and in the popup.

## Test

```sh
node --test test/diff.test.mjs
```

## Known gaps

- Naive registrable-domain logic (no public-suffix list).
- No script-hash or behaviour baselining yet.
- Not yet verified in a real browser.
