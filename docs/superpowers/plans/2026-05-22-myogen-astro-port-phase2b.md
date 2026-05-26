# MyoGen Astro Port — Phase 2b Implementation Plan (finish the page)

> Execute via superpowers:subagent-driven-development.

**Goal:** Port the final six sections — Researchers, Governance, DocsCta, Contribute, Citation (with BibTeX syntax highlighting + copy), and the Footer — completing the single-page port.

**Architecture:** Same as Phases 1–2a: verbatim markup/copy lift from `myogen-landing.html`; all visual CSS already in `src/styles/global.css` (do NOT add section CSS). The only JS this phase is the Citation BibTeX highlighter + copy buttons, ported as `is:inline` scripts (vanilla, no framework). All body prose is justified per the established policy.

**Tech Stack:** Astro 6.3.7 (static), bun. No new islands.

**Source ranges in `myogen-landing.html`:**
- Researchers: `<section id="audience">` — **935–960**
- Governance: `<section id="governance">` — **961–1065**
- DocsCta: `<section id="docs">` — **1066–1101**
- Contribute: `<section id="contribute">` — **1102–1139**
- Citation: `<section id="citation">` — **1140–1190** (two `.bibcard` blocks at 1157, 1174)
- Footer: `<footer class="site">` — **1191–1239**
- BibTeX copy handler: **1240–1278**; BibTeX highlighter `highlightBib()`: **1279–~1353**

**Conventions:** verbatim copy (no em dashes not already in source); `import.meta.env.BASE_URL` for asset/internal refs; each task ends with a commit; NO Co-Authored-By trailer. Verify = `bun run build` clean + `bunx astro check` 0 errors.

**Final page order in `src/pages/index.astro`:** TopNotice, SiteNav, Hero, Overview, Results, Literature, Researchers, Governance, DocsCta, Contribute, Citation, Footer.

---

## Task 1: Five static sections (Researchers, Governance, DocsCta, Contribute, Footer)

**Files:**
- Create: `src/components/Researchers.astro`, `Governance.astro`, `DocsCta.astro`, `Contribute.astro`, `SiteFooter.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1:** For each section, read its source range and lift the markup VERBATIM into its component (exact copy, classes, links, structure). Use `import.meta.env.BASE_URL` for the footer logo (`myogen_logo.png` is in `src/assets`; if the footer needs the logo, import it and use `<Image>` like the nav — match the source's footer logo size; otherwise use the existing brand pattern). Do NOT add `<style>`/`<script>`. Key content to preserve (verify against source):
  - **Researchers** (935–960): eyebrow "For researchers", heading, lede, 6-item list (HD-sEMG decomposition, Motor-control research, Spinal circuit modelling, Neural-interface design, Myoelectric prosthetics, Rehabilitation engineering).
  - **Governance** (961–1065): two cards — Scientific Steering Council (Del Vecchio, Elias, Watanabe) and Maintainer Council (Sîmpetru, Molinari, Rohlf, Batichotti) with their exact roles/affiliations, plus the left-bordered footnote callout about founding-maintainer authority.
  - **DocsCta** (1066–1101): dark card, heading "Read the docs. Run an example. Cite the preprint.", body, two buttons (Open documentation / GitHub repository), and the terminal snippet (`uv add myogen` … `simulator.SurfaceEMG`). Keep the terminal markup exactly (the `$`/`>>>`/`#` coloring is CSS-driven).
  - **Contribute** (1102–1139): 3 cards — Propose / Report / Build — with their mono tags, titles, and sentences.
  - **Footer** (1191–1239): 4-column grid (Brand + tagline; Project; Research; Labs with the four lab URLs) and the bottom row (copyright + DOI).

- [ ] **Step 2:** Mount in `src/pages/index.astro` IN THIS ORDER after `<Literature />`:
```astro
import Researchers from '../components/Researchers.astro';
import Governance from '../components/Governance.astro';
import DocsCta from '../components/DocsCta.astro';
import Contribute from '../components/Contribute.astro';
import SiteFooter from '../components/SiteFooter.astro';
// ...after <Literature />:
<Researchers /><Governance /><DocsCta /><Contribute /><SiteFooter />
```
(Citation will be inserted between Contribute and SiteFooter in Task 2 — leave that gap.)

- [ ] **Step 3: Verify** — `bun run build` clean; `grep -q 'id="audience"' dist/index.html && grep -q 'id="governance"' dist/index.html && grep -q 'id="docs"' dist/index.html && grep -q 'id="contribute"' dist/index.html && grep -q '<footer' dist/index.html && echo SECTIONS_OK`; `bunx astro check` 0 errors.

- [ ] **Step 4: Commit** (one commit is fine): `git commit -m "feat: add Researchers, Governance, DocsCta, Contribute, and Footer sections"`

---

## Task 2: Citation section + BibTeX highlight & copy

**Files:**
- Create: `src/components/Citation.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/Citation.astro`** — lift the `<section id="citation">` (1140–1190) verbatim: eyebrow + heading + lede, then the 2-up `.bibcard` grid (Preprint · bioRxiv and Software · Zenodo), each with a `.head` containing a `[data-copy-bib]` "Copy BibTeX" button and a `<pre>` holding the BibTeX. Copy the BibTeX text EXACTLY (the `@article{...}` and `@software{...}` entries from the source — exact fields, line breaks, DOIs). Keep all class names.

- [ ] **Step 2: Add the two inline scripts** to the component as `<script is:inline>` blocks, ported verbatim from source:
  - Copy handler (1240–1278): delegated `document` click on `[data-copy-bib]` → find nearest `.bibcard pre` → `navigator.clipboard.writeText(pre.textContent.trim())` → swap button label to "Copied" for ~1600ms.
  - `highlightBib()` (1279–~1353): on `DOMContentLoaded`, for each `.bibcard pre`, tokenize the BibTeX and wrap tokens in `<span class="tk-*">` (type/key/field/punct/number). Port the tokenizer EXACTLY. The Copy button must still read clean `textContent` (highlighting only changes innerHTML).
  Port both verbatim; they target `.bibcard` elements which now live in this component.

- [ ] **Step 3: Insert into `src/pages/index.astro`** between `<Contribute />` and `<SiteFooter />`:
```astro
import Citation from '../components/Citation.astro';
// <Contribute /> <Citation /> <SiteFooter />
```

- [ ] **Step 4: Verify** — `bun run build` clean; `grep -q 'id="citation"' dist/index.html && grep -q 'data-copy-bib' dist/index.html && grep -q 'simpetru' dist/index.html && grep -q 'tk-' -i dist/index.html; echo done` (note: tk-* spans are injected client-side, so they won't be in static HTML — verify the highlighter script and the `.tk-*` CSS exist instead: `grep -q 'data-copy-bib' dist/index.html && echo CITE_OK`). Confirm the two BibTeX entries are present (`@article`, `@software`). `bunx astro check` 0 errors. Manual: the page must show highlighted BibTeX and the Copy button copies clean text.

- [ ] **Step 5: Commit** — `git commit -m "feat: add Citation section with BibTeX highlighting and copy buttons"`

---

## Task 3: Justify new prose + final verification

**Files:** Modify `src/styles/global.css`; verification only otherwise.

- [ ] **Step 1:** Add the new Phase-2b prose selectors to the existing justify rule in `global.css` (the block with `.hero-sub, .lede, ...`), so body paragraphs in Governance cards, the DocsCta paragraph, the Contribute card bodies, and the footer brand description are justified with `hyphens:auto`. Identify the exact class names from the built components (e.g. `.docs-cta p`, the governance card `p`, the contribute card `p`, `.foot-brand-desc`). Do NOT justify: headings, mono/terminal text, BibTeX `<pre>`, nav/footer link lists, short labels.

- [ ] **Step 2: Final verification:**
  - `rm -rf dist && bun run build` clean; `bunx astro check` 0 errors.
  - `! grep -rqi babel dist && echo NO_BABEL_OK`.
  - Manual browser check (`bun run preview`): all sections render in order and match the mockup at desktop + mobile, in light + dark; BibTeX is syntax-highlighted and Copy works (clean text); justified prose reads cleanly.

- [ ] **Step 3: Commit** — `git commit -m "style: justify Phase 2b prose; finalize page"`

---

## Done = the full single-page site is ported. (Deferred/optional later: finalize GitHub Pages site/base + enable deploy.)
