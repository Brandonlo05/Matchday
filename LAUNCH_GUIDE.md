# Monday Morning Launch Guide
## Universal MatchDay Shovel — World Cup 2026 PWA

---

## STEP 0 — Prerequisites (one-time, ~2 min)

Make sure you have the following on your M1 Mac:

```bash
# Verify Node.js ≥ 18
node --version          # should print v18.x or higher

# If not installed, install via nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# Verify npm ≥ 9
npm --version

# Install Vercel CLI globally (for one-click deploy)
npm install -g vercel

# Install Netlify CLI globally (optional alternative)
npm install -g netlify-cli
```

---

## STEP 1 — Open the project in Cursor

```bash
# Navigate to the project folder
cd ~/Documents/Claude/Projects/World\ Cup\ app

# Open in Cursor
cursor .
```

---

## STEP 2 — Install dependencies

```bash
npm install
```

Expected output: `added N packages` with zero vulnerabilities.
If you see peer dependency warnings about `vite-plugin-pwa`, ignore them — they're informational.

---

## STEP 3 — Start the dev server

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/    ← use this URL on your phone
  ➜  PWA:     enabled  (service worker active in dev)
```

**Test on your iPhone right now:**
1. Make sure your phone is on the same WiFi as your Mac.
2. Open Safari → go to `http://192.168.x.x:5173/`
3. Tap the Share button → **Add to Home Screen** → **Add**
4. You now have the PWA installed as a native-looking app icon.

---

## STEP 4 — Generate PWA icons (required before deploy)

The app needs icon files at `/public/pwa-192x192.png` and `/public/pwa-512x512.png`.

**Quickest method — use the free PWA Asset Generator:**

```bash
# Install
npm install -g pwa-asset-generator

# Generate from the existing SVG favicon
npx pwa-asset-generator public/favicon.svg public/ \
  --background "#09090b" \
  --padding "20%" \
  --manifest public/manifest.json \
  --index index.html
```

This creates all icon sizes + updates the manifest automatically.

**Alternative:** Use https://maskable.app to design a maskable icon, then https://realfavicongenerator.net to export all sizes.

---

## STEP 5 — TypeScript check (zero errors before deploy)

```bash
npm run typecheck
```

Expected output: silence (no output = no errors).

If you see errors, the most common ones and fixes:

| Error | Fix |
|---|---|
| `Cannot find module '../types'` | Confirm `src/types.ts` exists |
| `Property 'X' does not exist on type 'Y'` | Check type imports match between files |
| `Module '"./components/CityTabs"' has no exported member 'CityTabItem'` | Ensure `export interface CityTabItem` is in `CityTabs.tsx` |

---

## STEP 6 — Production build

```bash
npm run build
```

Expected output ends with:
```
✓ built in Xs
dist/index.html                    X kB
dist/assets/index-[hash].js       XX kB │ gzip: XX kB
dist/assets/index-[hash].css      XX kB │ gzip: X kB
PWA v0.x.x
mode      generateSW
...
```

**Inspect the bundle:**
```bash
# Preview the production build locally before deploying
npm run preview
# Opens at http://localhost:4173
```

---

## STEP 7A — Deploy to Vercel (recommended, ~90 seconds)

```bash
# First deploy — Vercel will ask you a few questions
vercel

# Answer the prompts:
# → Set up and deploy? Y
# → Which scope? (your account)
# → Link to existing project? N
# → Project name: matchday-shovel (or whatever you like)
# → Directory: ./  (current directory)
# → Override build settings? N

# After ~60s you'll get:
# ✅  Production: https://matchday-shovel.vercel.app

# All future deploys:
vercel --prod
```

**Custom domain (optional):**
```bash
vercel domains add yourdomain.com
vercel alias set matchday-shovel.vercel.app yourdomain.com
```

---

## STEP 7B — Deploy to Netlify (alternative)

```bash
# Build first
npm run build

# Deploy
netlify deploy --prod --dir=dist

# First time it'll ask you to log in and create a site.
# After: ✅ Website URL: https://matchday-shovel.netlify.app
```

---

## STEP 8 — Validate the live PWA

After deploying, check these in Chrome DevTools on your Mac:

```
Chrome → F12 → Application → Manifest         ✓ icons & theme loaded
Chrome → F12 → Application → Service Workers  ✓ status: activated
Chrome → F12 → Lighthouse → Mobile            ✓ PWA score should be 90+
```

On your iPhone:
1. Open Safari → visit your live URL
2. Tap Share → Add to Home Screen
3. Open from Home Screen → confirm it opens without Safari UI (true standalone)
4. Go offline (Airplane Mode) → confirm the app still loads (service worker cache)

---

## QUICK REFERENCE — All commands

| Command | What it does |
|---|---|
| `npm install` | Install all dependencies |
| `npm run dev` | Start dev server on :5173 |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run build` | Production build → `/dist` |
| `npm run preview` | Preview production build on :4173 |
| `vercel --prod` | Deploy to Vercel production |
| `netlify deploy --prod --dir=dist` | Deploy to Netlify production |

---

## File Tree — What We Built

```
World Cup app/
├── index.html                        ← PWA shell with all meta tags
├── package.json                      ← Dependencies + scripts
├── vite.config.ts                    ← Vite + PWA plugin config
├── tailwind.config.js                ← Tailwind v3 config
├── postcss.config.js                 ← PostCSS + autoprefixer
├── tsconfig.json                     ← TS project references
├── tsconfig.app.json                 ← TS config for src/
├── tsconfig.node.json                ← TS config for vite.config.ts
├── vercel.json                       ← SPA rewrite rules + headers
├── .gitignore
│
├── public/
│   ├── manifest.json                 ← PWA manifest
│   ├── favicon.svg                   ← ⚽ favicon
│   ├── _redirects                    ← Netlify SPA routing
│   ├── pwa-192x192.png              ← generate with Step 4
│   └── pwa-512x512.png              ← generate with Step 4
│
└── src/
    ├── main.tsx                      ← React entry point
    ├── index.css                     ← Tailwind directives + custom utilities
    ├── App.tsx                       ← Root component tree (wires all 9 below)
    ├── types.ts                      ← All TypeScript types
    │
    ├── hooks/
    │   └── useMatchdayEngine.ts      ← 4-city data matrix + geo + countdown + leads
    │
    └── components/
        ├── NotificationRibbon.tsx    ← Live radar headline rotator
        ├── CityTabs.tsx              ← Spring-scaled city pill tabs
        ├── MatchCard.tsx             ← Kit-color match card + phase badge
        ├── CountdownTimer.tsx        ← Digit-flip countdown + breathing LIVE state
        ├── TransitHacks.tsx          ← Interactive stadium transit checklist
        ├── PubCard.tsx               ← Venue card with LIVE OPEN dot + filters
        ├── PubsSection.tsx           ← Filterable venue list
        ├── OrderAheadModal.tsx       ← Bottom-sheet reservation + pre-order
        └── StickyFooterCapture.tsx   ← Morphing CTA footer with gradient mask
```

---

## Leads Data — Where It Lives

All reservations are saved to `localStorage` under the key `mds_leads`.

To inspect in Chrome DevTools:
```
F12 → Application → Local Storage → http://localhost:5173
→ Key: mds_leads
→ Value: [ { id, name, email, phone, pubId, matchId, cart, ... } ]
```

To extract for a real backend, replace the `saveLead` callback in
`src/hooks/useMatchdayEngine.ts` with a `fetch()` POST to your API endpoint.

---

*Built with Universal MatchDay Shovel — World Cup 2026 ⚽*
