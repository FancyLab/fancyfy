# ADR-009 — Hidden prices by customer tag

- **Status**: Accepted
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F2
- **Related**: ADR-001 (territory), ADR-002 (section convention)

## Context

Some client storefronts need to hide prices for specific customer segments — e.g., B2B customers must see a "Contact for pricing" message instead of retail prices, while regular retail customers see normal prices. The rule must be:

- **Tag-driven**: the segment is determined by a customer tag (default `B2B`, configurable per store).
- **Configurable mode**: the merchant chooses what to display in place of the price (blank, custom message, login CTA).
- **Comprehensive**: applies to every price surface — PDP price, product cards, collection filters, search results, cart/drawer totals, related-products sections.
- **Safe fallback**: logged-out customers see prices as normal (unless `login-required` mode is explicitly enabled).

This is the **one ADR that deliberately patches Horizon territory files** (violating the default rule from ADR-001). We document exactly what we patch, how, and why the trade-off is justified.

## Decision

### 1. Settings (under `Fancyfy — Platform` group)

| Setting key | Type | Default | Purpose |
|---|---|---|---|
| `fancyfy_hide_prices_enabled` | checkbox | `false` | Master switch |
| `fancyfy_hide_prices_tag` | text | `B2B` | Customer tag to match (case-insensitive, comma-separated list allowed) |
| `fancyfy_hide_prices_mode` | select: `message` / `blank` / `login-required` | `message` | What to render in place of a price |
| `fancyfy_hide_prices_message` | text | `Contact us for pricing` | Used when `mode=message` |
| `fancyfy_hide_prices_login_text` | text | `Log in to see prices` | Used when `mode=login-required` (shown to anonymous visitors too) |
| `fancyfy_hide_prices_login_url` | url | `/account/login` | Target for the login CTA |
| `fancyfy_hide_prices_hide_filters` | checkbox | `true` | Hide price filter + sort-by-price when hiding is active for the visitor |
| `fancyfy_hide_prices_hide_cart_totals` | checkbox | `true` | Hide subtotal/total in cart + drawer for tagged customers (they see a "Contact us" message instead of paying online) |

### 2. Visibility logic (central assign)

A snippet `snippets/fcy-price-visibility.liquid` computes a single boolean `fcy_hide_prices` available downstream in the request:

```liquid
{%- comment -%} snippets/fcy-price-visibility.liquid {%- endcomment -%}
{%- assign fcy_hide_prices = false -%}
{%- if settings.fancyfy_hide_prices_enabled -%}
  {%- assign _tags = settings.fancyfy_hide_prices_tag | downcase | split: ',' -%}
  {%- if settings.fancyfy_hide_prices_mode == 'login-required' and customer == blank -%}
    {%- assign fcy_hide_prices = true -%}
  {%- elsif customer != blank -%}
    {%- for _tag in _tags -%}
      {%- assign _clean = _tag | strip -%}
      {%- if customer.tags contains _clean -%}
        {%- assign fcy_hide_prices = true -%}
        {%- break -%}
      {%- endif -%}
    {%- endfor -%}
  {%- endif -%}
{%- endif -%}
```

Rendered once in `layout/theme.liquid` (single Horizon patch point, §4.1) so every template/section sees the same flag.

### 3. Price wrapper snippet

`snippets/fcy-price.liquid` is the single place that decides to render a price or its replacement:

```liquid
{%- comment -%}
Usage: {%- render 'fcy-price', price: variant.price, compare_at: variant.compare_at_price, variant: variant -%}
{%- endcomment -%}
{%- if fcy_hide_prices -%}
  {%- case settings.fancyfy_hide_prices_mode -%}
    {%- when 'blank' -%}
      <span class="fcy-price fcy-price--hidden" aria-hidden="true"></span>
    {%- when 'login-required' -%}
      <a class="fcy-price fcy-price--locked" href="{{ settings.fancyfy_hide_prices_login_url }}">
        {{- settings.fancyfy_hide_prices_login_text -}}
      </a>
    {%- else -%}
      <span class="fcy-price fcy-price--locked">{{- settings.fancyfy_hide_prices_message -}}</span>
  {%- endcase -%}
{%- else -%}
  {%- render 'fcy-price-display', price: price, compare_at: compare_at, variant: variant -%}
{%- endif -%}
```

`fcy-price-display.liquid` contains the normal price rendering (currency, compare-at strikethrough, unit price) delegated from our wrapper so Horizon's specific price formatting can be adopted or replaced per patch point.

### 4. Horizon patch points (the documented exceptions to ADR-001)

We patch Horizon files minimally, replacing the inline price rendering with `{% render 'fcy-price', ... %}`. Each patch is:

1. Replacing a Horizon include/render call or an inline price expression with our wrapper.
2. Recorded here when implementation lands (F2) with: file path, line range pre-patch, minimal diff.
3. Revisited on every Horizon merge (ADR-001 runbook, §4.4 addendum): if Horizon moves the price logic, we re-apply the wrapper.

The audit **will identify** these patch points at F2 implementation; expected surfaces:

- `layout/theme.liquid` — include visibility snippet once (§4.1, unavoidable).
- Product page price block (likely `blocks/*price*.liquid` or `sections/main-product.liquid` — Horizon specific).
- Product card block (Horizon's product-card snippet).
- Collection filters: price range filter + sort-by-price option.
- Search results price rendering.
- Cart line items + totals.
- Cart drawer / sidecart.
- Related products section price rendering.
- Newsletter/upsell blocks that reference price.

Each patch must be minimal (single-line `{% render %}` call) and must preserve the Horizon surrounding logic (loading states, A11y attributes, microdata).

A companion doc `docs/horizon-patches.md` tracks the live list of patches with diffs, updated on every merge.

### 5. Filter visibility

When `fancyfy_hide_prices_hide_filters = true` and `fcy_hide_prices = true` for the current visitor:

- Collection price filter is not rendered (patch in collection template).
- Sort options menu omits `price-ascending` / `price-descending`.
- Search results sort menu omits the same.

### 6. Cart & checkout behavior

When `fcy_hide_prices = true`:

- Cart page: line item prices, subtotal, total are replaced with the hide-mode copy.
- Cart drawer (sidecart): same treatment.
- Checkout button: hidden, replaced with a "Contact us" CTA (configurable URL, defaults to `/pages/contact`).

**Checkout page itself is outside the theme.** Shopify checkout runs in its own context; we cannot fully prevent a tagged customer from reaching checkout by manipulating URLs. We mitigate via:

- The theme does not expose "add to cart" for tagged customers when `fancyfy_hide_prices_hide_cart_totals = true` (PDP ATC is replaced with the Contact CTA).
- For stores needing hard enforcement, the merchant is directed to configure a **Shopify Function (Cart and Checkout Validation)** outside fancyfy — documented in the section README, not implemented by fancyfy directly.

### 7. Accessibility & copy

- Replacement messages are always real, localizable text — not images, not ARIA-hidden-only content.
- Locked price elements carry `aria-label` duplicating the visible text (for assistive tech).
- Login CTA is a real anchor, focusable, keyboard operable.
- Translations: the settings are plain text; clients can set per-locale values via Shopify's translations workflow.

### 8. Testing

- Unit: `fcy-price-visibility.liquid` logic tested with a Playwright matrix on the showcase: anonymous visitor, logged-in untagged, logged-in B2B (configured).
- Visual: each patch point captured in showcase screenshots pre/post hide.
- Regression: the patch list (`docs/horizon-patches.md`) is reviewed on every Horizon merge.

## Consequences

**Positive:**

- One setting group, one snippet, predictable behavior across every price surface.
- Clear list of Horizon files we modify — no hidden coupling.
- Clean fallback for anonymous visitors; configurable to block them too.
- Works across theme and cart/drawer without custom code in every section.

**Negative / accepted costs:**

- **Violates the strict ADR-001 default of "no Horizon edits."** We accept the exception because the feature is inherently cross-cutting (every price surface) and wrapping them is the only clean way. The exception is contained to this ADR and the patch list.
- Horizon upstream changes to price rendering can invalidate a patch; the merge runbook includes a step to re-verify patches (ADR-001 §4.4 amendment).
- True enforcement at checkout is out of scope — documented, not silent.
- Translation of replacement copy requires merchant action per locale.

## Alternatives considered

- **JavaScript-only hiding (remove prices on the client after render).** Rejected: flashes prices on initial paint; SEO/LLM crawlers see prices; users with JS disabled see prices.
- **Patch only the PDP and product card, ignore filters/cart.** Rejected: leaks prices via filter labels and cart totals — defeats the feature.
- **Fork the entire Horizon price surface into fancyfy.** Rejected: massively increases merge conflict surface; not proportional to benefit.
- **Use Shopify's B2B catalog (Companies) feature instead of theme-level hiding.** Reasonable for true B2B, but not applicable to stores that want this without Shopify Plus Companies. Documented as a recommendation for Plus merchants in the section README; the fancyfy theme feature stays available for the non-Plus majority.
