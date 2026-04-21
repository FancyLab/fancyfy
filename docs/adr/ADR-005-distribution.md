# ADR-005 — Distribution model & cherry-pick workflow

- **Status**: Accepted
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F1
- **Related**: ADR-001 (territory), ADR-002 (manifest), ADR-003 (DS), ADR-004 (build)

## Context

fancyfy is an **agency library, not a productized SaaS**. Its consumers are fancylab developers working on ~20 client stores. The distribution problem is therefore not a gating or billing problem — it is a workflow problem:

1. **Designers** need a place to visually browse all available sections.
2. **Developers** need a mechanical, low-error procedure to bring a section from the fancyfy repo into a specific client's theme repo.
3. **The agency** needs to know which client runs which version of which section (for support and future updates).

We explicitly reject (previous conversation, 2026-04-21):

- App blocks for gating — no monetization requires it.
- Per-client build pipelines emitting filtered theme zips — unnecessary indirection when devs pick manually.
- Runtime feature flags / customer-tag gating — not our problem; agency controls what ships.

## Decision

### 1. Showcase store = this repo deployed to a fancylab dev store

A Shopify **development store** owned by fancylab acts as the living showcase. It runs the fancyfy theme directly; every merge to `main` deploys (manual in F0, GitHub Action in F1+).

- Every fancyfy section has at least one demo template in the showcase with varied settings.
- The showcase is the **source of truth** for what each section looks like. Design briefs link to specific showcase pages instead of Figma-only references.

### 2. HORIZON vs FANCYFY visual label (editor-only)

A liquid snippet `snippets/fcy-editor-badge.liquid`, rendered inside every section (both Horizon and fancyfy), emits a small badge ONLY when `request.design_mode` is true:

```liquid
{%- if request.design_mode -%}
  <div class="fcy-editor-badge" data-origin="{{ section.type | slice: 0, 4 }}">
    {%- if section.type contains 'fcy-' -%}FANCYFY{%- else -%}HORIZON{%- endif -%}
  </div>
{%- endif -%}
```

Zero runtime cost in storefront. Designers see the origin of each section while clicking around in the theme editor.

### 3. Cherry-pick procedure (manual in F1, tool-assisted in F2+)

When a design requires a fancyfy section for client X, a fancylab developer follows the section's `README.md`. The repeatable outline:

1. **Read the section's `manifest.json`** in fancyfy.
2. **Verify compatibility** with client X's theme:
   - Horizon version ≥ `horizon_min_version`.
   - All `tokens_required` exist in client's DS (if client has fancyfy DS installed).
   - All `snippets_required` exist in client theme.
   - All `settings_schema_required` exist in client's `config/settings_schema.json`.
3. **Copy files** listed in `manifest.files` from fancyfy to client theme at the same paths.
4. **Install DS if absent**: copy `assets/fcy-ds.*`, `snippets/fcy-tokens.liquid`, and the Fancyfy settings groups from `config/settings_schema.json`.
5. **Commit in client repo** using conventional commits:
   `feat(sections): add fcy-megamenu@0.1.0 from fancyfy@0.3.1`
6. **Record** the integration in the agency's internal ledger (which client has which section version). The ledger is outside the repo; a simple Notion or spreadsheet.

Steps 2–4 are the error-prone parts. They are mechanized in the future CLI.

### 4. Future CLI: `fancyfy add` (Phase 2+)

Scope definition for when we build it:

```
fancyfy add <section-id> --to <client-theme-path> [--version <semver>]
```

Behaviors:

- Reads `manifest.json` for `<section-id>`.
- Inspects the target theme folder: checks Horizon version, existing DS, existing settings.
- Presents a diff of what will be copied/patched.
- On confirm: copies files, patches `config/settings_schema.json` additively (never touches Horizon groups), writes a changelog entry to `.fancyfy/install-log.jsonl` in the client repo.
- Refuses to run if the target repo has uncommitted changes (safety).

Explicitly **not** in scope for the CLI:

- No removal of sections from client themes (use `git revert` — adding a tool to delete is risk without reward).
- No updating sections in place across breaking versions (we will design that when we need it).

### 5. Versioning strategy

**Two levels of semver:**

| Level | Location | Governs |
|---|---|---|
| fancyfy repo | `fancyfy/VERSION` | The monorepo as a whole: tooling, DS, CLI, conventions. |
| Section | `fancyfy/sections/<id>/fcy-<id>.manifest.json#version` | An individual section's public contract. |

**Bump rules for a section:**

- **PATCH** — bug fix, no schema changes, no token additions, no visual regression.
- **MINOR** — new optional setting, new optional block type, new CSS class, backwards-compatible token addition.
- **MAJOR** — remove/rename a setting, change a block type's required fields, remove a token dependency without migration, visually breaking redesign that can't be opted out of.

**Bump rules for the fancyfy repo:**

- **PATCH** — tooling/doc fixes, DS internal refactors without token changes.
- **MINOR** — new DS tokens (additive), new CLI commands, new shared utilities.
- **MAJOR** — removed/renamed DS tokens, changed build output paths, changed manifest schema.

A section's `fancyfy_min_version` in its manifest pins it to the fancyfy features it depends on.

### 6. Changelog

- Per-section `CHANGELOG.md` inside `fancyfy/sections/<id>/` using Keep a Changelog format.
- Repo-level `CHANGELOG.md` at root covering tooling / DS / CLI.

Release PRs must update both if they touch both layers.

### 7. Client support policy (for the record)

Not code, but defined here to complete the distribution story:

- When a bug is found in a section already cherry-picked to a client: fix is made in fancyfy first, then back-ported to affected clients by re-running the cherry-pick or applying a targeted patch.
- We maintain a per-client ledger (external to this repo) with `{ clientId, sectionsInstalled: [{ id, version, installedAt, installedBy }] }`.
- "Update a client to latest" is a deliberate, agency-scheduled operation — not an auto-pull.

## Consequences

**Positive:**

- The distribution model matches the human workflow (agency devs cherry-pick for specific projects).
- Manifest + README + CLI (future) form a tight feedback loop: compatibility issues surface at integration time, not in production.
- Per-section semver gives real signal when a section upgrade might break a client.
- Showcase store doubles as a design reference and a regression environment.

**Negative / accepted costs:**

- The agency must keep an external ledger of client ↔ section installations. We accept that — it's the honest representation of "this is our internal library, not a SaaS".
- Manual cherry-picking in F1 is error-prone; we mitigate with thorough README and automate in Phase 2+.
- Updating 20 clients when a section fixes a bug is 20 cherry-pick operations. This is a known cost of the "no runtime gating" model; the CLI reduces the cost per operation.

## Alternatives considered

- **Publish fancyfy sections as an npm package.** Rejected: Shopify themes are not npm-consuming projects; adds a publish step without consumer infrastructure.
- **Distribute via a git submodule in each client repo.** Rejected: same reason as ADR-001 — Shopify CLI expects single theme root, and updating submodules adds friction without benefit.
- **Theme-Apps-Extensions (app-blocks delivery).** Rejected: no monetization or dynamic gating requirement justifies the app infrastructure.
- **Central per-client build pipeline.** Rejected: dev cherry-pick is the stated preference; adding a pipeline inverts the control from the dev to the build.
- **Copy-paste with no manifest.** Rejected: loses compatibility verification; scales badly.
