# Horizon patches registry

**Companion document to ADR-009.** Lives next to the ADR so the catalog of Horizon files fancyfy modifies is always one click away from the merge runbook (ADR-001 §4).

**Policy:**

- Every entry in this file corresponds to a **documented exception** to ADR-001's "Horizon territory is hands-off" default.
- A patch lands only with an ADR authorizing it (currently: ADR-009 hidden prices, plus the two structural patches listed under "Structural" below).
- Each entry records: file path, line anchor pre-patch, the fancyfy wrapper applied, and the reason the wrapper is safe.
- On every Horizon merge (ADR-001 §4.5), every entry is re-verified against the new file. Surrounding code moved? Re-apply. Abstraction changed? Update the entry or escalate.

**Legend:**

| Status | Meaning |
|---|---|
| `live` | Patch applied to the current fancyfy main. |
| `planned` | Approved by ADR, not yet implemented. |
| `deferred` | Approved, execution scheduled to a later phase. |

---

## Structural patches (F0)

These are documented in ADR-001 §2 as Exception B (`layout/theme.liquid`). Live since F0.

| # | File | Anchor | Patch | Status | Reason safe |
|---|---|---|---|---|---|
| S1 | `layout/theme.liquid` | After `{%- render 'color-schemes' -%}` (head) | `{%- render 'fcy-tokens' -%}` | live | Purely additive render call; does not modify any Horizon logic. Commented with `{%- comment -%} fancyfy — see ADR-001 §2 addendum {%- endcomment -%}` for merge-time discoverability. |
| S2 | `layout/theme.liquid` | Inside `{% if request.design_mode %}` block | `{%- render 'fcy-editor-badge' -%}` | live | Only renders in theme editor; zero storefront cost. Same comment marker. |

---

## ADR-009 price-hiding patches (F2)

Derived from the Horizon audit (`docs/horizon-audit.md` §2). Strategy per ADR-009 §4.

**Central patches** (6 snippets carry ~85% of the price-rendering surface):

| # | File | Anchor | Patch | Status |
|---|---|---|---|---|
| P1 | `snippets/price.liquid` | Top of file (before first money filter) | Gate on `fcy_hide_prices`; render `fcy-price` replacement when true | planned (F2) |
| P2 | `snippets/format-price.liquid` | Top of file (lines 20–22 core formatter) | Same gating pattern | planned (F2) |
| P3 | `snippets/unit-price.liquid` | Top of file | Same gating pattern | planned (F2) |
| P4 | `snippets/cart-products.liquid` | Line 81 subtotal; 266–294 unit-price wrapper; 357–372 line-total | Wrap each price region with the visibility check | planned (F2) |
| P5 | `snippets/cart-summary.liquid` | 12–20 subtotal; 226–253 totals container | Wrap; replace `#checkout` CTA with Contact CTA when hidden | planned (F2) |
| P6 | `snippets/volume-pricing-info.liquid` | Entire snippet output | Wrap whole output | planned (F2) |

**Selective patches** (complementary surfaces not covered by centrals):

| # | File | Anchor | Patch | Status |
|---|---|---|---|---|
| P7 | `blocks/buy-buttons.liquid` | 121–212 `<volume-pricing>` container | Wrap the entire volume-pricing block | planned (F2) |
| P8 | `blocks/price.liquid` | 70–82 installments div | Wrap installments (price itself is via P1) | planned (F2) |
| P9 | `blocks/_featured-product-price.liquid` | 5–14, 37–39 inline "From $X" | Wrap these specific lines (P1 covers line 40) | planned (F2) |
| P10 | `snippets/quantity-selector.liquid` | 116, 139, 152, 154 `data-variant-price` attributes + quantity-break JSON | Attribute-level: empty string or sentinel when `fcy_hide_prices` | planned (F2) |
| P11 | `snippets/meta-tags.liquid` | 77 `<meta property="product:price:amount">` | Omit the meta when hidden (avoid OG leak) | planned (F2) |
| P12 | `snippets/price-filter.liquid` | Top of file | `{% if fcy_hide_prices and settings.fancyfy_hide_prices_hide_filters %}{% return %}{% endif %}` | planned (F2) |
| P13 | `snippets/filter-remove-buttons.liquid` | 31–39 price branch | Wrap the price-type branch only | planned (F2) |
| P14 | `snippets/sorting.liquid` | Sort options loop | `{% continue %}` on `price-ascending` / `price-descending` | planned (F2) |
| P15 | `layout/theme.liquid` | Before the closing `</head>` tag (or at top of the hidden-prices dependency chain) | `{%- render 'fcy-price-visibility' -%}` to compute `fcy_hide_prices` once | planned (F2) |

**Out of scope (explicitly not patched):**

| File | Reason |
|---|---|
| `templates/gift_card.liquid:55,137` | Gift card balance — customer-owned value, not product price. |
| `snippets/tax-info.liquid` | No literal price; only tax copy. |
| Checkout pages | Not part of the theme. Merchants wanting hard enforcement use a Shopify Function (ADR-009 §6). |

---

## Merge-time verification

At every Horizon merge (ADR-001 §4.5), for each entry above:

1. Confirm the file still exists at the listed path.
2. Confirm the anchor lines still contain the structure the patch was applied to.
3. Re-apply the patch. If the anchor has moved, update the line numbers here.
4. If the surrounding abstraction has changed (e.g., `snippets/price.liquid` split into two snippets), escalate: the patch may need to be re-authored or the ADR extended.

A merge PR that fails any of these steps blocks until resolved.

---

## Change log

| Date | Event |
|---|---|
| 2026-04-21 | F0 landed S1, S2 (structural patches to `layout/theme.liquid`). |
| 2026-04-21 | P1–P15 enumerated from audit (§2 of `docs/horizon-audit.md`). Status: `planned` pending F2. |
