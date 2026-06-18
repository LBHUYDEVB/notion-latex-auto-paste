# Security Policy

## Reporting Security Issues

Please open a GitHub issue if you find a security problem. Do not include private notes, tokens, account data, or sensitive clipboard content in the issue body.

## Security Model

This extension is intentionally small:

- No background service worker.
- No external server.
- No analytics.
- No remote code loading.
- No Chrome storage usage.
- No broad `tabs`, `history`, `cookies`, or `clipboardRead` permissions.

The code only transforms LaTeX-like text during a user-initiated copy or paste flow.

## Known Limits

Chrome does not allow extensions downloaded from GitHub to install themselves automatically. Users must load the unpacked extension manually or install a future Chrome Web Store version.
