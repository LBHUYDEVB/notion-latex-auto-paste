# Security Review

Review date: 2026-06-18

## Summary

No high-risk behavior was found in the current source tree.

The extension is a local clipboard-formatting helper. It does not include a background process, server communication, analytics, telemetry, persistent storage, or remote code loading.

## Manifest Review

`manifest.json` declares content scripts for:

- Notion web pages
- ChatGPT web pages

It does not request these higher-risk extension permissions:

- `tabs`
- `history`
- `cookies`
- `clipboardRead`
- `storage`
- `webRequest`
- `scripting`

## Source Review

Checked for common risk patterns:

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `sendBeacon`
- `eval`
- `new Function`
- `chrome.storage`
- `localStorage`
- `indexedDB`
- cookie access

None are used by the extension source.

## Clipboard Behavior

The Notion content script reads clipboard text from the active paste event. It does not read clipboard history.

The ChatGPT content script wraps `navigator.clipboard.write` and `navigator.clipboard.writeText` on `chatgpt.com` so text ChatGPT is already copying can be normalized before being written to the clipboard.

## Remaining Trust Considerations

The ChatGPT helper is broader than the Notion-only design because it patches clipboard writes on ChatGPT pages. This is useful for ChatGPT's copy button, but it should be explained clearly in the README and privacy policy.

For a future Chrome Web Store release, a Notion-only variant would have the smallest permission surface.
