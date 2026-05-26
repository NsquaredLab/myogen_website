# Design: MyoGen landing page → Astro

**Date:** 2026-05-22
**Status:** Approved (Phase 1)

## Goal

Recreate the existing pixel-perfect MyoGen landing-page mockup (`myogen-landing.html`) as a maintainable Astro project, so the team can add news, papers, and posts without editing one monolithic HTML file. The visual design is **fixed** by the existing mockup and fully specified in `README.md` (sections, copy, design tokens, interactions). This spec captures the migration decisions and the Phase 1 build scope; it does not restate the design tokens or copy — those are lifted verbatim from `README.md` and `myogen-landing.html`.

## Decisions

| Decision | Choice |
|---|---|
| Package manager / runtime | **bun** (1.3.x) |
| Framework | Astro, `output: 'static'` |
| Integrations | `@astrojs/react` (EMG viz island), `@astrojs/mdx` (papers collection, later phase) |
| Build scope (this attempt) | **Phase 1**: scaffold + foundation + Hero. Remaining sections iterate after. |
| Tweaks panel | **Omitted** from the port. Accent and density become their fixed defaults (electrophys blue, regular density). |
| Hero visualization | **Raster variant only**. The EMG and Schematic variants are dropped; with the Tweaks switcher gone the hero shows a single motor-unit raster (recruitment ramp). |
| Dark mode | **Nav toggle + OS default**: small toggle in `SiteNav`; first load follows `matchMedia('(prefers-color-scheme: dark)')`; manual choice persists to `localStorage`; a no-flash inline script in `<head>` applies the `.dark` class on `<html>` before first paint. |
| Deploy target | **GitHub Pages** via `withastro/action`. `site`/`base` use a marked placeholder until the final repo name / custom domain is confirmed. |
| Version control | `git init` the repo (was untracked). |

## Architecture

Static-first Astro site. Only the hero visualization ships JavaScript (one React island); everything else is static HTML + tiny inline scripts. Dark mode is a `.dark` class on `<html>` driving CSS-variable swaps — no per-component theme logic.

### Target structure (full site)

```
astro.config.mjs
package.json                 (bun)
.github/workflows/deploy.yml (GitHub Pages)
public/
  myogen_logo.png
  myogen_overview.png
src/
  layouts/Base.astro         html shell + fonts + global styles + no-flash theme script
  pages/index.astro          composes sections
  styles/
    tokens.css               light + dark CSS variables (verbatim from README)
    global.css               reset, type, density modes, .kw helper
  components/
    TopNotice.astro
    SiteNav.astro            includes dark-mode toggle
    Hero.astro
    RasterViz.jsx            React island, client:load (raster variant only)
    Overview.astro           (later)
    Results.astro            (later)
    Literature.astro         (later, reads papers collection)
    PaperCard.astro          (later) + thumb components
    Researchers.astro        (later)
    Governance.astro         (later)
    DocsCta.astro            (later)
    Contribute.astro         (later)
    Citation.astro           (later)
    SiteFooter.astro         (later)
  content/
    config.ts                papers collection schema (later)
    papers/*.mdx             (later)
  scripts/                   inline-script sources where useful
```

### Phase 1 deliverable (this attempt)

Build and verify, in order:

1. **Scaffold** — `bun create astro`, add `@astrojs/react`; `astro.config.mjs` with static output + GH Pages placeholders; `.gitignore` (node_modules, dist, .astro); move `myogen_logo.png` / `myogen_overview.png` into `public/`.
2. **`tokens.css` + `global.css`** — light + dark variables, type scale, density rules, lifted exactly from the current build.
3. **`Base.astro`** — html shell, Google Fonts stylesheet link, global styles, and the no-flash inline theme script (read localStorage → else matchMedia → set `.dark` before paint).
4. **`TopNotice.astro`** — dark thin bar; version + DOI; in-flow (scrolls away).
5. **`SiteNav.astro`** — fixed nav, hidden until `scrollY > 120`, backdrop blur, brand + links + GitHub + Read-docs CTA, **plus the new dark-mode toggle button**.
6. **`Hero.astro`** — two-column hero (eyebrow, logo+tagline h1, body, 3 CTAs, meta row with version slot, viz card shell).
7. **`RasterViz.jsx`** — React island (`client:load`), ports **only the raster variant** of the procedural viz from the current build: 18 motor units, recruitment ramp (lower-threshold MUs fire first/faster), MU01 at bottom stacking upward, past spikes solid accent, fresh spikes (within 0.04 of cursor) flash signal-red. Keep the 14s loop, `mulberry32` PRNG, and dark-aware color tokens. The EMG and Schematic variant code is not ported. The viz-card caption/meta use the raster variant's values from the current build.
8. **Inline scripts** — PyPI version fetch (`pypi.org/pypi/myogen/json` → `[data-version-meta]` / `[data-version-banner]`, silent fallback) and nav-reveal-on-scroll.

Deferred to later phases: all sections from Overview through Footer, and the papers MDX content collection.

## Fidelity & content constraints (carried from README)

- **Pixel-perfect** lift of colors, type, spacing, dark mode, and the hero viz. Use the verbatim tokens.
- **No Babel CDN** in production — Astro compiles JSX at build time.
- **Brand voice**: scientific, no marketing tropes, **no em dashes**. Copy was audited against the bioRxiv paper — preserve exactly. Keep the "quantitatively close / qualitatively consistent" distinction; "beta-band **reproduction**" (not replication); "Example" paper cards stay labeled.
- **License/attribution**: AGPL-3.0-or-later; footer jointly attributes Nsquared Lab (FAU) and Neural Engineering Research Lab (Unicamp).

## Acceptance criteria (Phase 1)

- `bun install` and `bun run dev` start the site with no console errors.
- TopNotice, SiteNav, and Hero render matching the current mockup at desktop and mobile widths.
- The motor-unit raster hero viz animates (14s loop) and re-themes correctly in dark mode.
- Dark-mode toggle works, persists across reload, defaults from OS, and shows no flash of wrong theme on load.
- PyPI version populates the banner + meta slot; nav reveals past 120px scroll.
- `bun run build` produces a static `dist/` with no Babel/CDN-transpile dependency.

## Open items (non-blocking)

- Final `site`/`base` for GitHub Pages (repo name vs custom domain) — confirm before first deploy.
