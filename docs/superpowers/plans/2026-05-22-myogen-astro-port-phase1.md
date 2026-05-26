# MyoGen Astro Port — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an Astro + bun project and port the foundation + Hero of the MyoGen landing page (TopNotice, SiteNav with dark-mode toggle, Hero, and a raster-only React viz island) at pixel fidelity to the existing mockup.

**Architecture:** Static-first Astro site. Global CSS variables (a `.dark` class on `<html>`) drive all theming. Only the hero motor-unit raster viz ships JavaScript, as a single React island (`client:load`). Small `is:inline` scripts handle the no-flash theme boot, the dark-mode toggle, nav-reveal-on-scroll, and the live PyPI version fetch. The Tweaks panel and the EMG/Schematic viz variants are not ported.

**Tech Stack:** Astro 5 (static), bun (package manager + runtime), `@astrojs/react` + React 19 (hero island only), TypeScript via `astro check`.

**Source of truth:** `myogen-landing.html` is the canonical design. Verbatim lifts (CSS variables, raster viz math, inline-script bodies, exact copy) are extracted from it at the line ranges named in each task. `README.md` documents every section, token, and behavior in prose — consult it when a task says "match the spec." Do not introduce em dashes in user-facing copy; preserve copy exactly.

**Conventions for this plan:**
- Reference all assets/links with the base path: `${import.meta.env.BASE_URL}` (so a future GitHub Pages subpath cannot break them).
- "Verify build" = `bun run build` must finish with no errors. "Type-check" = `bunx astro check` must report 0 errors.
- The raster viz is client-only; it will NOT appear in static HTML. Its verification is build success + the manual browser checklist in Task 9, not a grep of `dist/`.

---

## File structure (Phase 1)

```
package.json                       bun scripts + deps
astro.config.mjs                   static output, react(), GH Pages site/base
tsconfig.json                      strict + react-jsx
.gitignore                         node_modules, dist, .astro
.github/workflows/deploy.yml       GitHub Pages (withastro/action)
public/
  myogen_logo.png                  moved from repo root
  myogen_overview.png              moved from repo root
src/
  styles/
    tokens.css                     light + dark CSS variables (verbatim)
    global.css                     reset, type, density, helpers (verbatim)
  layouts/
    Base.astro                     html shell, fonts, global css, no-flash + pypi scripts
  components/
    TopNotice.astro                thin dark bar (version + DOI)
    SiteNav.astro                  fixed nav + dark-mode toggle + reveal script
    Hero.astro                     hero layout + viz card shell
    RasterViz.jsx                  React island (raster variant only)
  pages/
    index.astro                    composes TopNotice + SiteNav + Hero
```

Files deferred to later phases (Overview→Footer sections, `src/content/` papers collection) are out of scope here.

---

## Task 1: Scaffold the Astro + bun project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`
- Create: `src/pages/index.astro` (temporary placeholder)
- Move: `myogen_logo.png` → `public/myogen_logo.png`, `myogen_overview.png` → `public/myogen_overview.png`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.DS_Store
*.log
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "myogen-website",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/react": "^4.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// NOTE(deploy): base is '/' for local dev. Before the first GitHub Pages deploy,
// confirm the final URL and update site/base:
//   - Project page:  site 'https://NsquaredLab.github.io', base '/<repo-name>'
//   - Custom domain / org page: keep base '/'
// All asset/link refs use import.meta.env.BASE_URL so they follow whatever base is set.
export default defineConfig({
  site: 'https://NsquaredLab.github.io',
  base: '/',
  output: 'static',
  integrations: [react()],
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

- [ ] **Step 5: Create temporary `src/pages/index.astro`**

```astro
---
---
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>MyoGen</title></head>
  <body><p data-scaffold>scaffold ok</p></body>
</html>
```

- [ ] **Step 6: Move brand assets into `public/`**

Run:
```bash
mkdir -p public && mv myogen_logo.png public/myogen_logo.png && mv myogen_overview.png public/myogen_overview.png
```
Expected: both PNGs now under `public/`. (Plain `mv`, not `git mv` — the PNGs are currently untracked, so `git mv` would fail.)

- [ ] **Step 7: Install dependencies**

Run: `bun install`
Expected: completes with a `bun.lock` written, no peer-dependency errors. If `@astrojs/react` reports a React peer mismatch, run `bunx astro add react --yes` and let Astro pin compatible versions, then re-run `bun install`.

- [ ] **Step 8: Verify build**

Run: `bun run build`
Expected: "Complete!" and a generated `dist/index.html` containing `data-scaffold`. Confirm: `grep -q data-scaffold dist/index.html && echo OK`.

- [ ] **Step 9: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json .gitignore bun.lock src/pages/index.astro public/myogen_logo.png public/myogen_overview.png
git commit -m "chore: scaffold Astro + bun project with React integration"
```

---

## Task 2: Port design tokens and global CSS

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

These are a verbatim lift from the `<style>` block in `myogen-landing.html` (opens at line 23, closes just before `<section class="hero">` near line 627). Split by responsibility: variables → `tokens.css`, everything else → `global.css`.

- [ ] **Step 1: Create `src/styles/tokens.css`**

Copy, verbatim, the CSS custom-property declarations from the source `<style>` block:
- the `:root { ... }` light-mode variables (the full set listed in README "Colors — light mode": `--bg`, `--bg-2`, `--ink`..`--ink-4`, `--rule`, `--rule-2`, `--paper`, `--topbar-*`, `--term-*`, `--accent*`, `--signal*`).
- the dark-mode override block (README "Colors — dark mode"): in the source this is the `.dark { ... }` (or `html.dark`) selector that redefines the same variables plus `--logo-filter` and `color-scheme: dark`.

Preserve exact `oklch(...)` values and hex codes. If the source defines tokens inside a media query, keep the class-based `.dark` selector as the authoritative switch (the toggle in Task 5 drives this class).

- [ ] **Step 2: Create `src/styles/global.css`**

Copy, verbatim, the remainder of the source `<style>` block (everything that is not a variable declaration): the reset, base `html/body` type rules, font-family assignments (serif/sans/mono), the `body.density-compact|regular|comfy` section-padding rules, the `.kw` helper, BibTeX `.tk-*` token colors, button/card/nav/hero rules, and the dark-mode `--logo-filter` application. Replace any `var(--...)` references as-is (they resolve against `tokens.css`).

Do NOT inline Google Fonts here — the stylesheet `<link>` lives in `Base.astro` (Task 3).

- [ ] **Step 3: Type-check / build still green**

These files aren't imported yet, so just confirm nothing broke: `bun run build`
Expected: "Complete!" (no change to output yet).

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css
git commit -m "feat: add design tokens and global styles (verbatim from mockup)"
```

---

## Task 3: Base layout (shell, fonts, no-flash theme, PyPI version)

**Files:**
- Create: `src/layouts/Base.astro`
- Modify: `src/pages/index.astro` (use the layout)

- [ ] **Step 1: Create `src/layouts/Base.astro`**

```astro
---
import '../styles/tokens.css';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
}
const {
  title = 'MyoGen — the unified electrophysiology simulator',
  description = 'MyoGen is a modular, NEURON-backed simulation toolkit for human neuromuscular activity and EMG generation.',
} = Astro.props;
const base = import.meta.env.BASE_URL;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/png" href={`${base}myogen_logo.png`} />

    <!-- No-flash theme boot: set .dark BEFORE first paint -->
    <script is:inline>
      (() => {
        try {
          const stored = localStorage.getItem('theme');
          const dark = stored
            ? stored === 'dark'
            : window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', dark);
        } catch (_) {}
      })();
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,500;8..60,600&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
    />
  </head>
  <body class="density-regular">
    <slot />

    <!-- Live PyPI version (silent fallback to whatever is in the DOM) -->
    <script is:inline>
      (async () => {
        try {
          const r = await fetch('https://pypi.org/pypi/myogen/json', { cache: 'no-store' });
          if (!r.ok) return;
          const v = (await r.json())?.info?.version;
          if (!v) return;
          document.querySelectorAll('[data-version-meta]').forEach((el) => { el.textContent = 'v' + v; });
          document.querySelectorAll('[data-version-banner]').forEach((el) => { el.textContent = 'v' + v + ' released'; });
        } catch (_) {}
      })();
    </script>
  </body>
</html>
```

Cross-check the PyPI block against source lines ~1262–1300 and the body class against the README density model; adjust the default density class if the source uses a different default than `regular`.

- [ ] **Step 2: Replace `src/pages/index.astro` with a layout smoke test**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base>
  <main style="padding:40px">
    <p data-scaffold>layout ok</p>
    <span data-version-meta>v0.0.0</span>
  </main>
</Base>
```

- [ ] **Step 3: Verify build + markers**

Run: `bun run build`
Then: `grep -q "Source+Serif+4" dist/index.html && grep -q "no-flash" -i dist/index.html; grep -q "pypi.org/pypi/myogen" dist/index.html && echo OK`
Expected: build completes; the fonts link and PyPI script are present in the output.

- [ ] **Step 4: Type-check**

Run: `bunx astro check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro src/pages/index.astro
git commit -m "feat: add Base layout with fonts, no-flash theme boot, and PyPI version fetch"
```

---

## Task 4: TopNotice component

**Files:**
- Create: `src/components/TopNotice.astro`
- Modify: `src/pages/index.astro`

The markup/classes come from the `.topnotice` element in `myogen-landing.html` (find it in the body, before the hero at line 627; behavior referenced near line 1738). It is in normal flow (scrolls away), dark background, mono 11.5px.

- [ ] **Step 1: Create `src/components/TopNotice.astro`**

Port the `.topnotice` markup verbatim. It must contain:
- left side: a status dot + a release-banner span carrying `data-version-banner` (initial text e.g. `v…` placeholder) + a "preprint on bioRxiv" link to the bioRxiv URL.
- right side: `doi:10.64898/2026.01.01.697284`.

Wrap the lifted HTML in the component. Keep the existing class names so `global.css` styles it. Example skeleton (fill the inner markup from source, keep its exact text and links):

```astro
---
---
<div class="topnotice">
  <!-- left: status dot + data-version-banner span + bioRxiv preprint link -->
  <!-- right: doi:10.64898/2026.01.01.697284 -->
</div>
```

- [ ] **Step 2: Mount it in `index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TopNotice from '../components/TopNotice.astro';
---
<Base>
  <TopNotice />
  <main style="padding:40px"><p data-scaffold>top notice ok</p></main>
</Base>
```

- [ ] **Step 3: Verify**

Run: `bun run build`
Then: `grep -q "topnotice" dist/index.html && grep -q "data-version-banner" dist/index.html && grep -q "10.64898/2026.01.01.697284" dist/index.html && echo OK`
Expected: all present.

- [ ] **Step 4: Commit**

```bash
git add src/components/TopNotice.astro src/pages/index.astro
git commit -m "feat: add TopNotice bar (version banner + DOI)"
```

---

## Task 5: SiteNav with dark-mode toggle + reveal-on-scroll

**Files:**
- Create: `src/components/SiteNav.astro`
- Modify: `src/pages/index.astro`

Lift the `nav.site` markup from the source (selector referenced at line 1340; reveal logic at source lines ~1340–1347). The nav is `position:fixed`, hidden by default (`translateY(-100%)`), revealed via a `.shown` class once `scrollY > 120`. Add a NEW dark-mode toggle button (not present in the original, which relied on the Tweaks panel).

- [ ] **Step 1: Create `src/components/SiteNav.astro`**

Port the existing nav structure (brand logo + "MyoGen" wordmark, links: Overview / Results / Papers / Governance / Citation, outlined "GitHub ↗", primary "Read docs →"). Use `${import.meta.env.BASE_URL}myogen_logo.png` for the logo `src`. Then add the toggle button and the two `is:inline` scripts.

```astro
---
const base = import.meta.env.BASE_URL;
---
<nav class="site">
  <a class="brand" href={base}>
    <img src={`${base}myogen_logo.png`} alt="MyoGen" width="40" height="40" />
    <span class="wordmark">MyoGen</span>
  </a>
  <!-- Port the existing link list + GitHub link + Read-docs CTA from nav.site in the source.
       Keep the same class names so global.css styles them. -->

  <button id="theme-toggle" type="button" class="theme-toggle"
          aria-label="Toggle dark mode" aria-pressed="false">
    <span class="theme-toggle__icon" aria-hidden="true"></span>
  </button>
</nav>

<script is:inline>
  // Reveal-on-scroll (ported from source ~lines 1340-1347)
  (() => {
    const nav = document.querySelector('nav.site');
    if (!nav) return;
    const update = () => nav.classList.toggle('shown', window.scrollY > 120);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();
</script>

<script is:inline>
  // Dark-mode toggle (new; replaces the removed Tweaks panel control)
  (() => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sync = () =>
      btn.setAttribute('aria-pressed',
        String(document.documentElement.classList.contains('dark')));
    btn.addEventListener('click', () => {
      const dark = !document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark', dark);
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (_) {}
      sync();
    });
    sync();
  })();
</script>
```

- [ ] **Step 2: Add minimal toggle styling to `src/styles/global.css`**

Append a small rule block so the toggle reads cleanly in both themes (icon can be a CSS sun/moon or a unicode glyph; keep it understated, mono, matching the nav). Use existing tokens:

```css
.theme-toggle{
  display:inline-flex;align-items:center;justify-content:center;
  width:34px;height:34px;border:1px solid var(--rule);border-radius:8px;
  background:transparent;color:var(--ink-2);cursor:pointer;
  transition:background .18s ease,border-color .18s ease,color .18s ease;
}
.theme-toggle:hover{border-color:var(--ink-3);color:var(--ink);}
.theme-toggle__icon::before{content:"\263E";} /* moon (light mode: offer dark) */
html.dark .theme-toggle__icon::before{content:"\2600";} /* sun */
```

- [ ] **Step 3: Mount in `index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TopNotice from '../components/TopNotice.astro';
import SiteNav from '../components/SiteNav.astro';
---
<Base>
  <TopNotice />
  <SiteNav />
  <main style="padding:40px;min-height:200vh"><p data-scaffold>nav ok</p></main>
</Base>
```

(The tall `main` lets you exercise the scroll reveal in the browser.)

- [ ] **Step 4: Verify**

Run: `bun run build`
Then: `grep -q 'nav class="site"' dist/index.html && grep -q "theme-toggle" dist/index.html && grep -q "scrollY > 120" dist/index.html && echo OK`
Expected: all present.

- [ ] **Step 5: Type-check**

Run: `bunx astro check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/SiteNav.astro src/styles/global.css src/pages/index.astro
git commit -m "feat: add SiteNav with reveal-on-scroll and dark-mode toggle"
```

---

## Task 6: Hero layout + viz card shell

**Files:**
- Create: `src/components/Hero.astro`
- Modify: `src/pages/index.astro`

Lift the hero markup from `myogen-landing.html` lines 627–677 (the `<section class="hero">`). Keep all copy exactly. The right-column viz card currently mounts to `#viz-mount` (height 380px) with header caption `#viz-title` and footer `#viz-meta` / `#viz-time`; in this port the React island (Task 7) renders into that card instead of the old vanilla mount.

- [ ] **Step 1: Create `src/components/Hero.astro`**

Port the two-column hero verbatim:
- Left: eyebrow (`Open-source · Unified · NEURON-backed`), `<h1>` = logo `<img>` (use `${import.meta.env.BASE_URL}myogen_logo.png`) + italic tagline "The unified electrophysiology simulator", the serif body paragraph, the 3 CTAs (primary "Read the documentation →", outlined "View on GitHub ↗", ghost "Explore examples ↗"), and the meta row (Version / License / Language / Backend / DOI) where the Version value carries `data-version-meta`.
- Right: the viz card shell (header with 3 traffic-light dots + a mono caption matching the **raster** variant's caption from the source, a body mount, and the footer mono meta + `t = 0.00s` readout). Leave a clearly marked slot/placeholder where the React island will mount (Task 7 fills it).

Keep existing class names so `global.css` applies. Use real href values from the source (GitHub repo, docs, examples, bioRxiv DOI).

- [ ] **Step 2: Mount in `index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import TopNotice from '../components/TopNotice.astro';
import SiteNav from '../components/SiteNav.astro';
import Hero from '../components/Hero.astro';
---
<Base>
  <TopNotice />
  <SiteNav />
  <Hero />
</Base>
```

- [ ] **Step 3: Verify**

Run: `bun run build`
Then: `grep -q 'class="hero"' dist/index.html && grep -q "The unified electrophysiology simulator" dist/index.html && grep -q "data-version-meta" dist/index.html && echo OK`
Expected: all present.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro src/pages/index.astro
git commit -m "feat: add Hero section with viz card shell"
```

---

## Task 7: RasterViz React island (raster variant only)

**Files:**
- Create: `src/components/RasterViz.jsx`
- Modify: `src/components/Hero.astro` (mount the island)

Port ONLY the raster variant of the procedural viz from the React app in `myogen-landing.html` (the `type="text/babel"` block, source lines ~1358–1697; `mulberry32` defined at line 1362). Drop the EMG and Schematic branches and the variant switch entirely.

Raster behavior to preserve (README §"Hero viz" / Raster): 18 motor units; recruitment ramp (lower-threshold MUs fire first and faster); MU01 at the bottom, higher indices stacking upward; past spikes solid accent; "fresh" spikes (within 0.04 of the cursor `t`) flash signal-red; 14s animation loop with `t` in [0,1]; pause at t=0.62 when `animate` is false; re-seed every ~12s; deterministic `mulberry32` PRNG. Keep the original rendering technique used by the raster branch (SVG or canvas — match the source).

- [ ] **Step 1: Create `src/components/RasterViz.jsx`**

Structure the island as a default-export component. Because the Tweaks panel is gone, the island reads theme from the live `.dark` class (and re-themes when the nav toggle flips it) instead of a `dark` prop. Accent/signal default to the design tokens but are read from CSS variables so they stay in sync.

```jsx
import { useEffect, useRef, useState } from 'react';

// Deterministic PRNG — copy verbatim from source line ~1362.
function mulberry32(seed) {
  // ...exact body from myogen-landing.html...
}

// Track the live theme so the viz re-themes when the nav toggle flips .dark.
function useDarkClass() {
  const [dark, setDark] = useState(
    typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() =>
      setDark(el.classList.contains('dark'))
    );
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// Read a CSS custom property (so accent/signal match tokens.css in both themes).
function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export default function RasterViz({ animate = true }) {
  const dark = useDarkClass();
  // Derive the color set from CSS variables, recomputed when `dark` changes.
  // Port the raster branch's color object (C.gridMajor, C.axisInk, accent, signal, ...)
  // from the source, sourcing values via cssVar('--accent', ...), cssVar('--signal', ...), etc.

  // Port the raster render loop here:
  //  - requestAnimationFrame loop, 14s period, t in [0,1]
  //  - pause at t=0.62 when !animate
  //  - re-seed every ~12s via mulberry32
  //  - draw 18 MUs, recruitment ramp, fresh-spike flash within 0.04 of cursor
  //  - update an external "t = X.XXs" readout if present (see Step 2 wiring)

  return (
    /* the SVG or canvas element the raster branch drew into, 100% width, 380px tall card body */
    null
  );
}
```

Fill every `// ...` from the source raster branch. Do not leave commented placeholders in the committed file — they are guidance for porting, replace them with the real ported code.

- [ ] **Step 2: Mount the island in `Hero.astro`**

Import and render it inside the viz-card body, hydrating on load:

```astro
---
import RasterViz from './RasterViz.jsx';
---
<!-- inside the viz-card body, replacing the placeholder from Task 6: -->
<RasterViz client:load />
```

If the original drove the footer `t = X.XXs` readout, either move that readout inside `RasterViz` or expose it via a DOM id the island updates; pick one and implement it fully (no dangling reference).

- [ ] **Step 3: Verify build + island emission**

Run: `bun run build`
Then: `bun run build 2>&1 | grep -qi "complete" && ls dist/_astro/*.js >/dev/null 2>&1 && echo OK`
Expected: build completes and at least one hydration chunk is emitted under `dist/_astro/` (the island's JS). The viz won't appear in `dist/index.html` (client-only) — that's expected.

- [ ] **Step 4: Type-check**

Run: `bunx astro check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/RasterViz.jsx src/components/Hero.astro
git commit -m "feat: add raster motor-unit hero viz as a React island"
```

---

## Task 8: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

This wires CI but does not deploy now (deploy is gated on confirming `site`/`base` — see Task 1 note).

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - name: Install
        run: bun install --frozen-lockfile
      - name: Build
        run: bun run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow"
```

---

## Task 9: Full verification + manual fidelity checklist

**Files:** none (verification only)

- [ ] **Step 1: Clean build + type-check**

Run: `rm -rf dist && bun run build && bunx astro check`
Expected: build "Complete!", `astro check` reports 0 errors.

- [ ] **Step 2: Confirm no Babel/CDN transpile leaked into output**

Run: `! grep -rqi "babel" dist && ! grep -rq "text/babel" dist && echo OK`
Expected: `OK` (the production build must not depend on in-browser Babel).

- [ ] **Step 3: Manual browser check** (`bun run preview`, open the printed URL)

Verify against `myogen-landing.html` open side by side:
- [ ] TopNotice, SiteNav, and Hero match the mockup at a desktop width (~1240px) and a mobile width (~390px).
- [ ] The hero raster viz renders and animates on a 14s loop; "fresh" spikes flash signal-red; MU01 sits at the bottom.
- [ ] Dark-mode toggle in the nav flips the theme, the raster viz re-themes live, the choice survives a reload, and there is NO flash of the wrong theme on load.
- [ ] With OS set to dark and no stored choice, first load is dark.
- [ ] Nav is hidden initially and slides in after scrolling past ~120px.
- [ ] The version banner (TopNotice) and the Version meta value (Hero) populate from PyPI shortly after load; with network blocked they fall back silently.

- [ ] **Step 4: Final commit (if any checklist fixes were needed)**

```bash
git add src public .github astro.config.mjs src/styles
git commit -m "fix: Phase 1 fidelity adjustments from manual review"
```

(Stage explicit paths, not `git add -A`: the root reference files — `myogen-landing.html`, `MyoGen Landing.html`, `tweaks-panel.jsx` — are intentionally left untracked for now; decide whether to version them later. If no fixes were needed, skip this step — Phase 1 is complete.)

---

## Out of scope (later phases)

Overview, Results, Literature (papers MDX content collection), Researchers, Governance, DocsCta, Contribute, Citation (with BibTeX highlight + copy), and SiteFooter — plus finalizing `site`/`base` and enabling the deploy. Each becomes its own plan.
