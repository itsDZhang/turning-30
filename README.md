# David turns 30 on a mountain 🏂

Mobile-first invite site for a 30th-birthday snowboarding trip to **Banff Sunshine Village**, Jan 15–18, 2027 (MLK weekend).

**Live:** https://itsdzhang.github.io/turning-30/

## Stack
Plain HTML, CSS, and vanilla JS. No build step, no dependencies beyond Google Fonts.
Visuals are CSS gradients, inline SVG mountains with scroll parallax, and a canvas snow/star field.

## Files
- `index.html` — the page
- `styles.css` — mobile-first styles, scene colour transitions, reduced-motion support
- `app.js` — countdown, scroll reveals, counters, parallax, live USD→CAD rate (falls back to 1.37), share, confetti
- `david-turns-30.ics` — "Add to calendar" event
- `assets/og.png` — link preview image (rendered from `assets/og.html`)

## Local preview
```sh
python3 -m http.server 8080
# open http://localhost:8080
```

Resort facts are from public sources and may change; confirm at https://www.skibanff.com.
