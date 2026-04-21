# Horizon audit — v3.4.0

**Date:** 2026-04-21
**Scope:** Read-only audit of Horizon territory to feed ADR-009 (hidden prices), ADR-010 (DS contract), and F6 (cleanup).
**Sources:** `snippets/theme-styles-variables.liquid` (688 lines), `snippets/color-schemes.liquid` (~100 lines), `assets/base.css` (4946 lines), companion stylesheets, all `sections/`, `blocks/`, `snippets/`, `templates/`, `layout/`.

**Scope convention:**
- **global** — declared under `:root { ... }`, always available.
- **scheme** — declared under `.color-scheme-N` / `:root, .color-scheme-N` compound selectors, resolved only when an ancestor carries the scheme class.
- **scoped-class** — declared under a non-scheme class (e.g. `.page-width-wide`).
- **body-runtime** — set by JS on `document.body.style` at page load (e.g. `--header-height`).
- **runtime-emitted** — literally produced by a Liquid loop at render time; static regex scans won't find them.

---

## Section 1 — DS token contract refinement (ADR-010)

### 1.1 Contract tokens missing from Horizon

| Token | Contract location | Investigation |
|---|---|---|
| `--color-variant-selected-background` | ADR-010 §2.2 Variant picker | Actual name is `--color-selected-variant-background` (word order inverted). Declared at `snippets/color-schemes.liquid:66–71`. **Fix the contract.** |
| `--color-variant-selected-text` | §2.2 | Actual: `--color-selected-variant-text` at `snippets/color-schemes.liquid:68`. |
| `--color-variant-selected-border` | §2.2 | Actual: `--color-selected-variant-border` at `snippets/color-schemes.liquid:67`. |
| `--color-variant-selected-hover-background` | §2.2 | Actual: `--color-selected-variant-hover-background` at `snippets/color-schemes.liquid:69`. |
| `--color-variant-selected-hover-text` | §2.2 | Actual: `--color-selected-variant-hover-text` at `snippets/color-schemes.liquid:70`. |
| `--color-variant-selected-hover-border` | §2.2 | Actual: `--color-selected-variant-hover-border` at `snippets/color-schemes.liquid:71`. |
| `--font-size--paragraph`, `--font-size--h1`…`--font-size--h6` | §2.1 Typography — sizes | **Runtime-emitted.** Not statically declared; produced by the Liquid loop in `snippets/theme-styles-variables.liquid:243–318` from `settings.type_size_*`. The validator needs a whitelist (see §4 below) or a Liquid-render pass. Same for all `--font-<preset>--size/family/style/weight/line-height/letter-spacing/case` (lines 322–352). |
| `--font-body--case`, `--font-subheading--case`, `--font-heading--case`, `--font-accent--case` | §2.1 | Not declared at top level. Sections needing "case" should use preset tokens like `var(--font-paragraph--case)`. |

### 1.2 Horizon tokens worth adding to the contract

| Token | Declared | Why useful |
|---|---|---|
| `--color-foreground-muted` | `snippets/color-schemes.liquid:76` (scheme) | Subdued text color (70% foreground). Used by `snippets/localization-form.liquid:339`, `sections/header.liquid:1094`, `snippets/sorting.liquid:325`, `snippets/header-drawer.liquid:1146`, `blocks/_header-menu.liquid:560`. Agency sections routinely want muted body text. |
| `--color-foreground-heading-rgb` | `snippets/color-schemes.liquid:33` (scheme) | RGB triplet for heading — needed for opacities. Pattern at `blocks/_blog-post-card.liquid:85`. |
| `--color-primary-rgb` | `snippets/color-schemes.liquid:35` (scheme) | Opacity variants of `--color-primary`. |
| `--color-primary-hover-rgb` | `snippets/color-schemes.liquid:37` (scheme) | Same. |
| `--color-input-text-rgb` | `snippets/color-schemes.liquid:56` (scheme) | Same. |
| `--color-variant-text-rgb` | `snippets/color-schemes.liquid:62` (scheme) | Same. |
| `--color-selected-variant-background` / `-text` / `-border` / `-hover-background` / `-hover-text` / `-hover-border` | `snippets/color-schemes.liquid:66–71` (scheme) | Correct names for what ADR-010 §2.2 asked for with word-order inversion. |
| `--hover-lift-amount`, `--hover-scale-amount`, `--hover-subtle-zoom-amount`, `--hover-shadow-color` | `assets/base.css:16–19` (global) | Horizon's hover interaction constants. Megamenu and card-hover fancyfy sections want to match. |
| `--hover-transition-duration`, `--hover-transition-timing` | `assets/base.css:20–21` (global) | Paired timing for hover effects. |
| `--surface-transition-duration`, `--surface-transition-timing` | `assets/base.css:22–23` (global) | Panels/drawers. |
| `--submenu-animation-speed`, `--submenu-animation-easing` | `assets/base.css:24–25` (global) | F1 megamenu should consume these to feel native. |
| `--page-margin` | `assets/base.css:388,396` (scoped to `.page-width-*`) | Sticky-ATC / shoppable-image / breakout sections need it. |
| `--page-content-width` | `assets/base.css:402,407,414,419` (scoped) | Resolved content width. |
| `--page-width` | `assets/base.css:403,408,415,420` (scoped) | Full container width. |
| `--full-page-grid-with-margins` | `assets/base.css:433` (scoped) | Horizon's full-bleed grid columns template. |
| `--header-height` | `layout/theme.liquid:79` (body-runtime) | Sticky-ATC (F2) will read this. Not CSS-declared. |
| `--header-group-height` | `layout/theme.liquid:80` (body-runtime) | Includes announcement bar. |
| `--top-row-height` | `layout/theme.liquid:84` (body-runtime) | Header's top row. |
| `--transparent-header-offset-boolean` | `layout/theme.liquid:94,101` (body-runtime) | Flag for transparent-header offset math. |
| `--border-color` | `snippets/theme-styles-variables.liquid:603` (global) | Composed default subtle divider. |
| `--style-border-popover`, `--style-border-drawer` | `theme-styles-variables.liquid:472–473` (global) | Composed border shorthands. |
| `--card-bg-hover`, `--card-border-hover`, `--card-border-focus` | `theme-styles-variables.liquid:676–678` (global) | Card interaction colors. |
| `--animation-slideshow-easing` | `theme-styles-variables.liquid:487` (global) | Slideshow-specific easing. |
| `--menu-font-sm--size` / `-md` / `-lg` / `-xl` / `-2xl` (+ matching `--line-height`) | `theme-styles-variables.liquid:370–379` (global) | Megamenu (F1) should consume. |

### 1.3 Scope misclassifications in ADR-010

| Token | ADR-010 claim | Observed scope |
|---|---|---|
| `--color-foreground-heading` | §2.2 scheme | Correct — scheme at `snippets/color-schemes.liquid:32`. Document the `-rgb` partner too (33). |
| `--input-disabled-background-color`, `--input-disabled-border-color`, `--input-disabled-text-color` | §2.1 global | Global default at `theme-styles-variables.liquid:569–571`, **overridden per-scheme** at `color-schemes.liquid:73–75`. Document as "global default, scheme override". |
| `--input-box-shadow`, `--input-box-shadow-focus` | §2.1 global | Global at `theme-styles-variables.liquid:567–568`, but reference `--color-input-border` (scheme). Effective scope is scheme-dependent. |
| `--font-h1--color`…`--font-h6--color` | §2.1 implicit | Declared twice: global at `theme-styles-variables.liquid:182–187` AND per-scheme at `color-schemes.liquid:77–82`. Effective scope is scheme. |
| `--checkbox-border` | §2.1 global | Global at `theme-styles-variables.liquid:577`, but references `--opacity-35-55` which exists ONLY inside a scheme (`color-schemes.liquid:27`). Outside a scheme wrapper → invalid color. |
| `--shadow-drawer`, `--shadow-popover`, `--shadow-blur` | Not in contract | Declared at `color-schemes.liquid:86,89,90` **conditionally** (`settings.drawer_drop_shadow` / `settings.popover_drop_shadow`). New category: "conditional token". |
| `--color-error`, `--color-success`, `--color-white`, `--color-white-rgb`, `--color-black`, `--color-instock`, `--color-lowstock`, `--color-outofstock` | §2.2 status-global note | Correct — global at `theme-styles-variables.liquid:382–389`. |

---

## Section 2 — Price render points (F2 patch list for ADR-009)

**Recommendation:** central patch at `snippets/price.liquid`, `snippets/format-price.liquid`, `snippets/unit-price.liquid`, `snippets/cart-products.liquid`, `snippets/cart-summary.liquid`, `snippets/volume-pricing-info.liquid`. Wrap the rest.

### PDP

| File | Lines | What's rendered | Wrapper |
|---|---|---|---|
| `snippets/price.liquid` | 75–126 (money filters 63–71) | Full price: regular, compare-at strikethrough, volume range, unit-price delegation | **central** — highest-value single patch |
| `blocks/price.liquid` | 48–52, installments 70–82 | Wraps `snippets/price.liquid`; tax note + installments | central via price.liquid; also wrap installments `<div>` |
| `blocks/buy-buttons.liquid` | 136, 138, 156, 158, 182, 184 | Volume-pricing per-tier rows with `money`/`money_with_currency` | wrap entire `<volume-pricing>` (121–212) |
| `snippets/volume-pricing-info.liquid` | 103, 127 | "/ each" labels | wrap whole snippet output |
| `snippets/quantity-selector.liquid` | 116, 139, 152, 154 | `data-variant-price` attributes + quantity-break JSON in DOM | attribute-level — empty string/sentinel when `fcy_hide_prices` |
| `snippets/meta-tags.liquid` | 77 | `<meta property="product:price:amount">` in `<head>` | wrap — omit when hidden to avoid OG leak |

### Product card (collection, search, related, recommended, hotspots)

| File | Lines | What's rendered | Wrapper |
|---|---|---|---|
| `snippets/price.liquid` | see PDP | Same snippet serves cards | central |
| `sections/section-rendering-product-card.liquid` | 53 | `render 'price'` — used by JS variant-refresh (`assets/variant-picker.js:282`, `assets/product-card.js:588`) | covered |
| `blocks/_featured-product-price.liquid` | 40–45; 5–14, 37–39 | `render 'price'` plus inline "From $X" label that bypasses central | central + additionally patch 5–14 + 37–39 |
| `blocks/_hotspot-product.liquid` | 57 | `render 'price'` | covered |
| `snippets/resource-card.liquid` | 147 | `render 'price'` for predictive search, header drawer, mega-menu, resource-list-carousel | covered |

### Cart page + cart drawer

| File | Lines | What's rendered | Wrapper |
|---|---|---|---|
| `snippets/cart-products.liquid` | 81 | Drawer subtotal | **central** — patch top of snippet |
| `snippets/cart-products.liquid` | 270, 274, 276, 286, 290 | Per-item unit prices + compare-at | wrap `<div class="cart-items__unit-price-wrapper">` (266–294) |
| `snippets/cart-products.liquid` | 357–372 | Per-item line total + unit price | wrap `<td class="cart-items__price">` (364–377) |
| `snippets/cart-summary.liquid` | 18 | Subtotal before discounts | wrap `<span class="cart-totals__item cart-totals__original">` (12–20) |
| `snippets/cart-summary.liquid` | 33 | Discount allocation amount | covered by same wrap |
| `snippets/cart-summary.liquid` | 220–222, 232–241 | Estimated total + installments | wrap `<div class="cart-totals__container">` (226–253) and replace `#checkout` with Contact CTA per ADR-009 §6 |
| `blocks/_cart-summary.liquid` | 32 | Renders cart-summary | covered |
| `snippets/header-actions.liquid` | 135, 213, 219 | Drawer renders cart-products + cart-summary | covered |
| `snippets/unit-price.liquid` | whole file | Standalone per-unit used by cart + PDP | **central** — patch top |

### Search / collection filters

| File | Lines | What's rendered | Wrapper |
|---|---|---|---|
| `snippets/price-filter.liquid` | 46, 50–59, 99, 105, 126, 130–132, 154 | Price-range filter UI | wrap whole snippet with `{% if fcy_hide_prices and settings.fancyfy_hide_prices_hide_filters %}{% return %}{% endif %}` |
| `snippets/filter-remove-buttons.liquid` | 31, 33, 35, 37, 39 | Applied-price-filter pill | wrap the price branch only |
| `blocks/filters.liquid` | 182, 443 | Calls `render 'price-filter'` | covered |
| `snippets/sorting.liquid` | sort options loop | Emits `price-ascending` / `price-descending` | wrap inside option loop — `{% continue %}` on price values |

### Predictive search

| File | Lines | What's rendered | Wrapper |
|---|---|---|---|
| `snippets/predictive-search-products-list.liquid` | 58, 73, 102 | Renders resource-card → price | covered |
| `snippets/predictive-search-resource-carousel.liquid` | 13 | Same | covered |
| `snippets/predictive-search-empty-state.liquid` | 30 | Popular products fallback | covered |
| `snippets/search-modal.liquid` | 112 | Hosts predictive-search-empty-state | covered |

### Quick-order-list (B2B-style)

| File | Lines | What's rendered | Wrapper |
|---|---|---|---|
| `sections/quick-order-list.liquid` | 115, 119, 124 | `render 'format-price'` per-item + compare-at | central via format-price |
| `sections/quick-order-list.liquid` | 234, 254 | volume-pricing-info per row | covered |
| `sections/quick-order-list.liquid` | 325, 350 | Aggregate total footer | covered |
| `snippets/format-price.liquid` | 20, 22 | Core inline formatter | **central** |

### Misc

| File | Lines | Notes |
|---|---|---|
| `templates/gift_card.liquid` | 55, 137 | Gift card balance — **do not patch** (customer-owned value, out of ADR-009 scope). |
| `snippets/tax-info.liquid` | — | No price literal. No patch. |

**Single-patch central set (~85% coverage):** `snippets/price.liquid`, `snippets/format-price.liquid`, `snippets/unit-price.liquid`, `snippets/cart-products.liquid`, `snippets/cart-summary.liquid`, `snippets/price-filter.liquid`, `snippets/filter-remove-buttons.liquid`, `snippets/sorting.liquid`, `snippets/meta-tags.liquid`, `snippets/volume-pricing-info.liquid`, `blocks/buy-buttons.liquid`, `blocks/_featured-product-price.liquid`, `snippets/quantity-selector.liquid`. Plus `layout/theme.liquid` for the visibility include.

---

## Section 3 — Cleanup candidates (feeds F6)

**Caveats:**
- Templates reference ~15 sections; every other section is an addable preset. Deleting removes the editor option but doesn't break existing stores.
- `sections/section.liquid` has `"type": "@theme"` — any non-underscore block can land anywhere. Zero-template-reference is a **weak** signal for non-underscore blocks.
- Merge-cost risk: `low` if Horizon rarely iterates, `medium` if actively touched, `high` if central.

### 3.1 Sections

| File | Evidence | Action | Merge risk |
|---|---|---|---|
| `sections/quick-order-list.liquid` | Preset only; no template. B2B wholesale, overlaps with ADR-009. | review | medium |
| `sections/product-hotspots.liquid` | Preset only. Overlaps F4 shoppable-image. | review — reassess at F4 | low |
| `sections/layered-slideshow.liquid` | Preset only. Demo-store look, ~350-line schema. | review | low |
| `sections/marquee.liquid` | Preset only. Scrolling banner. | review | low |
| `sections/custom-liquid.liquid` | Preset only. Raw-liquid escape hatch. | keep | n/a |
| `sections/divider.liquid` | Preset only. Standalone divider. | review | low |
| `sections/collection-links.liquid` | Preset only. Demo collection grid. | review | low |
| `sections/collection-list.liquid` | Preset only. Redundant with product-list / editorial-collection-grid. | review | low |
| `sections/carousel.liquid` | Preset only. Generic. | review | medium |
| `sections/slideshow.liquid` | Preset only. Generic. | review | medium |
| `sections/featured-blog-posts.liquid` | Preset only. Requires merchant blog. | review | low |
| `sections/featured-product.liquid` | Preset only. Standalone showcase. | review | medium |
| `sections/featured-product-information.liquid` | Preset only. Info-side. | review | medium |
| `sections/media-with-content.liquid` | Preset only. Common merchant affordance. | keep | low |
| `sections/logo.liquid` | Referenced indirectly via `templates/password.json` block. | keep | low |
| `sections/_blocks.liquid` | Underscore; functionally identical to `sections/section.liquid` (both use same `{% capture children %}{% content_for 'blocks' %}…`). | review — verify upstream before delete | low |
| `sections/hero.liquid`, `product-list.liquid`, `product-information.liquid`, `product-recommendations.liquid`, all `main-*.liquid` | In templates | keep | n/a |
| `sections/search-header.liquid`, `search-results.liquid`, `predictive-search.liquid`, `predictive-search-empty.liquid`, `section-rendering-product-card.liquid` | Template or JS-fetched | keep | n/a |
| `sections/password.liquid`, `password-footer.liquid`, `footer.liquid`, `footer-utilities.liquid`, `header.liquid`, `header-announcements.liquid`, `section.liquid` | Active | keep | n/a |

### 3.2 Blocks

| File | Evidence | Action | Merge risk |
|---|---|---|---|
| `blocks/comparison-slider.liquid` | Preset in `sections/section.liquid:1713`; no template. Own JS. | review | low |
| `blocks/follow-on-shop.liquid` | No template; Shopify "Follow on Shop" CTA. | review | medium |
| `blocks/review.liquid` | No template; placeholder for review-app integration. | review | low |
| `blocks/featured-collection.liquid` | No template; overlaps collection-list. | review | low |
| `blocks/product-custom-property.liquid` | No template; metafield display. F4 size-guide may subsume. | review | low |
| `blocks/product-inventory.liquid` | No template; stock badge. Common. | keep | low |
| `blocks/popup-link.liquid` | No template; modal-trigger link. | review | low |
| `blocks/accordion.liquid` | No template; FAQ pattern. Common. | keep | low |
| `blocks/spacer.liquid` | No template; layout spacer. Common. | keep | low |
| `blocks/sku.liquid` | No template, but `render 'sku'` from PDP snippets. | keep | low |
| `blocks/email-signup.liquid`, `jumbo-text.liquid`, `accelerated-checkout.liquid`, `buy-buttons.liquid`, `variant-picker.liquid`, `quantity.liquid`, `add-to-cart.liquid`, `price.liquid`, `product-title.liquid`, `filters.liquid`, `swatches.liquid`, `contact-form*.liquid` | Active | keep | n/a |

### 3.3 Snippets

Systematic `render '<name>'` scan found **zero obviously-dead snippets**. Spot checks:
- `blog-comment-form` used by `sections/main-blog-post.liquid`.
- `editorial-{blog,collection,product}-grid` by `snippets/resource-list.liquid:133–137`.
- `bento-grid` by `resource-list.liquid:119`.
- `gift-card-recipient-form` by `blocks/buy-buttons.liquid:66`.
- `theme-editor` by `layout/theme.liquid:35` and `layout/password.liquid:34`.
- All `util-*` snippets have ≥1 caller.
- `strikethrough-variant` by `snippets/variant-swatches.liquid:159`.
- `link-featured-image` by `mega-menu-list.liquid` and `header-drawer.liquid` (5 sites).

No snippet is a delete-candidate.

---

## Section 4 — Other findings

- **Inline `<script>` in `layout/theme.liquid` (47–113, 275–298)** — two IIFEs that measure header dimensions and set `--header-height`, `--header-group-height`, `--top-row-height`, `--transparent-header-offset-boolean` on `document.body.style`, plus a `Theme = { translations, routes, template }` global. The first runs synchronously to prevent CLS. Any fancyfy section depending on `--header-*` inherits this render-blocking couple. Canonical provenance of those pseudo-tokens (§1.2).

- **Horizon already ships `assets/sticky-add-to-cart.js`** (loaded by `snippets/scripts.liquid:260`) and `fly-to-cart.js` (lines 28, 255). **F2's planned fancyfy sticky-ATC may be duplicating existing Horizon work** — confirm whether extending Horizon's component beats green-field before implementing.

- **`snippets/scripts.liquid` eagerly loads 40+ `<script type="module">` tags on every page**, gated only by a `collection`/`search` guard (67–84) and a `product` guard (253–268). Non-product pages still request `variant-picker.js`, `product-form.js`, `product-price.js`, `product-inventory.js`, `volume-pricing.js`, etc. Relevant for F6 performance audit.

- **Inconsistent `--animation-*` naming.** `--animation-slideshow-easing` (single-dash) versus `--font-size--sm` (double-dash) versus `--slideshow-controls-size` (prefix-only). Stylelint patterns in ADR-003 §7 permit both. ADR-010 may want to pin a convention per category.

- **Per-scheme-computed opacity tokens** `--opacity-5-15`, `--opacity-10-25`, `--opacity-35-55`, `--opacity-40-60`, `--opacity-30-60` at `color-schemes.liquid:9–19` depend on scheme background brightness. Several globals silently consume them (`--checkbox-border` at `theme-styles-variables.liquid:577`, `--pills-pill-background-color` at `base.css:3374`). A fancyfy section using a checkbox or pill outside a scheme wrapper gets invalid CSS. **Document as "hidden scheme dependency."**

- **`config/settings_data.json` has `"content_for_index": []`** (line 80) — Horizon-2.0 legacy; real homepage is `templates/index.json`. Non-issue but may confuse contributors.

- **`sections/_blocks.liquid` and `sections/section.liquid` appear functionally identical** — both use `{% capture children %}{% content_for 'blocks' %}{% endcapture %}{% render 'section', section: section, children: children %}` with near-identical schemas. Possible Shopify refactor artifact; worth upstream confirmation before F6 cleanup.

- **ADR-010 §2.2 token-name inversion** (`--color-variant-selected-*` vs actual `--color-selected-variant-*`) is the **single highest-priority fix**. A literal contract validation script run against ADR-010's current list would fail on 6 tokens, all declared in `snippets/color-schemes.liquid:66–71`, all with inverted word order.

---

## Summary

1. **ADR-010 has a token-name bug** — six "variant-selected" tokens are named backwards. Blocks F0 validator.
2. **~30 runtime-emitted typography tokens** (`--font-size--paragraph`, every `--font-<preset>--*`) aren't findable by static CSS scanning. The validator needs a whitelist or a Liquid-render pass.
3. **Price rendering is already well-centralized.** F2 patch manifest = ~13 files, 5 central snippet patches cover ~85%. Less sprawl than feared.
4. **Horizon already ships sticky-ATC and fly-to-cart.** F2 sticky-ATC may be redundant — re-evaluate.
5. **"Pseudo-tokens" (`--header-height`, etc.) are JS-set on `body`**, not CSS-declared. ADR-010 needs a new category for this.
6. **`sections/_blocks.liquid`** looks duplicate of `sections/section.liquid`.
7. **Cleanup is conservative** — most flagged sections are `review`, not `delete-candidate`, because "unused in templates" ≠ "inaccessible to merchants".
