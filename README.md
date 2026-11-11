# ცის ქვეშ

Georgian weather dashboard built with Next.js App Router and React. City search (including Georgian Samtredia), current conditions, five-day forecast, map, light/dark themes, browser-local favorites and opt-in geolocation. No accounts or API keys.

## Development

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

## Production

```sh
npm run build
npm run preview
```

Next.js exports the site into `out/`. Weather requests run in the browser; no server runtime is required.

Cloudflare Pages: build command `npm run build`, output directory `out`, production branch `main`. The existing GitHub integration deploys pushes automatically.

## Structure

- `app/page.jsx`: dashboard composition
- `app/use-weather.js`: weather, location, theme and favorites state
- `app/search.jsx`, `app/forecast.jsx`, `app/cities.jsx`: interactive React components
- `app/globals.css`: shared responsive styles
- `lib/weather.js`: API helpers and city data
- `public/world.svg`: map asset

Weather/geocoding: Open-Meteo. Reverse geocoding: BigDataCloud (only after location consent). World map: Natural Earth public-domain data. Font: Noto Sans Georgian via Google Fonts, with a system fallback.
