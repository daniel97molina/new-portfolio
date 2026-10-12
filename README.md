# Portfolio — Daniel Molina

My portfolio and CV. Hand-built with no frameworks and no build step: HTML, CSS and a little
vanilla JavaScript.

**Live:** https://danielmolina.pages.dev/

- `index.html` is the portfolio: a text-mode BIOS setup utility. Each section is a menu tab; the
  tab follows the scroll, ←→ switch menus, ↑↓ select items and Item Specific Help explains them.
  Skills can be toggled with +/−, and F10 "saves and exits" into a Linux boot that fails based on
  what you changed. The Konami code switches to the classic blue BIOS colors.
- `cv.html` is the ATS-friendly CV (one column, standard headings). `cv.pdf` is generated from it.

## Structure

```
index.html        # portfolio content & structure
cv.html / cv.pdf  # the CV and its PDF
css/styles.css    # theme, layout, responsive and print rules
js/main.js        # tab tracking, keyboard, toggles, setup dialogs, restart sequence
fonts/            # self-hosted IBM VGA 8x16 and Atkinson Hyperlegible (see fonts/LICENSES.md)
assets/           # project screenshots and 3D renders
```

## Regenerate the CV PDF

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --no-pdf-header-footer \
  --print-to-pdf=cv.pdf cv.html
```

Keep it at 2 pages, and check the text with `pdftotext -enc UTF-8 cv.pdf -`.

## Deploy

Cloudflare Pages deploys `main` automatically through its Git integration.
