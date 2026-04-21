# ADR-006 — Performance budget & advanced web APIs

- **Status**: Accepted
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F0 (budgets & guardrails); individual APIs applied per section as justified
- **Related**: ADR-002 (section convention), ADR-004 (tooling), ADR-007 (telemetry)

## Context

Miguel listed several modern web platform features as first-class interests:

- Speculation Rules API (prefetch / prerender)
- `Scheduler.yield()`
- Shared Brotli dictionaries
- `blocking="render"`
- `content-visibility: auto`
- View Transitions API
- Element Timing API

With an explicit constraint: **"solo cuando aplique, no agreguemos complejidad cuando no sea necesario."**

We need a framework that tells a section author, for each API, when it earns its place and when it doesn't — plus measurable budgets so "good enough" has a number.

## Decision

### 1. Performance budgets (per section)

Each fancyfy section, measured on the showcase store on a mid-tier mobile (Moto G Power class, 4G throttled), must respect:

| Metric | Budget |
|---|---|
| JS bundle (gzipped) | ≤ 15 KB typical, ≤ 30 KB for complex (e.g., megamenu, store-locator) |
| CSS bundle (gzipped) | ≤ 10 KB typical, ≤ 20 KB for complex |
| Number of asset requests added | ≤ 2 (one JS, one CSS) |
| Main-thread blocking time contributed | ≤ 30 ms |
| LCP regression vs. baseline | ≤ +100 ms |
| CLS contribution | 0 |

Budgets are **section-level**, not page-level. Page-level CWV budgets:

| Metric | Target |
|---|---|
| LCP | < 2.5 s (good) |
| INP | < 200 ms (good) |
| CLS | < 0.1 (good) |
| TTFB | < 800 ms (theme-level; mostly Shopify's responsibility) |

Violating budgets blocks section release. Measured by a Lighthouse run against the showcase + a lightweight bundle-size check in CI.

### 2. API application guidelines (the "when to use") 

For each platform feature, we define the **default** and the **trigger** that changes the default.

#### `blocking="render"` on stylesheets

- **Default**: OFF.
- **Use on**: the DS critical stylesheet link (`fcy-ds.css`) in `layout/theme.liquid`. Prevents FOUC of un-themed content.
- **Do NOT use on**: section-level CSS. Section CSS loads async; sections must style-up gracefully or be hidden until CSS applies via their own mechanism (usually the WC doesn't render children until connected).

#### `content-visibility: auto`

- **Default**: OFF.
- **Use on**: top-level containers of sections that are reliably below the fold on most pages (e.g., a "related products" section near the footer). Pair with `contain-intrinsic-size` to avoid CLS surprises.
- **Do NOT use on**: header, hero, anything above the fold; anything with user-driven height that can't estimate `contain-intrinsic-size`.
- **Gate**: the section author proves LCP/INP improvement on the showcase before flipping it on.

#### `Scheduler.yield()`

- **Default**: OFF.
- **Use inside**: WC initialization or event handlers that do continuous work > 50ms (measured with `performance.measure`). Yield between discrete chunks.
- **Do NOT use for**: short sync code (< 10ms); network-bound work (already async).
- **Fallback**: detect `'scheduler' in window && 'yield' in window.scheduler`; otherwise use `await new Promise(r => setTimeout(r, 0))` as a graceful degradation.

#### Speculation Rules API — Prefetch

- **Default**: ON, conservative.
- **Ship**: a snippet `snippets/fcy-speculation-rules.liquid` rendered in `layout/theme.liquid` that injects rules such as:
  - Prefetch product URLs on `hover` (mouseenter) from product cards and megamenu links.
- **Budget**: at most ~5 prefetches eagerly, rest only on hover/interaction.

#### Speculation Rules API — Prerender

- **Default**: OFF.
- **Use on**: explicit, merchant-configurable cases only. Examples:
  - Prerender checkout from cart when the merchant opts in (risk: form state, analytics double-fire).
  - Prerender PDP from a primary CTA on the homepage if the merchant knows 60%+ of clicks go there.
- **Rule**: prerender is never added to a section's defaults without a setting to disable it and a documented rationale.

#### View Transitions API

- **Default**: OFF.
- **Use on**: cross-document navigations **only** where the two pages share a clear hero/anchor element (e.g., collection → PDP product image). Requires opt-in per template.
- **Gate**: the implementor demonstrates a jank-free transition on iOS Safari and a mid-tier Android before shipping. Browser support fallback is "no transition" — acceptable.

#### Element Timing API

- **Default**: ON, applied to the hero image slot via `elementtiming="hero-image"` across templates.
- **Consumer**: the dev telemetry (ADR-007) reads these entries in dev builds to validate LCP element consistency. Not shipped as runtime behavior to merchants.

#### Shared Brotli dictionary

- **Default**: OFF. Not applied.
- **Reasoning**: Shopify's CDN serves Brotli-compressed assets already. Shared dictionaries require coordination between CDN and origin that we do not control; the potential win is small for our asset profile. Revisit in Phase 6+ if bundle sizes grow.

#### Long Animation Frames API (LoAF)

- **Default**: ON in dev builds, OFF in prod builds.
- **Use**: the dev telemetry subscribes to LoAF entries and logs them; we use them to find INP regressions during development. Prod builds strip the subscription to save bytes (ADR-007).

### 3. Guardrails — what NOT to do

- Do not add `content-visibility: auto` to a section just because it's below the fold on a single page. Different templates place sections differently; the rule is per placement, which the merchant controls.
- Do not add Speculation Rules Prerender without a setting switch. Prerender fires analytics and can run client scripts.
- Do not use `Scheduler.yield` to "chunk" work that wasn't actually slow. Premature yielding increases latency on fast devices.
- Do not chase Web Vitals on a section that doesn't affect them. A footer newsletter block gets no Element Timing attribute.

### 4. Measurement

- **CI check** (Phase 1+): per-PR, run a script that measures compressed size of all `fcy-*.js` and `fcy-*.css`. Fails if > budget.
- **Lighthouse** (manual in F0, automated in F1): run against `/`, `/collections/all`, and one product page on the showcase. Post results as a PR comment.
- **Real-user telemetry**: explicitly NOT collected by fancyfy in production (ADR-007). Clients who want it add their own GA4/ Segment integration.

### 5. Section author responsibilities

When proposing a section, the author must, in the section PR description, answer:

- Budget numbers (measured, not estimated).
- Which advanced APIs the section uses and why.
- LCP / CLS / INP contribution on the showcase.

PRs without these numbers are not reviewed.

## Consequences

**Positive:**

- Each advanced API has a clear "why would I use this?" test. No cargo-culting.
- Budgets make performance a release criterion, not an afterthought.
- Consistent Element Timing attributes enable dev-side LCP diagnostics across templates.
- Explicit opt-out for aggressive features (prerender) keeps us from shipping risky defaults.

**Negative / accepted costs:**

- CI setup for bundle-size + Lighthouse is not free; deferred to F0 end or F1.
- Section authors learn one more checklist item (perf section in PR template). We accept the friction.
- Some fashionable APIs (Shared Brotli, View Transitions by default) are held back; we accept appearing conservative for the sake of correctness.

## Alternatives considered

- **Apply all APIs by default, opt out per section.** Rejected: "only when it pays off" requires the default to be OFF; opt-in ensures each use is deliberate.
- **No per-section budgets, only page-level CWV.** Rejected: a 50KB section can pass page CWV if the page was fast to begin with, but compounds badly across sections. Per-section budgets prevent death-by-a-thousand-cuts.
- **Ship real-user telemetry from fancyfy to a fancylab endpoint.** Rejected: privacy/compliance surface area on clients' stores; adds bytes; not wanted (ADR-007 confirms).
