# Security Policy

## Supported Versions

Only the latest published release of the ApiTab browser extension is
supported with security fixes. Please update to the latest version (Options
page → About, or your browser's extension store) before reporting an issue.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, email **apon2041@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (a minimal repro is very helpful)
- The extension version and browser/OS you tested on

You should receive an acknowledgment within a few days. Once a fix is
confirmed, a new release will be published and, where appropriate, credit
given to the reporter (unless you'd prefer to stay anonymous).

## Scope

ApiTab is a local-first extension: requests and workspace data (collections,
environments, history) are stored in `browser.storage.local` and never leave
the device unless you explicitly enable the optional team-sync feature, which
talks to the [apitab-server](https://github.com/AponAhmed/apitab-server)
backend over HTTPS. Vulnerabilities of particular interest include:

- Anything allowing script injection into the extension's own pages
  (`app.html`, popup, options)
- Anything that could exfiltrate stored requests/collections/environment
  variables to a third party
- Auth/token handling issues in the optional team-sync flow
- Manifest/permission issues that grant broader host access than intended
