# ADR-003 — Design System strategy (revised)

- **Status**: Accepted (revised 2026-04-21)
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F0
- **Supersedes**: ADR-003 (original, 2026-04-21) — a parallel `--fcy-*` design system
- **Related**: ADR-001 (territory), ADR-002 (section convention), ADR-010 (Horizon DS contract)

## Context

The original ADR-003 proposed a **parallel** Design System under `--fcy-*` CSS custom properties, with its own `tokens.config.ts` as source of truth and its own settings group exposed to merchants. That design was wrong once we inspected Horizon's actual DS.

Horizon already ships a massive, mature Design System:

- `snippets/theme-styles-variables.liquid` (688 lines) emits global `:root` tokens for typography, spacing, animation, z-index, shadows, icons, inputs, drawers, buy buttons, and more — all bound to merchant settings.
- `assets/base.css` (~5000 lines) and companion stylesheets consume those tokens and add color-scheme-scoped tokens (`--color-foreground`, `--color-background`, `--color-primary`, `--color-border`, button colors, input colors, variant colors, etc.) under `.color-scheme-N` classes.
- Merchants configure color via **color schemes** in theme settings (multiple schemes, selected per-section through a `color_scheme` setting).

A parallel `--fcy-*` DS would therefore create:

1. **Two color pickers in the theme editor** for the same visual concept — merchant UX damage.
2. **Guaranteed visual incoherence** between Horizon sections and fancyfy sections (two independent palettes).
3. **Massive duplication** of well-built infrastructure (spacing scales, animation easings, z-index layers, typography presets).

The question "if the DS does not touch Horizon sections, how do we guarantee theme homogeneity?" has no good answer under the parallel model. The right answer is: **fancyfy extends Horizon's DS, does not replace it.**

## Decision

### 1. Reuse-first principle

fancyfy sections consume Horizon's CSS custom properties **directly**. `--fcy-*` tokens exist only for narrowly-defined cases; they are additive, not substitutive.

### 2. Three categories of tokens

Every CSS custom property used in a fancyfy section falls into exactly one of these categories:

**A — Horizon global tokens (always at `:root`).** Consumed directly.

Typography, spacing, animation, z-index, border radius, shadows, icon sizes, input dimensions, drawer dimensions, button sizes, etc. These are declared in `snippets/theme-styles-variables.liquid` and are available on every page.

```scss
.fcy-megamenu {
  padding: var(--padding-xl);                /* Horizon */
  border-radius: var(--style-border-radius-md);  /* Horizon */
  transition: opacity var(--animation-values);    /* Horizon */
  z-index: var(--layer-header-menu);              /* Horizon */
  font-size: var(--font-size--md);                /* Horizon */
}
```

**B — Horizon color-scheme tokens (scoped to `.color-scheme-N`).** Consumed directly, but the section must live inside a color-scheme context.

`--color-foreground`, `--color-background`, `--color-border`, `--color-primary`, `--color-primary-button-*`, `--color-input-*`, and similar. These resolve only when an ancestor has a `color-scheme-N` class.

Every fancyfy section that renders on-page content MUST:

- Declare a `color_scheme` setting in its schema (reusing Horizon's scheme picker type).
- Wrap its top-level markup with `class="color-{{ section.settings.color_scheme }}"` (matching Horizon's convention).

This delivers **one color picker experience** across Horizon and fancyfy sections — the merchant picks a scheme, and both worlds resolve the same colors.

```liquid
<!-- fancyfy/sections/megamenu/fcy-megamenu.liquid -->
<fcy-megamenu
  class="fcy-megamenu color-{{ section.settings.color_scheme }}"
>
  ...
</fcy-megamenu>
```

**C — fancyfy-exclusive tokens (`--fcy-*`).** Only when Horizon does not provide an equivalent.

Examples:

- `--fcy-color-pin` — pin overlay color for the shoppable-image section.
- `--fcy-color-map-marker` — marker color for store locator.
- `--fcy-megamenu-panel-max-width` — a layout-specific constant not in Horizon.
- `--fcy-store-locator-map-height` — section-specific dimension.

A `--fcy-*` token is justified when:

1. Horizon has no token of equivalent meaning, AND
2. The value is shared between multiple selectors in the section (otherwise it's just a local variable), AND
3. Merchant customization of that value makes sense, OR the value is a stable cross-file constant for fancyfy sections.

### 3. Declaration of `--fcy-*` tokens

All `--fcy-*` tokens live in **one file**: `snippets/fcy-tokens.liquid`, rendered once in `layout/theme.liquid` inside `<head>`.

```liquid
{%- comment -%} snippets/fcy-tokens.liquid {%- endcomment -%}
<style id="fcy-tokens">
  :root {
    /* === Semantic aliases — backed by Horizon tokens ===
       Use these ONLY when you want decoupling from a Horizon token rename.
       For common cases, consume the Horizon token directly. */
    --fcy-radius-panel: var(--style-border-radius-md);

    /* === Fancyfy-exclusive tokens — Horizon does not provide these === */
    --fcy-color-pin:        {{ settings.fancyfy_color_pin        | default: '#FFD54A' }};
    --fcy-color-map-marker: {{ settings.fancyfy_color_map_marker | default: '#111111' }};
    --fcy-megamenu-panel-max-width:  72rem;
    --fcy-megamenu-panel-max-cols:   6;
    --fcy-store-locator-map-height:  32rem;
  }
</style>
```

Every `--fcy-*` token has an inline comment identifying its category (alias or exclusive). This is enforced in code review — no un-annotated `--fcy-*` token.

### 4. Reduced `Fancyfy — Design System` settings group

The settings group under `config/settings_schema.json` is now **small and specific** — it only exposes the merchant-editable `--fcy-*` tokens from category C. No brand color, no font family, no radius scale (Horizon already owns those).

Example F0 content:

```json
{
  "name": "Fancyfy — Extensions",
  "settings": [
    { "type": "header",      "content": "Shoppable Image" },
    { "type": "color",       "id": "fancyfy_color_pin",       "label": "Pin color",        "default": "#FFD54A" },
    { "type": "header",      "content": "Store Locator" },
    { "type": "color",       "id": "fancyfy_color_map_marker","label": "Marker color",     "default": "#111111" }
  ]
}
```

We add entries lazily — only when a section that needs the token lands.

### 5. SASS structure — 7-1, smaller scope

Since we no longer own colors, typography, spacing, animation, or z-index, the DS folder shrinks:

```
fancyfy/ds/
├── abstracts/
│   ├── _mixins.scss          ← respond-to, focus-ring, visually-hidden, elevation-n
│   ├── _functions.scss       ← tiny helpers only
│   └── _breakpoints.scss     ← named @media queries (reuse Horizon breakpoints where possible)
├── base/
│   └── _reset.scss           ← minimal — Horizon already handles most resets
├── utilities/
│   └── _a11y.scss            ← .fcy-sr-only, .fcy-focus-visible
├── main.scss                 ← single entry, imports mixins + utilities
│
├── tokens.ts                 ← TypeScript mirror of the tokens we CONSUME from Horizon (see ADR-010)
├── fcy-tokens.config.ts      ← source for fancyfy-exclusive tokens (category C only)
└── schema/                   ← ADR-002 §4 — shared schema primitives
    ├── index.ts
    └── color-scheme.ts       ← helper to generate the `color_scheme` setting entry
```

No `themes/`, no per-client token profiles, no dual-theme structure. The DS is thin and additive.

### 6. TypeScript support for Horizon tokens

To give section authors autocomplete and type-check for the tokens they consume, `fancyfy/ds/tokens.ts` exports a typed union:

```ts
// Auto-maintained — see ADR-010 for the full list
export type HorizonGlobalToken =
  | '--padding-xl' | '--padding-2xl' | '--padding-3xl'
  | '--margin-xl' | '--margin-2xl' | '--margin-3xl'
  | '--gap-md' | '--gap-lg' | '--gap-xl'
  | '--style-border-radius-sm' | '--style-border-radius-md' | '--style-border-radius-lg'
  | '--animation-values' | '--animation-values-slow' | '--animation-values-fast'
  | '--ease-out-cubic' | '--ease-out-quad'
  | '--layer-base' | '--layer-raised' | '--layer-header-menu' | /* ... */;

export type HorizonSchemeToken =
  | '--color-foreground' | '--color-background' | '--color-border'
  | '--color-primary' | '--color-primary-hover'
  | '--color-primary-button-background' | /* ... */;

export type FcyToken =
  | '--fcy-color-pin' | '--fcy-color-map-marker'
  | '--fcy-megamenu-panel-max-width' | /* ... */;

export type AnyToken = HorizonGlobalToken | HorizonSchemeToken | FcyToken;

export function cssVar(t: AnyToken): string { return `var(${t})`; }
```

Use in TS:

```ts
element.style.setProperty('--some-local', cssVar('--color-foreground'));
```

ADR-010 contains the canonical list. Any attempt to consume a token outside this list fails type-check.

### 7. Linting rules

**Stylelint** (`fancyfy/ds/.stylelintrc.cjs`):

- `declaration-property-value-disallowed-list`:
  - `color`, `background-color`, `border-color`: disallow hex literals, `rgb()`, `hsl()` in section SCSS. Must use `var(--color-*)` (Horizon scheme) or `var(--fcy-color-*)` (fancyfy-exclusive).
  - `font-family`: must use `var(--font-*)` (Horizon).
  - `border-radius`: must use `var(--style-border-radius-*)` or `var(--fcy-radius-*)`.
- `custom-property-pattern`: `^(color|font|layer|padding|margin|gap|style|animation|ease|spring|opacity|shape|drawer|button|input|variant-picker|slideshow|shadow|gradient|section-height|letter-spacing|line-height|sidebar|narrow|normal|wide|max-width|height|card|modal|quick-add|icon|checkbox|cart|minimum|backdrop|disabled|skeleton|view-transition|focus|badge|spacing-scale|scroll|border|checkout|peek|hover|fcy)` — prefixes allowed in section SCSS. Local custom properties without a prefix are flagged.
- Custom rule `fcy/token-in-contract`: token names used via `var(--...)` must appear in the list exported from `fancyfy/ds/tokens.ts`. Enforces ADR-010.

**ESLint** (TS): the `cssVar` helper is the only way to produce CSS variable strings in TS — a rule forbids inline `'var(--...)'` string literals.

### 8. Relation to Horizon's color schemes

fancyfy does not define its own color schemes. The merchant configures schemes in Horizon's existing `Color schemes` settings. Each fancyfy section inherits the full scheme machinery via the `color_scheme` setting it declares. If the merchant adds or removes schemes, fancyfy sections see the updated list automatically.

### 9. Per-client customization — revised

Because fancyfy no longer owns the common tokens, per-client customization happens **in Horizon's settings**: the merchant (or the agency) configures brand colors, fonts, radii via the existing Horizon settings UI. No fancyfy-specific override mechanism is needed for common tokens.

For fancyfy-exclusive tokens (category C), the merchant edits them in `Fancyfy — Extensions`.

For deeper customization (a client that wants a fundamentally different animation curve for a fancyfy section, for example), the path is a **per-section setting** added in that section's schema — not a global DS fork.

### 10. Explicit exclusions

- No dark mode. Color schemes already let a merchant configure a "Dark" scheme and apply it per-section; if they want a site-wide dark mode toggle, that's a feature we add via section opt-ins, not a DS-wide duality. Not in F0–F6.
- No per-client DS forks. Kept the `themes/` folder idea from original ADR-003? Removed. Client customization lives in Horizon settings; dev-side customization is per-section.

## Consequences

**Positive:**

- Visual coherence between Horizon and fancyfy sections is the **default**. One color picker UX.
- Massive reduction in code we own: no spacing scale, no typography presets, no animation library. Less surface area, less to maintain.
- Zero duplicate settings for the merchant.
- Sections behave exactly like Horizon sections in the theme editor (color scheme selector feels native).
- TypeScript-checked token usage catches typos at build time.

**Negative / accepted costs:**

- **Coupling to Horizon token names.** If Horizon renames `--padding-xl` to something else, fancyfy sections break. Mitigated by ADR-010: we maintain a contract list; every merge validates the tokens still exist.
- **Color-scheme wrapping adds a small discipline**: every fancyfy section must include `color-{{ settings.color_scheme }}` in its wrapper class.
- **Less freedom to invent our own visual language**: we live inside Horizon's design vocabulary. This is what we traded for coherence, deliberately.

## Alternatives considered

- **Parallel `--fcy-*` DS with own settings group.** (Original ADR-003.) Rejected: two color pickers, incoherent storefront, massive duplication.
- **Replace Horizon's DS entirely with ours.** Rejected: invalidates the upstream-merge premise (ADR-001); rewrites 5000+ lines of CSS needlessly.
- **Bridge that aliases every Horizon token to `--fcy-*`.** Rejected: adds a translation layer with no semantic gain; we'd end up with `--fcy-padding-xl` that always equals `--padding-xl` — pure overhead.
- **Use only `--fcy-*` tokens and forbid Horizon's.** Rejected: collapses to the parallel DS problem again; forces us to re-declare every Horizon token.
