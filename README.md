# Photographic Eye Lab

Independent, offline-capable visual photography course. Train the ability to find a photograph in an ordinary place: subject, light, relationships, visual hierarchy, exclusion and composition.

## Open

**Live site:** https://acsbalan.github.io/Photographic-Eye-Lab/

On iPhone open in Safari, select Share → Add to Home Screen. Load the course once while online, then the service worker caches the entire application for offline use. Offline status is shown inside the app. Learning progress is saved locally in the browser; backup/restore is available from Settings.

## Course

Nine structured lessons, guided scene discovery, interactive composition and crop laboratory, fieldwork drills including Harold Wood Park, assessments, notebook and progress history. The illustrations are synthetic training images; they are not actual photographs of Harold Wood Park. Content is original and not copied from photography textbooks.

## Files

- `index.html` — app shell
- `styles.css` — interface design
- `data.js` — original lessons, scenes, prompts, fieldwork and questions
- `app.js` — interactions, feedback, progress, export/import
- `scenes/` — four included photographs used offline
- `sw.js` — offline caching
- `manifest.webmanifest` and `icons/` — install support
- `.github/workflows/pages.yml` — GitHub Pages publication

Everything runs without a backend, login or external CDN. Progress is device-specific unless exported/imported. Editing an image after capture is different from physically changing the camera's viewpoint; crop exercises only simulate framing, not perspective change.
