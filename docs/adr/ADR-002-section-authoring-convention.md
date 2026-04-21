# ADR-002 — Section authoring convention (`fcy-*`)

- **Status**: Accepted
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F0
- **Related**: ADR-001 (territory rule), ADR-003 (DS), ADR-004 (tooling), ADR-005 (distribution)

## Context

fancyfy's value is a catalog of premium sections that agency devs cherry-pick into client themes. For that workflow to be clean, each section must be:

1. **Self-contained** — all source files in one folder; no scattered dependencies.
2. **Self-describing** — a machine-readable manifest declares dependencies, so a dev (or a future CLI) can validate compatibility before copying.
3. **Predictably named** — prefix and filename conventions let merge tools and developers identify sections at a glance.
4. **Portable** — consumes only the design system contract (CSS custom properties from ADR-003), no ambient Horizon state, no hidden globals.

We also need a consistent way to author section schema (the `{% schema %}` block) that avoids duplicating long token/enum lists across sections.

## Decision

### 1. Folder layout

Each section lives in a single folder under `fancyfy/sections/<section-id>/`:

```
fancyfy/sections/megamenu/
├── fcy-megamenu.liquid               ← source template (uses asset helpers)
├── fcy-megamenu.ts                   ← TS entry; defines the web component
├── fcy-megamenu.scss                 ← styles; imports DS only
├── fcy-megamenu.schema.ts            ← exports schema object (merged into liquid at build)
├── fcy-megamenu.manifest.json        ← the portability contract
├── README.md                         ← cherry-pick guide + usage
├── blocks/                           ← optional: section-specific block types
│   ├── fcy-megamenu-column.block.liquid
│   └── fcy-megamenu-promo.block.liquid
└── __tests__/                        ← optional: unit tests for TS logic
```

### 2. Naming rules

- `section-id` is kebab-case, stable, singular, descriptive: `megamenu`, `sticky-atc`, `store-locator`, `shoppable-image`.
- All filenames begin with `fcy-<section-id>`.
- Web component tag: `<fcy-<section-id>>` (e.g., `<fcy-megamenu>`).
- Custom element class name (TS): `Fcy<PascalCaseSectionId>Element`.
- CSS class root: `.fcy-<section-id>`; children follow BEM (`.fcy-megamenu__panel`, `.fcy-megamenu--open`).
- Section schema `type` in liquid: `"fcy-<section-id>"`.
- Block `type` names: `"fcy-<section-id>-<block-id>"`.

Rationale: the prefix rule from ADR-001 is worth the tiny verbosity cost. It makes every collision impossible and every ownership check trivial.

### 3. Build-time transformation

The Vite pipeline (ADR-004) takes the folder above and emits:

- `sections/fcy-megamenu.liquid` — source liquid with schema injected (`{% schema %} ... {% endschema %}`) and asset references rewritten to hashed paths.
- `blocks/fcy-megamenu-column.block.liquid` — copied (with asset rewrites) if present.
- `assets/fcy-megamenu.[hash].js` — TS entry compiled, minified, tree-shaken.
- `assets/fcy-megamenu.[hash].css` — SCSS compiled.

Liquid source may reference assets via a build helper convention (e.g., `{{- 'fcy-megamenu.js' | fcy_asset -}}`) that the build resolves to the correct hashed filename.

### 4. Schema authoring in TypeScript

Section schema lives in `fcy-<section-id>.schema.ts` and exports a typed object:

```ts
import { defineSection, tokens } from '@fancyfy/ds/schema';

export default defineSection({
  name: 'Fancyfy — Megamenu',
  class: 'fcy-megamenu',
  tag: 'section',
  enabled_on: { groups: ['header'] },
  settings: [
    { type: 'header', content: 'Layout' },
    { type: 'select', id: 'panel_width', label: 'Panel width',
      options: [
        { value: 'contained', label: 'Contained' },
        { value: 'full',      label: 'Full width' },
      ], default: 'contained' },
    tokens.colorPicker('accent_color', 'Accent color'),
    // ...
  ],
  blocks: [ /* imported from blocks/*.block.ts */ ],
  presets: [ /* curated starter configurations */ ],
});
```

Why TS, not inline JSON in liquid:

- Shared primitives (color pickers bound to DS tokens, font pickers bound to allowed font families) live in a single `@fancyfy/ds/schema` module.
- Type-checking catches missing ids, duplicate keys, and invalid setting types at build time.
- Blocks and presets can be composed from reusable parts.
- The build emits a stable `{% schema %}` block into the liquid output; merchants see no difference.

### 5. The manifest — `fcy-<section-id>.manifest.json`

The manifest is the **portability contract**. A dev (or the future CLI in ADR-005) reads it to decide whether a client's theme is ready to receive the section.

Required keys:

```json
{
  "id": "megamenu",
  "version": "0.1.0",
  "displayName": "Megamenu",
  "category": "navigation",
  "description": "Multi-column flyout navigation with mobile accordion.",
  "files": {
    "sections":  ["fcy-megamenu.liquid"],
    "blocks":    ["fcy-megamenu-column.block.liquid", "fcy-megamenu-promo.block.liquid"],
    "snippets":  [],
    "assets":    ["fcy-megamenu.js", "fcy-megamenu.css"]
  },
  "tokens_required":           ["color.surface.raised", "color.text.primary", "radius.md", "motion.duration.base"],
  "snippets_required":         [],
  "settings_schema_required":  ["fancyfy.typography.heading"],
  "horizon_min_version":       "3.4.0",
  "fancyfy_min_version":       "0.1.0",
  "supersedes":                [],
  "keywords":                  ["navigation", "header", "menu"]
}
```

Field semantics:

- `files` lists **runtime** artifacts (what ends up in the client theme), not source paths.
- `tokens_required` lists DS token keys consumed by the section's SCSS. The CLI/tooling can diff this against the client's DS to warn about missing tokens.
- `snippets_required` lists Horizon or fancyfy snippets the section depends on (e.g., `fcy-tokens` for the DS bridge).
- `settings_schema_required` lists merchant-editable settings keys the section expects (e.g., a brand color). If missing, the DS bridge falls back to defaults.
- `horizon_min_version` is enforced at cherry-pick time.
- `fancyfy_min_version` lets us tighten contracts without breaking old integrations.

### 6. README.md structure (per section)

Each section's README is the dev's handbook for cherry-picking:

1. Preview screenshot(s) and short description.
2. Settings matrix (what the merchant can tune).
3. Cherry-pick steps: files to copy, tokens to add to client DS, snippets to include, schema additions.
4. Compatibility notes and known issues.
5. Changelog per version.

Template: `fancyfy/sections/_template/README.md` (to be created in F0).

### 7. Rules for section SCSS, TS, and Liquid

- **SCSS**:
  - MUST `@use 'fancyfy/ds/abstracts'` for mixins/utilities; the DS no longer owns tokens (see ADR-003 revised).
  - MUST consume tokens via `var(--...)` — either a **Horizon token** listed in the contract (`fancyfy/ds/tokens.ts`, per ADR-010) or a **fancyfy-exclusive** `--fcy-*` token declared in `snippets/fcy-tokens.liquid`.
  - MUST NOT contain raw hex codes, `rgb()`/`hsl()` literals, raw px for spacing on tokenable slots, or raw font-family strings.
  - Enforced by stylelint rules `declaration-property-value-disallowed-list` and the custom `fcy/token-in-contract` rule.
- **Liquid wrapper**:
  - Every section that renders on-page visual content MUST include a `color_scheme` setting in its schema and wrap its top-level element with `class="color-{{ section.settings.color_scheme }}"` (so Horizon's color-scheme tokens resolve inside the section). Use the `colorScheme()` helper from `@fancyfy/ds/schema` for the schema entry.
  - MUST NOT include `<script>` or `<style>` tags inline; scripts and styles come from the hashed asset bundles emitted by the build.
- **TS**:
  - MUST extend the base `FcyElement` class (from `fancyfy/shared/`).
  - MUST use the logger from `fancyfy/shared/logger` — never `console.*` directly (ADR-007).
  - When reading/writing CSS variables in TS, MUST use the typed `cssVar()` helper from `@fancyfy/ds/tokens` (ADR-010) — no inline `'var(--...)'` strings.

## Consequences

**Positive:**

- Cherry-picking becomes a mechanical checklist driven by `manifest.json`.
- Onboarding a new section author is "read `fancyfy/sections/_template/`, follow the convention, run `npm run build`."
- Reviewers can locate all artifacts of a section in one folder.
- Schema authoring in TS removes an entire class of liquid mistakes.
- Manifest is machine-readable → future CLI (`fancyfy add megamenu`) has a real contract to operate on.

**Negative / accepted costs:**

- Small boilerplate per section (6 files + folder). Mitigated by a generator script (`fancyfy/cli/new-section.ts`) in F0.
- Build step required before `shopify theme dev` can see a new section — developers learn the watch command.
- TS schema authoring is a new habit — we accept the learning curve for the typesafety gain.

## Alternatives considered

- **Inline `{% schema %}` JSON in liquid.** Rejected: duplicates token enum lists across sections; no type-checking; no shared primitives; drift between sections over time.
- **One monolithic bundle for all fancyfy sections.** Rejected: cherry-pick impossible; payload always loaded regardless of which sections are used on a client.
- **Flat file layout (no folder per section).** Rejected: hard to locate related files; grows painful beyond ~5 sections; no natural home for section-specific blocks or tests.
- **Use Horizon's existing `{% schema %}` conventions verbatim.** Rejected: couples authoring to upstream format changes; loses the shared-primitives advantage.
