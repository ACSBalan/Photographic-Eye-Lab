# Photo Field Guide

An independent offline photography field guide, published at the `field-guide/` subdirectory of the existing GitHub Pages repository.

## Features

- 80 original scene guides across eight categories.
- Exposure and focus starting points, checklists, composition suggestions, troubleshooting, kit requirements and field notes.
- Sony a6700 guidance, with full-frame and phone adaptation notes.
- 12 photo rescue workflows and 16 quick-reference cards.
- ND exposure, interval planning and aperture/shutter equivalence calculators.
- Saved scenes, tried guides, autosaved notes, JSON backup and merging import.
- Dark, light and dim red themes; responsive design; home-screen installation; offline photo assets.

All content and assets are local. No backend, account, analytics, remote fonts or external JavaScript dependencies are required. External references and photo credit links need an internet connection. Clearing site data can remove the fieldbook; export a backup first.

## Implementation

`index.html`, `styles.css` and `app.js` implement the interface. `data.js` contains independently authored scene guidance and photo credits. `reference.js` provides the rescue and quick-reference content. `calculators.js` contains the three calculation functions. `sw.js` caches the complete app and only removes caches within its own namespace.

The app has a separate manifest identity, worker scope and localStorage key. A bootstrap in `app.js` handles a pre-existing parent Eye Lab service worker returning the parent HTML on the first visit: it installs the narrower worker, then reloads the correct app shell. The parent app files are not modified.

Settings are editorial starting points, not measured exposures or guarantees. Primary sources appear in each guide and in About. Photographs are licensed from Unsplash with individual credits in the app; they illustrate categories, not predicted results.

## Development

Serve this directory over HTTPS or localhost. No build step is required. When changing cached files, bump the cache version in `sw.js`. Keep all local asset references relative so GitHub Pages project subdirectories remain supported.
