# Security policy

## Supported versions

Only the latest release receives security fixes. Please upgrade before reporting an issue you found in an older version.

| Version | Supported |
| --- | --- |
| Latest release ([GitHub releases](https://github.com/hbenali/permission-diff/releases/latest)) | yes |
| Anything older | no |

## Reporting a vulnerability

**Please don't open a public issue or pull request for a security problem.** Report it privately, either:

- through GitHub: **[Report a vulnerability](https://github.com/hbenali/permission-diff/security/advisories/new)** (private vulnerability reporting), or
- by email to **contact@hbenali.ovh** with the subject `permission-diff security`.

Include what you can of:

- the affected version and how it is run (install method, flags, environment);
- what an attacker can do and what they need (network access, valid credentials, ...);
- steps or a proof of concept to reproduce it.

## What to expect

- an acknowledgement within **3 working days**;
- an assessment and, if it is a vulnerability, a fix plan within **10 working days**;
- a fix released as soon as it is ready and verified, with the release notes describing the problem and how to mitigate it, crediting you if you wish;
- coordinated disclosure: please keep details private until a fixed release is available.

This is a volunteer-maintained project; there is no bug bounty.

## Scope

In scope: the Permission Diff extension (all files in this repository) and the zips published by its release workflow. Typical findings: the extension leaking the data it stores (hostnames, capability names) to a page or another origin, a web page being able to forge or suppress its reports, running attacker-controlled code in the extension context, or permissions broader than the documented purpose.

Out of scope: issues that require an already-compromised browser or host; missing hardening with no concrete impact; vulnerabilities in third-party dependencies with no demonstrated impact here (this project has no runtime dependencies).

## How security is checked here

CodeQL (code scanning, including the GitHub Actions workflows), Trivy (dependencies, secrets and configuration), OpenSSF Scorecard and Dependabot run on every push and on a schedule; results are in the repository's Security tab. Release tags are signed and releases are immutable.

## Past security fixes

Fixed vulnerabilities are described in the [release notes](https://github.com/hbenali/permission-diff/releases).
