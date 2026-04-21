# ADR-001 — Fork strategy & merge discipline with upstream Horizon

- **Status**: Accepted
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F0

## Context

fancyfy is a fork of Shopify's **Horizon** theme. Horizon is an actively maintained, frequently released upstream (current tracked: v3.4.0). We need to:

1. Add fancylab-specific sections, a design system, tooling (Vite/TS/SASS), and utilities.
2. Keep the ability to merge upstream Horizon releases with minimal conflict.
3. Make it mechanically obvious which files belong to Horizon and which to fancyfy — so developers and future merge tools can reason locally.
4. Never lose the upstream-fork flow: Horizon must feel intact to anyone reviewing a PR against it.

Rejected framings (see ADR-005 for the full gating story): we are **not** building app blocks, feature flags, or per-client build pipelines. fancyfy is an agency library consumed via dev-driven cherry-picking.

## Decision

### 1. Territory rule

The repository has two territories:

- **Horizon territory** — `sections/`, `blocks/`, `snippets/`, `layout/`, `templates/`, `assets/`, `locales/`, `config/settings_data.json`, `release-notes.md`, `README.md`, `LICENSE.md`. These paths are **hands-off for creative work**: we do not add new files into them by hand, we do not rename or restructure existing files.
- **fancyfy territory** — everything under `fancyfy/`, `docs/`, and generated outputs that live inside Horizon paths but carry the `fcy-` prefix. We own these.

### 2. Horizon files we touch — explicitly documented exceptions

Territory is hands-off by default. Two deliberate exceptions exist; both are surgical, auditable, and listed here. A third is defined by ADR-009.

**Exception A — `config/settings_schema.json`.**

We **append** a single settings group to the end of the array with a sentinel comment-like marker (Shopify schema JSON has no comments, so we use a well-known group name):

```json
[
  { /* Horizon groups, untouched */ },
  {
    "name": "Fancyfy — Design System",
    "settings": [ /* tokens surfaced to merchant */ ]
  },
  {
    "name": "Fancyfy — Platform",
    "settings": [ /* feature flags, hidden prices tag, etc. */ ]
  }
]
```

**Rule**: we never edit a Horizon group inline. If we need a setting Horizon already provides, we either reuse its key or add ours under a fancyfy group.

**Exception B — `layout/theme.liquid`.**

The DS runtime bridge (ADR-003 §3) and the editor badge (ADR-005 §2) need to render inside every request's `<head>`. Shopify offers no "hook" snippet in Horizon's `theme.liquid`, so we inject two render calls directly:

1. `{%- render 'fcy-tokens' -%}` — emitted immediately after Horizon's `theme-styles-variables` + `color-schemes` renders. This is the runtime bridge for fancyfy-exclusive tokens (ADR-003 §3).
2. `{%- render 'fcy-editor-badge' -%}` — emitted inside the existing `{% if request.design_mode %}` block. Adds HORIZON/FANCYFY labels in the theme editor (ADR-005 §2). Zero cost in the storefront.

Both inserts are comment-marked (`{%- comment -%} fancyfy — see ADR-001 §2 addendum {%- endcomment -%}`) to make them trivially findable during upstream merges.

**Rule**: we never edit other Horizon logic inside `theme.liquid`. If a future need arises, it becomes Exception C with its own documented rationale — not a silent expansion of this one.

**Exception C — ADR-009 hidden-prices patches.** Documented in ADR-009 §4 with a live per-file diff list in `docs/horizon-patches.md`. Applies only when the feature is built (F2).

### 3. Naming & prefix discipline

Every file or identifier produced by fancyfy that lands in Horizon territory MUST use the `fcy-` prefix:

- Liquid files emitted to `sections/`, `blocks/`, `snippets/` → `sections/fcy-megamenu.liquid`
- Bundled assets → `assets/fcy-megamenu.[hash].js`, `assets/fcy-ds.[hash].css`
- Web component tag names → `<fcy-megamenu>`, `<fcy-sticky-atc>`
- Liquid include/render snippet names → `{% render 'fcy-tokens' %}`
- CSS class roots → `.fcy-megamenu`, BEM beneath

This prefix is the **fastest possible signal** to a reviewer, a merger, or an automated tool that the file is ours. Merging Horizon can never collide with a `fcy-` file because Horizon does not use the prefix.

### 4. Merge runbook

When Shopify releases a new Horizon version:

1. `git fetch horizon && git merge horizon/main` (or the documented equivalent).
2. Conflicts in **Horizon territory** → resolve in favor of Horizon's version. We should never have edits there to preserve.
3. Conflicts in `config/settings_schema.json` → always append the fancyfy groups at the end of the array after taking Horizon's changes.
4. **Validate the Horizon DS contract** (ADR-010): run `npm run validate:contract`. The script checks that every Horizon token listed in `fancyfy/ds/tokens.ts` still exists in the merged Horizon. If a token is missing, either:
   - Remove it from the contract (if no fancyfy section uses it anymore), or
   - Update fancyfy sections that consumed it to use the Horizon replacement, then update the contract.
   - Revert the merge only as a last resort.
5. **Verify ADR-009 Horizon patches** (if any exist yet — see `docs/horizon-patches.md`): for each documented patch, confirm the surrounding Horizon code has not been restructured; re-apply the wrapper if needed.
6. Rebuild fancyfy (`npm run build`) so `fcy-*` assets are regenerated.
7. Update `fancyfy/HORIZON_VERSION` file with the new tracked version.
8. Run the showcase store smoke test before tagging the merge.

A PR template (`merge/horizon-<version>`) checklists steps 1–8. The template explicitly calls out the contract validation output and the patch-verification diff.

### 5. Version tracking

- `fancyfy/HORIZON_VERSION` — single-line file with the Horizon tag we are based on (e.g., `3.4.0`). Updated only via merge PRs.
- `fancyfy/VERSION` — fancyfy's own semver (see ADR-005 for version strategy).

## Consequences

**Positive:**

- Horizon upgrades are mechanical, not archaeological. Most merges are conflict-free.
- New contributors learn the rule once: "if the path is Horizon territory, don't edit by hand; if the name starts with `fcy-`, it's ours."
- Tooling can lint/enforce prefix rules and territory boundaries.
- `HORIZON_VERSION` gives sections a way to declare compatibility via `horizon_min_version` in their manifest (see ADR-002).

**Negative / accepted costs:**

- Emitted liquid files live inside Horizon territory at build time. We mitigate by generating them from `fancyfy/sections/*` and documenting that `sections/fcy-*.liquid` is build output (checked in for Shopify CLI to deploy).
- `config/settings_schema.json` is a genuine shared file. A Horizon release that restructures its groups could cause a real conflict — we accept this and resolve case-by-case.
- Cleanup of unused Horizon files is explicitly deferred to a later phase (see roadmap). Deleting Horizon files would invert the territory rule and create merge noise.

## Alternatives considered

- **In-place modification of Horizon files.** Rejected: every merge becomes manual archaeology; the "easy to merge upstream" requirement dies.
- **Full rewrite / rip Horizon out.** Rejected: we lose upstream releases and the accumulated Shopify best practices baked into Horizon.
- **Git submodule of Horizon.** Rejected: Shopify CLI expects a single theme root; submodules break the deploy model.
- **Branch per client / per section.** Rejected explicitly by Miguel; unmaintainable at 20+ clients.
- **No prefix rule (free naming).** Rejected: loses the fastest visual signal for reviewers and merge tooling.
