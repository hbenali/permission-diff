# Publishing

The Chrome and Firefox zips come from `scripts/build.mjs` (different background keys per browser). Push a tag `X.Y.Z` that equals `manifest.json` `version`. `.github/workflows/publish.yml` then tests, lints and zips, drafts a GitHub release with the zip, and submits to both stores. Sign the tag: `git tag -s X.Y.Z -m X.Y.Z`. Publish the draft release by hand with notes.

## One-time setup (cannot be automated)

1. **Chrome Web Store** (also serves Brave and other Chromium browsers): create the item and fill the listing and privacy tabs once in the developer dashboard, upload the first zip by hand, then create OAuth credentials (Chrome Web Store API) and a refresh token.
2. **Firefox (AMO)**: submit the first version by hand at addons.mozilla.org (listing, categories, license); then create API keys under Developer Hub → API keys.
3. Add repository secrets: `CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `AMO_JWT_ISSUER`, `AMO_JWT_SECRET`.
4. Optional: add required reviewers to the `chrome-web-store` and `firefox-amo` environments so a tag push waits for approval.

Store review still applies: Chrome and AMO may take days, and a rejected version is reported in each dashboard, not in the workflow.

## Status

The workflow has not been run end to end: no secrets are configured and nothing has been tagged.
