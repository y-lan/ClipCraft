ClipCraft is a tiny, elegant, and beautiful Chrome extension used to select a given element from the current page using a mouse and convert the raw HTML of the selected part into LLM-friendly markdown text, then copy it to the clipboard; it already shows a small message on the right bottom part of the page that auto-disappears. We activate this feature via clicking the extension icon.

## Installation
1. Run `npm install` (only lint/dev). No build step required.
2. Load unpacked extension in Chrome pointing to project root.

## Usage
1. Navigate to any page.
2. Click the extension icon.
3. Hover to highlight desired element, click to copy markdown. Toast appears.
4. Press ESC to cancel the selection if needed.
5. If text is already selected on the page before activating the extension, it will automatically select the minimal DOM element covering all selected text and extract markdown directly.

---
Built with vanilla JS & markdown-it.