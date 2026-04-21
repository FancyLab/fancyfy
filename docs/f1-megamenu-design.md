# F1 Megamenu — design notes

Decisions taken during F1.0–F1.3 (2026-04-21). Intent: explain WHY the section is shaped the way it is, so a future maintainer (or me-three-months-from-now) understands the tradeoffs without re-litigating them.

## Scope recap

- Validates the fancyfy platform end-to-end (build pipeline, DS consumption, WC, logger, a11y).
- Desktop: multi-column flyout, 2–6 cols, contained or full-width.
- Mobile: simple accordion, **one open at a time, no images**.
- Integration: standalone section added to the `header-group` via theme editor. Coexists with Horizon's built-in `_header-menu` block.

## Key decisions

### 1. Standalone section in `header-group` (vs. extending Horizon's menu block)

Chose: standalone. `enabled_on: { groups: ['header'] }`.

Alternatives considered:
- Block inside Horizon's header — Horizon's `_header-menu` block already has a `menu_style: featured_products` with its own layout; forking it would be invasive and couple us to Horizon's internals.
- Replace Horizon's header — too invasive; merchants lose Horizon's features.

Consequence: two navigation surfaces can coexist (Horizon's + fancyfy's). Merchant can hide Horizon's `_header-menu` block if they only want ours. Documented in README.

### 2. Nested theme blocks (panel → column/promo/collection)

Chose: Shopify 2.0 nested blocks. Panel is the only root-allowed block; columns/promos/collections are children of panel.

Alternatives:
- **Flat handle-grouping** — all blocks at root, each tagged with `panel_handle`. Rejected: merchant UX is less intuitive, no visual nesting in editor.
- **Positional grouping** — `fcy-mm-panel-start` marker blocks. Rejected: too implicit.

Tech debt: if nested blocks' editor UX feels clunky for this use case, consider flattening in v0.2.0.

### 3. Panels rendered INSIDE their `<li>` (via `{% content_for 'block', id: ... %}`)

The section iterates the linklist's top-level links. For each link, it finds the matching panel by handle and renders ONLY that panel inside the link's `<li>`.

Why this vs. `{% content_for 'blocks' %}` at root and moving panels with JS:

- **Natural mobile accordion**: panels are already children of their top-level item; accordion is just CSS.
- **Server-rendered**: no JS required for the fundamental structure.
- **a11y**: `aria-controls` can point to a DOM id that actually lives in the parent item.

Downside: if a merchant adds a panel with a handle that doesn't match any top-level link, that panel never renders. Silent on storefront, visible in editor. Acceptable — merchant sees the block exists and can fix the handle.

### 4. Light DOM, no shadow DOM

Per ADR-003. Horizon's scheme tokens cascade naturally. Merchant brand edits propagate live without forwarding logic.

### 5. ARIA menubar pattern with `<button>` triggers

Triggers are `<button aria-haspopup="true" aria-expanded="false">`, not `<a>`. Panels are `role="menu"`, items are `role="menuitem"` or `role="none"` as appropriate.

Keyboard support:
- `ArrowLeft` / `ArrowRight` — move between top-levels.
- `ArrowDown` / `ArrowUp` — open panel, focus first / last item.
- `Home` / `End` — jump to first / last top-level.
- `Escape` — close all panels, focus the active trigger.
- `Tab` — linear through DOM; focus leaving a panel closes it (`focusout` handler).

**Known limitation (tech debt)**: no focus trap inside an open panel. WAI-ARIA menubar pattern does NOT require trap — Tab is expected to exit. Acceptable. If merchant feedback asks for a modal-style trap we revisit.

### 6. Progressive enhancement — top-levels without JS

A top-level item with a panel renders as `<button>`. Without JS, those buttons do nothing — the panel never opens.

Top-level items **without** a panel render as `<a href>` and work without JS.

**Known limitation (tech debt)**: merchants who have no-JS users will lose navigation into parent-category links. Acceptable for v0.1.0 because:
- The merchant can configure the top-level link in Shopify Navigation to point to the category index directly (Horizon's linklist supports this).
- If the `has-panel` branch also used `<a href>` on the button, we'd lose semantic clarity (buttons vs. links have different a11y expectations).

Alternative for v0.2.0: render `<a href aria-haspopup="true" aria-expanded="false">` with a JS interceptor that prevents default only when JS is ready. Adds complexity; defer.

### 7. Hover open with configurable delay

Desktop: hover opens with `section.settings.hover_delay_ms` (default 120ms). Prevents accidental opens when the cursor passes through the menubar.

Mouse-leave has a 120ms close delay so the cursor can travel from trigger to panel without the panel closing. Not configurable (hardcoded `MOUSE_LEAVE_CLOSE_MS` in `fcy-megamenu.ts`). If this needs tuning per-merchant we expose a setting.

Click-only mode (`open_on: 'click'`) skips hover entirely — useful for merchants who prefer deliberate interaction.

### 8. Mobile — accordion, no images

User decision 2026-04-21: "imágenes solo aportan valor en desktop". `fcy-mm-promo` and `fcy-mm-collection` blocks have `@include respond-below(md) { display: none; }`. Mobile only shows `fcy-mm-column` blocks.

Accordion behavior: tapping a top-level trigger toggles its panel. Multiple triggers can be open simultaneously (disclosure pattern, not strict accordion-radio). Simpler than enforcing one-at-a-time.

Tech debt: if merchants want strict accordion-radio on mobile, add a setting `mobile_behavior: disclosure | accordion`.

### 9. Menu-font and animation tokens (audit-informed)

- Top-level typography: `--menu-font-{sm,md,lg}--size` and matching `--line-height`. Merchant picks `sm`/`md`/`lg` via setting.
- Panel open/close: `--submenu-animation-speed` + `--submenu-animation-easing`.
- Hover lift on promos: `--hover-lift-amount` + `--hover-transition-duration` + `--hover-transition-timing`.

All from Horizon's existing DS per ADR-010. Zero fancyfy-exclusive tokens in v0.1.0.

### 10. Active state indicator

Merchant configurable: none / underline / color / both. Implemented via `[data-active-indicator]` on the custom element root. Active class comes from Shopify's `link.active` / `link.child_active`.

### 11. `color-scheme-N` wrapper (ADR-003 §2 Category B)

Section root has `color-{{ section.settings.color_scheme }}` class. All color tokens (`--color-foreground`, `--color-background`, `--color-primary`, etc.) resolve correctly via Horizon's scheme scoping.

## Tech debt ledger (v0.1.0 → v0.2.0+)

| # | Item | Trigger to address |
|---|---|---|
| 1 | Evaluate nested-block UX with real merchants; consider flat-handle model if clunky | After 2–3 client integrations. |
| 2 | No-JS fallback for panel triggers (use `<a>` with JS override) | If support tickets surface no-JS users. |
| 3 | Focus trap option inside open panels | Merchant request only. |
| 4 | Strict accordion-radio mode on mobile | Merchant request only. |
| 5 | Configurable mouse-leave close delay | If hover feels wrong in practice. |
| 6 | Focus management on mobile (scroll-into-view when panel opens below-fold) | After real-device testing. |
| 7 | Speculation Rules prefetch on top-level link hover | ADR-006: add when hover-prefetch shows LCP wins on showcase. |

## Accessibility targets

- axe-core: 0 violations on showcase.
- Keyboard: full operability without mouse.
- Screen reader: tested against VoiceOver (macOS) and NVDA (Windows) before F1 exit.

## Performance targets (ADR-006)

- JS gzip ≤ 30 KB (complex section budget).
- CSS gzip ≤ 20 KB.
- Menubar paints within 50ms of HTML parse (inline menubar is synchronous Horizon-level).
- Panel open animation: 60fps minimum on mid-tier Android.

Actual measurements to be captured in the F1 PR.
