# Portfolio — Kevin Daniel Molina Ramírez

My personal portfolio, which doubles as a printable CV. Hand-built with no frameworks and no
build step — just HTML, CSS and a little vanilla JavaScript.

**Live:** https://danielmolina.surge.sh/

## Highlights

- **Dark "terminal, refined" aesthetic** — Fraunces + JetBrains Mono + Hanken Grotesk, an amber/teal
  palette, subtle grain and glow, and a few tasteful dev easter eggs (try the Konami code).
- **Save-as-PDF flow** — a dedicated print stylesheet keeps the dark theme and lays the page out as a
  clean PDF (`Ctrl/Cmd + P` → *Save as PDF*; leave "Background graphics" on).
- **Zero dependencies** — fonts are the only external request.

## Structure

```
index.html        # all content & structure
css/styles.css    # theme, layout, animations, print stylesheet
js/main.js        # typed headline, scroll reveals, easter eggs
assets/           # project images, 3D renders, ECO Library demo video
```

## Run locally

Just open `index.html` in a browser — no server required.

## Deploy

Static hosting of choice. To publish to surge:

```bash
npx surge . danielmolina.surge.sh
```
