# ცის ქვეშ

Static Georgian weather website with city search, current weather, and a five-day forecast (the next five days, plus today's current conditions). No accounts or API keys.

## Local preview

Run `python3 -m http.server 3000`, then visit http://localhost:3000.

## Cloudflare Pages

Connect the GitHub repository in Cloudflare Pages. Select no framework, leave the build command empty, and set the output directory to `/`. Alternatively, deploy the static assets using Wrangler Pages.

Publish these files: `index.html`, `style.css`, `app.js`, `world.svg`.

Weather and geocoding: [Open-Meteo](https://open-meteo.com/) (free endpoint for non-commercial use). World map: Natural Earth public-domain geographic data via datasets/geo-countries. Google Fonts supplies Noto Sans Georgian; the system sans-serif is used if unavailable.
