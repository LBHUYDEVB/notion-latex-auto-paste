# Notion LaTeX Auto Paste

Notion LaTeX Auto Paste is a small Chrome extension for students and note-takers who copy math-heavy answers into Notion.

It fixes common LaTeX clipboard formats before Notion handles the paste, so copied ChatGPT answers and multiline formulas render as Notion equations with much less manual cleanup.

## What It Does

- Converts multiline LaTeX formulas into Notion-friendly single-line formulas.
- Handles ChatGPT "copy response" output with headings, lists, prose, inline formulas, and display formulas.
- Handles formulas copied from other LaTeX helper extensions.
- Supports `$...$`, `$$...$$`, `\(...\)`, and `\[...\]`.
- Preserves Markdown structure such as headings, paragraphs, lists, and code blocks.
- Avoids touching fenced code blocks, inline code, prices, and ordinary dollar signs.

Example:

```text
$f(\omega)
\approx
\sum_i c_iB_i(\omega)$
```

When pasted into Notion, it becomes:

```text
$$f(\omega) \approx \sum_i c_iB_i(\omega)$$
```

Notion then performs the actual equation rendering.

## Install From The ZIP Package

Download the release ZIP, unzip it, then load the extracted folder in Chrome:

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the extracted folder that contains `manifest.json`.
5. Refresh any open Notion pages.

Important: Chrome does not allow a GitHub-downloaded extension to install itself automatically. Loading the unpacked folder is the closest safe install path outside the Chrome Web Store.

## Windows Quick Start

1. Download `notion-latex-auto-paste-0.6.2.zip`.
2. Right click the ZIP and choose **Extract All**.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Choose the extracted folder.
7. Refresh Notion.

## Build From Source

```sh
npm install
npm run build
npm run test:node
```

The installable extension is generated in `dist/`.

## Privacy

This extension is designed to work locally in your browser.

- It does not upload clipboard content.
- It does not store clipboard history.
- It does not use a server.
- It does not request broad browser permissions.
- It only runs on Notion pages and ChatGPT pages listed in `manifest.json`.

See [PRIVACY.md](PRIVACY.md) for the full privacy note.

## Security Notes

The extension has no background worker, no remote code loading, and no analytics. The ChatGPT helper only normalizes text that ChatGPT is already writing to the clipboard. The Notion helper only reads the current paste event data and immediately hands normalized text back to Notion.

See [SECURITY.md](SECURITY.md) and [docs/SECURITY-REVIEW.md](docs/SECURITY-REVIEW.md).

## License

MIT. See [LICENSE](LICENSE).
