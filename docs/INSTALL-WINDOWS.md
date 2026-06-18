# Windows Install Guide

This package cannot install itself automatically because Chrome blocks automatic extension installation from downloaded files.

Use this safe manual install flow:

1. Download `notion-latex-auto-paste-0.6.2.zip`.
2. Right click the ZIP file.
3. Choose **Extract All**.
4. Open Chrome.
5. Go to `chrome://extensions`.
6. Turn on **Developer mode** in the top right.
7. Click **Load unpacked**.
8. Select the extracted folder that contains `manifest.json`.
9. Refresh Notion.

After that, paste LaTeX or ChatGPT answers into Notion as usual.

## Updating

1. Download the newer ZIP.
2. Extract it.
3. Open `chrome://extensions`.
4. Click **Remove** on the old unpacked version, or click its reload button if you extracted over the same folder.
5. Load the new extracted folder.
