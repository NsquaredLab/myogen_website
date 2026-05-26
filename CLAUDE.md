# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The **MyoGen landing page** — a single-page marketing/docs site for [NsquaredLab/MyoGen](https://github.com/NsquaredLab/MyoGen), an open-source electrophysiology simulator. Built as a static **Astro 6 + bun** site. It was ported from a hand-written HTML mockup (since removed); the design intent now lives in this code plus the specs/plans under `docs/superpowers/`.

## Commands

Package manager / runtime is **bun** (not npm).

- `bun install` — install deps
- `bun run dev` — dev server (HMR). Hard-refresh after editing the React island or CSS variables.
- `bun run build` — static build to `dist/`
- `bun run preview` — serve the built `dist/`
- `bunx astro check` — type-check / diagnostics (one cosmetic Zod `.url()` hint is expected and harmless)

There is no unit-test suite; "verification" is a clean `bun run build` + `bunx astro check` (0 errors) plus a manual browser pass for visuals, the raster animation, dark mode, and the BibTeX copy/highlight.

## Architecture

`src/pages/index.astro` composes the page from section components in this order: `TopNotice` → `SiteNav` → `Hero` → `Overview` → `Results` → `Literature` → `Researchers` → `Governance` → `DocsCta` → `Contribute` → `Citation` → `SiteFooter`. Most sections are static `.astro`; almost no JavaScript ships.

- **`src/layouts/Base.astro`** — html shell, Google Fonts, global style imports, and two `is:inline` scripts: a no-flash theme boot (sets `.dark` before paint) and a live PyPI version fetch that fills `[data-version-meta]` (Hero) and `[data-version-banner]` (TopNotice).
- **Styling** — `src/styles/tokens.css` holds the CSS custom properties for light (`:root`) and dark (`html.dark`), including `--viz-*` tokens for the hero viz. `src/styles/global.css` holds everything else; site-specific **design tweaks are appended at the end** (dark-mode toggle button, full-width section headings/ledes, and the justify rules). Theming is entirely the `.dark` class + CSS variables — no per-component theme logic.
- **`src/components/RasterViz.jsx`** — the only React island (`client:load`), in the hero card. A motor-unit raster animation (18 units, 14s loop, `mulberry32` PRNG). All its colors are CSS `var()` applied via inline `style` (so it re-themes via `.dark` with no JS); it updates the card's `#viz-title`/`#viz-meta`/`#viz-time` DOM nodes at runtime.
- **Papers content collection** — `src/content.config.ts` defines a `papers` collection via the Astro Content Layer API (`glob` loader; import `z` from `astro/zod`, not `astro:content`). One Markdown file per paper in `src/content/papers/` (frontmatter only; `order` controls position). `Literature.astro` reads it, prepends the hardcoded "Your paper here?" card, and renders a `PaperCard` per paper. **To add a paper: drop one `.md` file in `src/content/papers/`.** Card thumbnails are SVG components in `src/components/thumbs/` selected by the paper's `thumb` field.
- **Citation** — two `.bibcard`s whose BibTeX is rendered via `set:text` (Astro treats bare `{}` as expressions). Two `is:inline` scripts: a delegated copy handler (`[data-copy-bib]`) and `highlightBib()` which tokenizes the BibTeX into `.tk-*` spans on load (copy still reads clean `textContent`).
- **Images** — brand logo and Figure 1 live in `src/assets/` and render through Astro `<Image>` (optimized webp; the Overview figure uses a responsive `widths`/`sizes` srcset). Above-the-fold logos/figure are `loading="eager"`.

## Conventions

- **Justify policy**: body prose is `text-align: justify; hyphens: auto` (see the rule at the end of `global.css`); headings, mono/terminal text, BibTeX `<pre>`, nav/footer link lists, and short labels stay ragged. New prose should follow suit.
- **Brand voice / content accuracy**: no em dashes in user-facing copy (use `·` separators); the 20 Hz stat says beta-band **reproduction** (not "replication"); example paper cards stay labeled "Example" with placeholder DOIs.
- **License/attribution**: AGPL-3.0-or-later; footer jointly attributes the Nsquared Lab (FAU) and the Neural Engineering Research Lab (Unicamp).
- **Commits**: the user prefers no `Co-Authored-By` trailer on commits here.

## Deploy (not finalized)

`.github/workflows/deploy.yml` builds via `oven-sh/setup-bun` and publishes to GitHub Pages on push to `main`. Before the first real deploy, set `site`/`base` in `astro.config.mjs` (currently `site: 'https://NsquaredLab.github.io'`, `base: '/'` — a project page needs `base: '/<repo>'`) and add a git remote. All asset/link refs use `import.meta.env.BASE_URL`, so they follow whatever `base` is set.
