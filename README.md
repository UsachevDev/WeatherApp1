# WeatherApp

A modern, glassmorphism weather dashboard built with **HTML + CSS + vanilla JavaScript** — no frameworks, no build step.
It features live current conditions, an hourly forecast, a 7-day outlook, and a background that shifts with the weather and time of day.

**Live demo:** https://usachevdev.github.io/WeatherApp1/

**Data:** [Open-Meteo](https://open-meteo.com/) (free, no API key)
- Forecast: `https://api.open-meteo.com/v1/forecast`
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Reverse geocoding (for the "use my location" button): [BigDataCloud](https://www.bigdatacloud.com/)

---

## Features

- 🔍 **City search with autocomplete** — debounced suggestions, full keyboard support (↑ / ↓ / Enter / Esc) and mouse.
- 📍 **Use my location** — one tap geolocation with graceful fallback if permission is denied.
- 🌡️ **Unit switch** — toggle between °C / m/s / hPa / km and °F / mph / inHg / mi; the choice is remembered.
- ⛅ **Current conditions** — temperature, description, "feels like", and today's high / low.
- 📊 **Six metric cards** — humidity, wind, pressure, visibility, sunrise and sunset.
- 🕒 **24-hour forecast** — horizontal, scroll-snapping slider with the current hour highlighted.
- 📅 **7-day forecast** — daily icons plus a temperature-range bar for each day.
- 🎨 **Dynamic background** — an animated gradient that adapts to the weather group and day / night.
- 💎 **Glassmorphism UI** — frosted panels with `light` / `dim` / `solid` presets via CSS tokens.
- ⏳ **Polished states** — shimmering loading skeletons and toast notifications for errors.
- 📱 **Fully responsive** — fluid layout from 360px phones to widescreen desktops.
- ♿ **Accessible** — visible focus rings, ARIA roles on the search listbox, and `prefers-reduced-motion` support.
- 💾 **Persistent** — the last viewed location and unit preference are saved to `localStorage`.

---

## Run locally

No bundler required — it's a static site.

```bash
# Option 1 (Node)
npx http-server . -p 5500 -c-1

# Option 2 (Python 3)
python -m http.server 5500
```

Then open **http://localhost:5500/** (the root redirects to the app) or go straight to
**http://localhost:5500/src/index.html**.

> In VS Code you can also use the **Live Server** extension and open `src/index.html` directly.

---

## Project structure

```
public/
  images/
    icons/
      logo.svg
      weather/                # 01d.png … 50n.png (Open-Meteo code icons)
src/
  index.html
  scripts/
    main.js                   # app logic: API, state, rendering, interactions
  styles/
    globals/
      reset.css
      variables.css           # design tokens (colors, glass, spacing, type)
      layout.css              # shell + dynamic background palettes
    blocks/
      stage.css  header.css  weather.css  card.css
      slider.css  daily.css   footer.css  # (footer.css holds toast + skeleton)
    main.css                  # @import manifest
index.html                    # root redirect → src/index.html (local convenience)
```

---

## Theming & tokens

All design tokens live in [`src/styles/globals/variables.css`](src/styles/globals/variables.css).

Switch the glass frosting preset on the `<body>`:

```html
<body data-glass="dim">   <!-- options: dim (default), solid -->
```

Key tokens:
- `--panel-bg`, `--frost`, `--frost-strong` — panel and element fills.
- `--glass-blur`, `--glass-radius`, `--glass-stroke`, `--glass-inner` — glass behavior.
- `--txt-glow-weak` / `--txt-glow-strong` / `--txt-temp` — text legibility over imagery.
- `--bg-a` / `--bg-b` / `--bg-c` — background gradient stops, swapped per weather in `layout.css`.

---

## Deployment

A GitHub Actions workflow ([`.github/workflows/pages.yml`](.github/workflows/pages.yml)) builds a flat `dist/`
from `src/` + `public/`, rewrites the asset paths, and publishes to GitHub Pages on every push to the deploy branch.

1. **Settings → Pages → Build and deployment:** set **Source = GitHub Actions**.
2. Push to the branch configured in the workflow — the site deploys automatically.

---

## Accessibility notes

- Focus is shown on the search container (`.search:focus-within`) to avoid a double border on the input.
- Suggestions use a `listbox` / `option` pattern with arrow-key and mouse navigation.
- `prefers-reduced-motion: reduce` disables all animations and transitions.
- Soft `text-shadow` tokens keep text readable over bright backgrounds.
