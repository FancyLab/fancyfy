# fancyfy — Roadmap & Phase Plan

**Last updated**: 2026-04-21
**Horizon tracked**: v3.4.0

This roadmap sequences fancyfy work by phases. Each phase has **deliverables** (what ships), **acceptance criteria** (how we know it's done), and **ADR coverage** (which architectural decisions land in this phase).

Phases are ordered by dependency, not calendar. No dates — they depend on team capacity.

---

## F0 — Fundaciones

> Build the platform. Ship zero premium sections.

The goal of F0 is to reach a state where adding a new section is a mechanical exercise (follow the template, run the build, register in showcase). F0 validates the whole stack without committing to any section implementation.

**Deliverables:**

- `package.json`, `tsconfig.json`, `vite.config.ts`, lint configs
- `fancyfy/cli/vite-plugin.ts` — section discovery, emission, schema injection
- `fancyfy/ds/` skeleton with `tokens.config.ts`, `main.scss`, generated outputs
- `snippets/fcy-tokens.liquid` runtime bridge (DS settings → CSS custom properties)
- `fancyfy/shared/logger.ts` + `fancyfy/cli/log-collector.ts`
- `fancyfy/shared/FcyElement` — base web component class
- `fancyfy/sections/_template/` — generator input for new sections
- `fancyfy/cli/new-section.ts` — scaffolder
- `snippets/fcy-editor-badge.liquid` — HORIZON/FANCYFY visual label
- Showcase dev store created; first deploy from this repo
- CI skeleton (`.github/workflows/ci.yml`): typecheck + lint
- Onboarding doc for agency devs (`docs/contributing.md`)
- `fancyfy/HORIZON_VERSION` + `fancyfy/VERSION`
- `.gitignore` additions (`.fancyfy-logs/`, `fancyfy/ds/generated/`, `.build-manifest.json`)

**ADRs landed**: ADR-001, ADR-002, ADR-003, ADR-004, ADR-006, ADR-007.

**Acceptance criteria:**

- `npm run dev` watches and emits; `npm run dev:shopify` serves the dev store.
- Merchant changes `Fancyfy — Design System` brand color in editor → showcase reflects it within seconds (no rebuild needed).
- Running `npm run new:section demo` scaffolds a valid section folder that builds and deploys.
- The scaffolded demo section renders with DS tokens, a WC, and appears with a `FANCYFY` badge in editor.
- `npm run check` passes on CI.

**Exit signal:** ready to build Megamenu without arguing about conventions.

---

## F1 — Megamenu end-to-end

> Validate the platform with the hardest section first.

**Deliverables:**

- `fancyfy/sections/megamenu/` with all files from ADR-002 layout
- Desktop modes covering the 10 reference images in `images/megamenu_*.png`:
  - Panel widths: contained, full-width
  - Column counts: 2–6
  - Block types: `fcy-megamenu-column`, `fcy-megamenu-promo`, `fcy-megamenu-image-card`, `fcy-megamenu-collection-list`
  - Active top-level highlight
- Mobile mode: simple accordion, no images (per decision 2026-04-21)
- Keyboard navigation and full A11y (ARIA patterns for menubar/menu)
- Showcase entry + variants demonstrating each reference image
- First cherry-pick rehearsed to a test client theme with the `manifest.json` contract validated manually
- ADR-005 (distribution) finalized with Megamenu as the first concrete manifest example

**Signals from Horizon audit (2026-04-21):**

- `--menu-font-{sm,md,lg,xl,2xl}--size/--line-height` already exist globally — megamenu SHOULD consume these to feel native.
- `--submenu-animation-speed` and `--submenu-animation-easing` exist — use them to match Horizon header animation.
- `--hover-lift-amount`, `--hover-transition-duration/timing` — reuse on interactive items.

**ADRs landed**: ADR-005.

**Acceptance criteria:**

- Megamenu passes performance budgets from ADR-006 (≤ 30 KB JS gz, ≤ 20 KB CSS gz, LCP +0).
- All 10 reference images are reproducible via settings alone (no code changes).
- Keyboard navigation passes axe-core audit.
- Cherry-pick to a blank Horizon theme works following only the README.

**Exit signal:** the megamenu ships in the showcase and is installable on a client.

---

## F2 — Hidden prices + Sticky ATC (reuse Horizon component)

> A horizontal feature (touches many surfaces) and a settings layer over Horizon's existing sticky-ATC.

**Deliverables:**

- `snippets/fcy-price-visibility.liquid`, `snippets/fcy-price.liquid`, `snippets/fcy-price-display.liquid`
- Horizon patch list already stubbed in `docs/horizon-patches.md` (P1–P15 from audit). F2 kickoff = promote `planned` → `live` entry by entry.
- Settings group `Fancyfy — Platform` with hide-prices controls
- Showcase: one demo B2B customer, documented in `docs/showcase-fixtures.md`
- **Sticky-ATC: reuse Horizon's `assets/sticky-add-to-cart.js`** (decided 2026-04-21). Scope reduces to:
  - Read Horizon's existing settings for sticky-ATC.
  - Add any fancyfy-specific settings we need as a thin augmentation (if necessary) under `Fancyfy — PDP` group.
  - Document the reuse path in a new short doc `docs/sticky-atc-reuse.md` rather than creating `fancyfy/sections/sticky-atc/`.
  - If Horizon's behavior is insufficient for an actual client, revisit — but default position is "use what's there".

**Signals from Horizon audit (2026-04-21):**

- Price-rendering surface is more centralized than feared: **5 central snippet patches cover ~85%** (P1–P6 in `docs/horizon-patches.md`).
- Any PDP enhancement that needs header offset: read `--header-height` (body-runtime, set by Horizon's inline JS).

**ADRs landed**: ADR-009.

**Acceptance criteria:**

- Anonymous visitor sees normal prices; B2B-tagged visitor sees the configured replacement on PDP, cards, cart, drawer, search, filters.
- Turning `fancyfy_hide_prices_enabled` off removes all replacements with a page reload.
- Horizon merge dry-run (simulated upstream release) preserves the patches or flags conflicts visibly.
- Sticky ATC appears on scroll past the product gallery; disappears when checkout button is visible.
- CWV regression on PDP: none.

**Exit signal:** hidden-prices flow works end-to-end on a realistic B2B scenario.

---

## F3 — Cart modules

> Upsell, cross-sell, down-sell, rewards bar inside cart + side-cart.

**Deliverables:**

- `fancyfy/sections/cart-upsell/` — merchant-configured upsell rules
- `fancyfy/sections/cart-crosssell/` — rules: "in cart if X, show Y"
- `fancyfy/sections/cart-downsell/` — alternate when cart total below threshold
- `fancyfy/sections/cart-rewards-bar/` — progress bar to next reward (free shipping, gift)
- All four work in cart page + cart drawer, with a shared block authoring system
- Each section with its own manifest, semver, README

**ADRs landed**: none new; these sections apply ADR-002 and ADR-003.

**Acceptance criteria:**

- Merchant can configure upsell rules without developer help.
- Rewards bar computes thresholds in merchant's currency correctly across multi-currency markets.
- Cart drawer and cart page share identical block authoring.
- Performance budgets respected.

**Exit signal:** a client with upsell/rewards need can ship without custom code.

---

## F4 — Size guide + Shoppable image with pins

> Two content-heavy sections.

**Deliverables:**

- `fancyfy/sections/size-guide/` — modal-triggered guide with merchant-editable tables and rich text per block
- `fancyfy/sections/shoppable-image/` — desktop + responsive image with pin overlays
  - Each pin: position (%), product handle, popup preview (image + title + price + "View product" link)
  - Mobile fallback: below the image, a list of pinned products
- Showcase demos for both

**ADRs landed**: none new.

**Acceptance criteria:**

- Pin positions are editable in the theme editor with a preview.
- Size guide accessible (focus trap in modal, ESC to close, ARIA labelled).
- Shoppable image LCP impact within budget.

**Exit signal:** both sections live in showcase and documented for cherry-pick.

---

## F5 — Store locator

> First section with a non-trivial external integration (mapping library).

**Deliverables:**

- `fancyfy/sections/store-locator/` — MapLibre-based map with markers
- Metaobject-driven location data (address, coordinates, hours, image)
- Customizable marker (icon per merchant)
- Search + filter (by city, by service)
- Directions link (opens native maps)
- `LocalBusiness` JSON-LD per location (plugs into ADR-008)
- Fallback: if user blocks geolocation, default to first marker

**ADRs landed**: none new; this section justifies the LocalBusiness row of ADR-008.

**Acceptance criteria:**

- Map loads with ≤ 60 KB JS gz at first paint (MapLibre lazy-loaded on interaction).
- Marker customization visible in theme editor.
- JSON-LD validates against Google Rich Results.
- Keyboard navigation for marker list.

**Exit signal:** store locator live in showcase with ≥ 5 demo locations.

---

## F6 — Complete schema.org + Horizon cleanup + performance audit

> Maturity pass.

**Deliverables:**

- Full schema.org coverage per ADR-008 matrix
- Horizon JSON-LD audit documented; `settings.fancyfy_seo_replace_horizon_ld` set per type
- Horizon cleanup: work from the pre-filtered list in `docs/horizon-audit.md` §3 — each `review` entry gets a decision (`keep` / `delete`) with merge-cost analysis recorded.
- Performance audit against the full showcase: Lighthouse CI integration in GitHub Actions
- `snippets/scripts.liquid` review (audit §4: 40+ modules loaded per page — candidates for lazy loading)
- Speculation Rules prefetch snippet reviewed and tuned
- Long Animation Frames dashboards in dev telemetry
- `docs/performance-report.md` — baseline and targets per template

**Signals from Horizon audit (2026-04-21):**

- **No snippet is obviously dead** — cleanup targets concentrate in sections and blocks (see audit §3).
- **`sections/_blocks.liquid` appears functionally identical to `sections/section.liquid`** — verify with Shopify upstream before deleting. Possible refactor artifact.
- **Scope-hidden dependencies** (`--checkbox-border` references scheme-only `--opacity-35-55`) — audit flagged; F6 can either fix or document as a "don't use outside a scheme wrapper" rule.

**ADRs landed**: ADR-008.

**Acceptance criteria:**

- Every template on showcase passes Rich Results validation.
- No duplicate JSON-LD blocks.
- All sections stay within ADR-006 budgets.
- Horizon cleanup documented with merge-cost analysis for each removal.

**Exit signal:** fancyfy 1.0 candidate.

---

## Backlog (unscheduled)

Items captured but not assigned to a phase:

- `fancyfy/cli/fancyfy-add` — CLI for automated cherry-pick (Phase 2+, after manual workflow is proven)
- Dark mode — only if a client explicitly requests and funds it; requires new ADR
- Figma token sync — replace `tokens.config.ts` editing with a pipeline; only if it saves more time than it costs
- View Transitions MPA integration in common navigation paths — if Shopify's caching improves
- Offline-first cart — requires service worker, out of current scope
- A11y automated audit in CI — axe-core runs per showcase page

---

## Change log

| Date | Change |
|---|---|
| 2026-04-21 | Initial roadmap. ADRs 001–009 drafted; F0 approved to start. Dark mode removed from F0/F1 scope. Horizon cleanup moved to F6. |
| 2026-04-21 | ADR-003 revised to "DS extender" model; ADR-010 added (Horizon DS contract). |
| 2026-04-21 | F0 implementation landed: tooling, DS, logger, shared TS, CLI scaffolding, section template, `layout/theme.liquid` patches (structural). |
| 2026-04-21 | Horizon audit completed (`docs/horizon-audit.md`). Updates: tokens.ts reorganized into 6 provenances; 6 variant-selected token names corrected; ~30 missing tokens added; `docs/horizon-patches.md` stubbed with F2 patch list. F1 and F2 notes added for tokens/sticky-ATC reuse. F6 cleanup pre-filtered from audit §3. |
