# fcy-megamenu

Multi-column flyout navigation with nested blocks. Desktop grid panels, mobile accordion.

**Status:** F1 v0.1.0 — first fancyfy section. Validates the whole platform end-to-end.

## What it does

- Top-level items come from a Shopify linklist (Online Store → Navigation).
- Each top-level item can optionally have a panel defined via a `panel` block in this section.
- Panels accept nested blocks: `column`, `promo`, `collection`.
- Desktop: hover or click opens a multi-column panel (2–6 cols) below the trigger.
- Mobile: panels render as accordions below their top-level item; one open at a time.

## Block hierarchy

```
fcy-megamenu (section)
└── fcy-mm-panel (block)   ← one per top-level item, ties to menu_item_handle
    ├── fcy-mm-column       ← column heading + linklist
    ├── fcy-mm-promo        ← image + heading + CTA (optional column span)
    └── fcy-mm-collection   ← collection picker + product count
```

Top-level items without a matching panel block render as plain links (no dropdown).

## Settings (section level)

| Setting | Type | Default | Notes |
| --- | --- | --- | --- |
| `color_scheme` | `color_scheme` | `scheme-1` | Wrapper class. |
| `menu` | `link_list` | `main-menu` | The top-level menu. |
| `panel_width` | `select` | `contained` | Default; panels can override. |
| `open_on` | `select` | `hover` | `hover` or `click` on desktop. |
| `hover_delay_ms` | `range` | `120` | Prevents accidental open on cursor pass-through. |
| `top_level_font_size` | `select` | `md` | sm / md / lg — maps to `--menu-font-*--size`. |
| `top_level_case` | `select` | `uppercase` | CSS text-transform. |
| `top_level_letter_spacing` | `range` | `6` | em × 100. |
| `active_indicator` | `select` | `underline` | Active page/parent highlight. |

## Panel settings

| Setting | Default | Notes |
| --- | --- | --- |
| `menu_item_handle` | — | Must match a top-level link's handle (e.g., `skin-care`). |
| `layout` | `4` | Grid columns (2–6). |
| `panel_width` | `inherit` | Can override the section default. |

## Cherry-pick procedure

Per ADR-005. Before copying:

1. **Verify the target theme has fancyfy DS installed** (ADR-003):
   - `snippets/fcy-tokens.liquid` present.
   - DS CSS asset (`assets/fcy-ds-*.css`).
   - `layout/theme.liquid` renders `fcy-tokens` and `fcy-editor-badge`.
2. **Verify Horizon version** ≥ 3.4.0 (see manifest `horizon_min_version`).
3. **Verify contract tokens** — every entry in `tokens_required` exists in `fancyfy/ds/tokens.ts`. F1 uses these tokens; they are all in the F0 contract.

To install:

1. Copy files listed in `manifest.json#files`:
   - `sections/fcy-megamenu.liquid` (build output)
   - `blocks/fcy-mm-panel.liquid`, `blocks/fcy-mm-column.liquid`, `blocks/fcy-mm-promo.liquid`, `blocks/fcy-mm-collection.liquid` (build outputs)
   - `assets/fcy-megamenu.*.js`, `assets/fcy-megamenu.*.css` (build outputs — hashes will differ per build)
2. Commit:
   ```
   feat(sections): add fcy-megamenu@0.1.0 from fancyfy@0.1.0
   ```
3. In the client's theme editor, add the section to the header group, pick the menu, and configure panels per top-level item.
4. Record install in the agency's client ledger.

## Accessibility

- `<nav>` + `<ul role="menubar">` + `<button role="menuitem" aria-haspopup aria-expanded>` per top-level.
- Panels are `<div role="menu">` with proper `aria-labelledby`.
- Keyboard: `ArrowLeft`/`Right` between top-levels, `ArrowDown` to enter panel, `ESC` closes, `Tab` moves linear.
- Focus-visible outlines via Horizon's `--focus-outline-width` / `--focus-outline-offset`.
- Mobile switches to an accordion semantic: each top-level is an expandable button; panels are inline, one open at a time.

## Performance

- Assets loaded only on pages with a header-group that uses this section (standard Shopify behavior).
- Uses `--submenu-animation-speed` and `--submenu-animation-easing` for open/close to match Horizon's animation language.
- Avoids shadow DOM (ADR-003 decision) — Horizon tokens cascade natively; merchant brand changes propagate live.
- No `content-visibility: auto` on panels: they need to be in the tab order for a11y.

## Known limitations (v0.1.0)

- **Images only on desktop**: mobile accordion omits `promo` and `collection` block images to keep the mobile experience tight. This is a design decision per Miguel 2026-04-21.
- **No search inside megamenu**: out of F1 scope.
- **Single-level panels**: no nested sub-panels (panel → sub-panel). The `column` block's linklist is the second level. Intentional MVP boundary.
- **Tab focus can leave an open panel** (no focus trap): standard menubar behavior. `ESC` or click-outside closes.

## Changelog

### 0.1.0 — 2026-04-21

- Initial implementation. Desktop grid 2–6 cols, mobile accordion, 4 block types.
