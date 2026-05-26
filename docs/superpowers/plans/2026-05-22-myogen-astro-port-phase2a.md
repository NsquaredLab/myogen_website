# MyoGen Astro Port — Phase 2a Implementation Plan (Overview · Results · Literature)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Port the next three landing-page sections — Overview, Results, and Literature — to Astro, introducing the `papers` content collection so the "Papers using MyoGen" list is data-driven (one file per paper) rather than hardcoded.

**Architecture:** Same as Phase 1: static `.astro` components, verbatim markup/copy lifted from `myogen-landing.html`, with all visual CSS already present in `src/styles/global.css` (do not add section CSS unless a rule is genuinely missing). The Overview figure and any raster brand images use Astro `<Image>` for optimization. Literature reads a `papers` content collection via the Astro 6 Content Layer API.

**Tech Stack:** Astro 6.3.7 (static), bun, `@astrojs/react` 5 (no new islands this phase), `astro:content` Content Layer API.

**Source of truth & section line ranges in `myogen-landing.html`:**
- Overview: `<section id="overview">` — lines **678–734**
- Results: `<section id="validation">` — lines **735–770**
- Literature: `<section id="literature">` — lines **771–934**

`README.md` documents each section's intent, exact copy, the 4 Overview callouts, the 4 Results stats, and the paper-card order. Preserve copy exactly; **no em dashes** in user-facing copy.

**Conventions (from Phase 1):**
- Asset/link refs use `import.meta.env.BASE_URL` where a raw URL is needed; images imported from `src/assets` go through `<Image>`.
- "Verify build" = `bun run build` finishes clean. "Type-check" = `bunx astro check` reports 0 errors.
- Each task ends with a commit. No Co-Authored-By trailer (user preference).

---

## File structure (Phase 2a)

```
src/assets/
  myogen_overview.png            moved from public/ (Figure 1; used via <Image>)
src/content.config.ts            papers collection (Content Layer API)
src/content/papers/
  2026-myogen.md                 founding paper (real)
  2026-decomposition.md          example
  2026-beta-band.md              example
  2026-prosthesis.md             example
  2026-manifold.md               example
src/components/
  Overview.astro                 eyebrow + heading + lede + figure card + 4 callouts
  Results.astro                  eyebrow + heading + ref + 4-stat grid
  Literature.astro               grid; reads papers collection; prepends "add yours" card
  PaperCard.astro                single card (thumb + venue + title + authors + doi)
  thumbs/
    PipelineThumb.astro
    DecompThumb.astro
    ForceThumb.astro
    GridThumb.astro
    ManifoldThumb.astro
src/pages/index.astro            add <Overview/> <Results/> <Literature/> after <Hero/>
```

---

## Task 1: Overview section

**Files:**
- Create: `src/components/Overview.astro`
- Move: `public/myogen_overview.png` → `src/assets/myogen_overview.png`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Move the figure asset**

Run:
```bash
mkdir -p src/assets && mv public/myogen_overview.png src/assets/myogen_overview.png
```
(Plain `mv` — confirm whether it's tracked; if `git mv` errors because untracked, use plain `mv`. It IS currently tracked under `public/`, so `git mv public/myogen_overview.png src/assets/myogen_overview.png` is correct.)

- [ ] **Step 2: Create `src/components/Overview.astro`**

Read `myogen-landing.html` lines 678–734 and lift the section verbatim (eyebrow "Overview", the serif heading, the lede paragraph naming the full chain, the figure card, the figcaption row, and the 4-up component callouts: Neural / Muscle / Proprioception / Signal — exact titles, subtitles, and body text from the source). Keep all class names so `global.css` styles it.

For the figure image, use Astro `<Image>` instead of a raw `<img>`:
```astro
---
import { Image } from 'astro:assets';
import overview from '../assets/myogen_overview.png';
---
<!-- inside the figure card, where the source had <img src=".../myogen_overview.png"> -->
<Image src={overview} alt="MyoGen framework overview (Figure 1)" />
```
Preserve the source's class on the figure image (the figure card has a white background even in dark mode — that styling is already in `global.css`; keep the same class names). Do not pass a fixed width unless the source img had explicit dimensions; let CSS size it (Astro infers intrinsic dims). The figure is below the fold, so do NOT add `loading="eager"` (default lazy is correct here).

Do NOT add `<style>` or `<script>`.

- [ ] **Step 3: Mount in `index.astro`** after `<Hero />`:
```astro
---
import Overview from '../components/Overview.astro';
---
<!-- after <Hero /> -->
<Overview />
```

- [ ] **Step 4: Verify**

Run: `bun run build`
Then: `grep -q 'id="overview"' dist/index.html && echo OVERVIEW_OK`
Confirm the optimized figure emitted: `ls dist/_astro/myogen_overview*.webp >/dev/null 2>&1 && echo FIG_OPTIMIZED`
Run: `bunx astro check` (expect 0 errors).

- [ ] **Step 5: Commit**
```bash
git add src/components/Overview.astro src/assets/myogen_overview.png public/myogen_overview.png src/pages/index.astro
git commit -m "feat: add Overview section with optimized figure"
```

---

## Task 2: Results section

**Files:**
- Create: `src/components/Results.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/Results.astro`**

Read `myogen-landing.html` lines 735–770 and lift the `<section id="validation">` verbatim: eyebrow "Results", the serif heading, the reference line ("From Sîmpetru & Molinari et al. (2026), bioRxiv" linked to the bioRxiv URL), and the 4-stat grid. The four stats (confirm exact text against source):
- **99.8%** — Discharge-rate coverage — VL, VM, FDI motor units
- **96.8%** — ISI-CV coverage — interspike-interval CV
- **< 3%** — Mean parameter deviation — vs Table S6 benchmarks
- **20 Hz** — Beta-band **reproduction** (NOT "replication") — Watanabe & Kohn regime

Keep the source's class names and markup structure exactly. No `<style>`/`<script>`.

- [ ] **Step 2: Mount in `index.astro`** after `<Overview />`:
```astro
import Results from '../components/Results.astro';
<!-- after <Overview /> -->
<Results />
```

- [ ] **Step 3: Verify**

Run: `bun run build`
Then: `grep -q 'id="validation"' dist/index.html && grep -q "99.8" dist/index.html && grep -qi "reproduction" dist/index.html && echo RESULTS_OK`
Run: `bunx astro check` (0 errors).

- [ ] **Step 4: Commit**
```bash
git add src/components/Results.astro src/pages/index.astro
git commit -m "feat: add Results stat strip"
```

---

## Task 3: Papers content collection

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/papers/2026-myogen.md`, `2026-decomposition.md`, `2026-beta-band.md`, `2026-prosthesis.md`, `2026-manifold.md`

This uses the **Astro 6 Content Layer API** (NOT the deprecated `type: 'content'` from the README). Before writing, verify the current API via Astro 6 docs (Context7: resolve "astro", query "content collections glob loader defineCollection schema") — confirm `glob` import path and `defineCollection({ loader, schema })` shape.

- [ ] **Step 1: Create `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const papers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/papers' }),
  schema: z.object({
    title: z.string(),
    authors: z.string(),
    venue: z.string(),            // e.g. "bioRxiv · 2026 · Founding paper" or "... · Example"
    year: z.number(),
    doi: z.string().optional(),
    url: z.string().url(),
    thumb: z.enum(['pipeline', 'decomp', 'force', 'grid', 'manifold']),
    featured: z.boolean().default(false),
    kind: z.enum(['real', 'example']).default('example'),
  }),
});

export const collections = { papers };
```
(If Context7 shows a differing current signature for Astro 6, follow the docs and note the difference.)

- [ ] **Step 2: Create one Markdown file per paper**

Extract the exact card content (venue line, title, authors, DOI/URL) from `myogen-landing.html` lines 771–934. Create these five files (frontmatter only; body can be empty). Match the source's exact text and DOIs. Example shape for the founding paper:

```md
---
title: "MyoGen: Unified Biophysical Modeling of Human Neuromotor Activity and Resulting Signals"
authors: "Sîmpetru, Molinari, Rohlf, Batichotti, Watanabe, Elias, Del Vecchio"
venue: "bioRxiv · 2026 · Founding paper"
year: 2026
doi: "10.64898/2026.01.01.697284"
url: "https://www.biorxiv.org/content/10.64898/2026.01.01.697284"
thumb: "pipeline"
featured: true
kind: "real"
---
```

The other four are the example cards from the source (kind: "example", placeholder DOIs `10.0000/example.NNN` exactly as in the source, venue lines ending "· Example"):
- `2026-decomposition.md` → thumb "decomp"
- `2026-beta-band.md` → thumb "force"
- `2026-prosthesis.md` → thumb "grid"
- `2026-manifold.md` → thumb "manifold"

Use the source's exact titles/authors/venues/DOIs for each. Set `year` so sort-desc yields the README order (examples above the founding paper). If all are 2026, add a tiebreak: keep the founding paper last by giving it the lowest sort priority (e.g., the examples can share year 2026 and the founding paper `featured:true`; Literature.astro sorts examples first then appends the founding/real paper last — see Task 5).

- [ ] **Step 3: Verify**

Run: `bun run build`
Expected: builds with no content-collection schema errors. Run `bunx astro check` (0 errors). (Nothing renders yet — Literature is Task 5.)

- [ ] **Step 4: Commit**
```bash
git add src/content.config.ts src/content/papers
git commit -m "feat: add papers content collection (Content Layer API)"
```

---

## Task 4: Thumbnail components + PaperCard

**Files:**
- Create: `src/components/thumbs/PipelineThumb.astro`, `DecompThumb.astro`, `ForceThumb.astro`, `GridThumb.astro`, `ManifoldThumb.astro`
- Create: `src/components/PaperCard.astro`

- [ ] **Step 1: Extract the 5 thumbnail SVGs**

In `myogen-landing.html` lines 771–934 each paper card has an inline SVG thumbnail (128px tall, light-gray bg, paper-themed drawing). Lift each SVG verbatim into its own component. Map source → component by the drawing described in README §Literature:
- `PipelineThumb.astro` — pipeline-with-loop (founding paper)
- `DecompThumb.astro` — multichannel EMG + spike markers (decomposition)
- `ForceThumb.astro` — trapezoid + 20 Hz overlay (beta-band)
- `GridThumb.astro` — HD-sEMG grid heatmap (prosthesis)
- `ManifoldThumb.astro` — PC scatter (manifold)

Each thumb component is just the `<svg>...</svg>` (keep its classes/viewBox). Per README, thumbs should use `currentColor` for the accent line work and `var(--signal)` for spike accents — preserve whatever the source uses; do not invent new colors.

- [ ] **Step 2: Create `src/components/PaperCard.astro`**

Props: `{ venue, title, authors, doi?, url, thumb, kind }`. Render the card structure from the source (lines 771–934): the 128px thumb area at top (render the correct thumb component by the `thumb` value), a 1px border below the thumb, then body with venue (mono caps, accent-ink), title (serif), authors (sans tertiary), and a DOI link at the bottom (mono, underlined) pointing to `url` showing `doi:DOI` when `doi` is present. Keep the source class names so `global.css` styles it.

```astro
---
import PipelineThumb from './thumbs/PipelineThumb.astro';
import DecompThumb from './thumbs/DecompThumb.astro';
import ForceThumb from './thumbs/ForceThumb.astro';
import GridThumb from './thumbs/GridThumb.astro';
import ManifoldThumb from './thumbs/ManifoldThumb.astro';

interface Props { venue: string; title: string; authors: string; doi?: string; url: string; thumb: 'pipeline'|'decomp'|'force'|'grid'|'manifold'; kind: 'real'|'example'; }
const { venue, title, authors, doi, url, thumb, kind } = Astro.props;
const Thumb = { pipeline: PipelineThumb, decomp: DecompThumb, force: ForceThumb, grid: GridThumb, manifold: ManifoldThumb }[thumb];
---
<!-- replicate the source card markup; render <Thumb /> in the thumbnail area; class names from source -->
```

- [ ] **Step 3: Verify**

Run: `bun run build` (still no render path yet, but the components must compile). Run `bunx astro check` (0 errors).

- [ ] **Step 4: Commit**
```bash
git add src/components/thumbs src/components/PaperCard.astro
git commit -m "feat: add paper-card thumbnails and PaperCard component"
```

---

## Task 5: Literature section + wire-up

**Files:**
- Create: `src/components/Literature.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/Literature.astro`**

Lift the section shell from `myogen-landing.html` lines 771–934 (eyebrow "In the literature", heading "Papers using MyoGen.", lede paragraph about PRs welcome). Then render the 3-column tile grid from the `papers` collection:

```astro
---
import { getCollection } from 'astro:content';
import PaperCard from './PaperCard.astro';

const papers = await getCollection('papers');
// README order (antichronological): example cards first, founding/real paper last.
const examples = papers.filter((p) => p.data.kind === 'example').sort((a, b) => b.data.year - a.data.year);
const real = papers.filter((p) => p.data.kind === 'real');
const ordered = [...examples, ...real];
---
<!-- section shell + grid -->
<!-- FIRST card: the "Your paper here?" placeholder (dashed border, + icon),
     linking to https://github.com/NsquaredLab/MyoGen/issues/new?labels=publication
     — lift this card's exact markup from the source; it is NOT in the collection. -->
{ordered.map((p) => (
  <PaperCard venue={p.data.venue} title={p.data.title} authors={p.data.authors}
             doi={p.data.doi} url={p.data.url} thumb={p.data.thumb} kind={p.data.kind} />
))}
```

Confirm the resulting on-page order matches README §Literature: (1) "Your paper here?" placeholder, (2) Manifold, (3) Prosthesis, (4) Beta-band, (5) Decomposition, (6) MyoGen founding paper last. If the year-based sort does not reproduce that exact example ordering, set distinct `year`/sort values in the Task 3 frontmatter (or add a numeric `order` field to the schema) so it does — and update Task 3 files accordingly. The founding (real) paper must render last.

- [ ] **Step 2: Mount in `index.astro`** after `<Results />`:
```astro
import Literature from '../components/Literature.astro';
<!-- after <Results /> -->
<Literature />
```

- [ ] **Step 3: Verify**

Run: `bun run build`
Then:
- `grep -q 'id="literature"' dist/index.html && echo LIT_OK`
- `grep -q "Papers using MyoGen" dist/index.html && echo HEADING_OK`
- `grep -q "issues/new?labels=publication" dist/index.html && echo ADDYOURS_OK`
- Confirm all 5 collection papers render: `grep -c "paper-card\|card" dist/index.html` (sanity — expect the 5 collection cards + the placeholder).
- Confirm the founding paper appears after the example cards in source order (inspect the built HTML order).
Run: `bunx astro check` (0 errors).

- [ ] **Step 4: Commit**
```bash
git add src/components/Literature.astro src/pages/index.astro
git commit -m "feat: add Literature section driven by the papers collection"
```

---

## Self-review checklist (run after all tasks)
- `rm -rf dist && bun run build` clean; `bunx astro check` 0 errors.
- `! grep -rqi babel dist` (no in-browser transpile).
- Manual browser check (`bun run preview`): Overview figure renders (white card in both themes), the 4 callouts and 4 stats match the mockup, the paper grid shows the placeholder first and the founding paper last, DOIs link out, and everything looks right in light + dark at desktop and mobile widths.

## Out of scope (later: Phase 2b)
Researchers, Governance, DocsCta, Contribute, Citation (with BibTeX highlight + copy), and the Footer.
