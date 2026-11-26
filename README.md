# The Roots of Capitalism — Slavery and the Sugar Trade

An **interactive visualization site** built on the source study:

> **The Roots of Capitalism: Slavery and the Sugar Trade**
> Prabir Purkayastha · Foreword by Vijay Prashad
> *Studies on Historical Materialism*, n°1 · **Tricontinental: Institute for Social Research** · 54 pages · CC BY‑NC 4.0
> Source PDF: <https://thetricontinental.org/wp-content/uploads/2026/08/20260828_StudiesHM_Roots-of-Capitalism_EN_Web.pdf>

**Live site:** served from GitHub Pages (see deployment below).
**Repository:** `sugar-trade`.

---

## What it is

A rich, accessible, **no-build** static site that turns the printed study into an interactive experience while faithfully reproducing its visual aesthetic. Highlights:

- **Scrollytelling** narrative sections matching the PDF's chapter structure (Foreword → Myth vs Fact → Mediterranean → Atlantic → Caribbean → Plantation → Markets → Shipbuilding → Financial system → Notes).
- **Interactive timeline** (800–1850) filterable by theme & region, keyboard-navigable, with page citations.
- **Interactive map (D3)** in **Mollweide** equal-area projection with **Mercator toggle** — honouring p.49 *“each projection carries its own ideological bias, Mercator more than others.”* Layers: plantations, enslaved-trade ports, refining/re-export hubs, silver mines, finance; **triangular-trade arcs**, **Middle Passage**, **internal slave markets**, **silver→Asia (Manila galleon)**; animated routes; pan/zoom; search; tooltips. Colonial-power data.
- **Caribbean colonial-power time slider** (1490–1800) for the five powers (p.24).
- **Sugar-processing workflow** (“diagram 1”, p.19), **gang system**, **technology timeline**.
- **Interactive charts** (SVG) from figures stated in the study; hover; **View data**; **CSV-ready** data; every number traces to a page; no invented statistics.
- **Key figures**, **glossary** (incl. *enslaved*, *asiento*, *factory*, *originary accumulation*, *gun-slave-money*, *Mollweide*…), **myth↔fact**, **quote carousel**.
- **Original embedded PDF illustrations/maps** + **original SVG illustrations**, all credited.
- **Read the original**: embedded PDF + download + source URL + full **57-note** Notes with filter + acknowledgements.
- **UI/UX methods** page explaining every method and how it reflects the PDF; **extracted palette**; **type specimen**.

## Aesthetic extracted from the PDF

Programmatically sampled from the rendered pages and embedded art:

- **Signature teal `#006080`** (hue ≈195°, sat 100%, val 50%) on **paper `#f0f0f0`**; ink black; grays `#e0/#d0/#c0`; warm `#f0f0e0`.
- Teal variants `#005060 #106080 #0080a0 #5090a0 #70a0b0`; full-bleed teal cover; teal/black duotone art.
- Full-bleed cover; generous margins; ornamental rules; running headers; serif + condensed-sans pairing.
- **Adobe Caslon Pro** (serif body/italic quotes/bold) + **Font Bureau Interstate** (sans headings/labels) + **Minion Pro** in the original.
  We bundle open-source stand-ins: **Libre Caslon Text** + **Overpass** (no CDN; no tracking).

## UI/UX methods (and why)

See the on-site **“UI/UX methods”** section and `assets/data/methods.json`. Summary:

1. **Scrollytelling & progressive reveal** — narrative pacing + reading progress.
2. **Palette & type fidelity** — colours/fonts sampled from the PDF.
3. **Mollweide equal-area map + projection honesty** — mirrors p.49; not politically neutral.
4. **Interactive timeline** — density of historical events; filters; keyboard; citations.
5. **Layered interactive map** — spatial relations; triangular trade; routes; colonial powers; animated flow.
6. **Colonial-power time slider** — change over time.
7. **Sugar-processing diagram** — complex process made stepwise; “field and factory.”
8. **Charts + view-data + source pages** — rich data without hiding numbers; honest uncertainty.
9. **Progressive disclosure** — myth↔fact, notes, glossary, expandable detail.
10. **Original art + full text + 57 notes** — scholarly depth.
11. **Accessibility** — semantic HTML, ARIA, keyboard, focus, skip-link, alt/captions, landmarks, live regions, `prefers-reduced-motion`, dark mode, scalable type, contrast, colour-not-only.
12. **Responsive/mobile-first**, **micro-interactions**, **SEO/social/share**, **performance**, **offline (service worker)**, **no tracking**.

## Architecture

- **No build step.** Static `index.html` + `assets/css/*.css` + `assets/js/app.js` (ES module). Serve any folder.
- **Data** in `assets/data/*.json` (all figures trace to a PDF page).
- **Vendored** (no runtime CDN): D3 v7, topojson-client, d3-geo-projection, world-atlas land, bundled fonts (woff2), original PDF, extracted images.
- **Original art** in `assets/illustrations/*.svg`; **OG image** `assets/img/og-image.png`; **favicon** `assets/img/favicon.svg`; **manifest** `site.webmanifest`; **service worker** `sw.js`.

## Run locally

```bash
# any static server, e.g.:
python3 -m http.server 8000
# then open http://127.0.0.1:8000
```

## Deploy to GitHub Pages

```bash
gh auth login                      # GitHub.com
# repo under "sugar-trade" (see note below)
gh repo create sugar-trade --public --source=. --push
gh api -X POST repos/:owner/sugar-trade/pages -f build_type=workflow   # or Settings → Pages
# or push to `gh-pages` / serve `main` `/root`
```

> **Note on “under sugar-trade”.** On GitHub.com, organizations cannot be created via `gh` or the REST/GraphQL API (`POST /orgs`, `POST /user/orgs`, `POST /admin/organizations`, GraphQL `createOrganization` are unavailable/404). This project is therefore published as a **repository named `sugar-trade`** under the authenticated account. To put it under a real `sugar-trade` **organization**, create the org once in the GitHub web UI and `gh repo transfer` this repo, or `gh repo create sugar-trade/<name>` once the org exists.

## Credit & license

Original study © **Prabir Purkayastha** & **Tricontinental: Institute for Social Research**, **CC BY‑NC 4.0**. This adaptation is **non‑commercial**, attributes the author, and shares under the same license. Embedded PDF images remain © author/publisher under CC BY‑NC 4.0. Fonts: Libre Caslon Text & Overpass (SIL OFL). Map data: world-atlas / Natural Earth. No tracking.

---

*“To speak of capitalism without speaking of slavery is therefore to tell only half the story.”* — p.6
