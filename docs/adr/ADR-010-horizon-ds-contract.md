# ADR-010 — Horizon DS contract

- **Status**: Accepted (revised 2026-04-21 after Horizon audit)
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F0
- **Related**: ADR-001 (merge runbook), ADR-002 (section SCSS rule), ADR-003 (DS extender strategy)
- **Evidence**: `docs/horizon-audit.md` — the inventory backing this contract

## Context

ADR-003 (revised) makes fancyfy sections consume Horizon's CSS custom properties directly. This creates a hard dependency on the names and semantics of those tokens. If Horizon upstream renames `--padding-xl` or removes `--animation-values`, our sections break silently.

We need a **contract**: an explicit, auditable list of the Horizon tokens fancyfy depends on. The contract serves three purposes:

1. **Merge-time validation** — a script checks that every statically-declared token in the contract still exists after a Horizon merge, failing loudly if not.
2. **TypeScript type safety** — `fancyfy/ds/tokens.ts` exports the contract as union types; section authors get autocomplete and compile-time errors.
3. **Review gate** — adding a new token to the contract is a deliberate PR; we don't sprawl the dependency surface by accident.

## Decision

### 1. The contract lives in `fancyfy/ds/tokens.ts`

A single TypeScript file. It exports six arrays (one per token provenance), their corresponding type unions, the `cssVar()` helper, and three aggregates (`CONTRACT_TOKENS_STATIC`, `CONTRACT_TOKENS_WHITELISTED`, `ALL_CONTRACT_TOKENS`) consumed by the validator.

### 2. Six provenances

A Horizon audit (`docs/horizon-audit.md`, 2026-04-21) identified that Horizon declares custom properties in **five** different ways, not one. fancyfy models each explicitly so the validator, TypeScript, and reviewers can reason about them correctly.

| # | Provenance | Declared where | Scope for consumers | Validator treatment |
|---|---|---|---|---|
| 1 | `HORIZON_GLOBAL_TOKENS` | Static `:root` blocks in `snippets/theme-styles-variables.liquid` or `assets/base.css` | Always available | **Statically verified** |
| 2 | `HORIZON_SCHEME_TOKENS` | Under `.color-scheme-N` / `:root, .color-scheme-N` in `snippets/color-schemes.liquid` | Only inside `color-scheme-*` wrapper | **Statically verified** |
| 3 | `HORIZON_SCOPED_CLASS_TOKENS` | Under non-scheme classes (e.g., `.page-width-narrow`) in `assets/base.css` | Only when the scoping class is present on an ancestor | **Statically verified** |
| 4 | `HORIZON_RUNTIME_EMITTED_TOKENS` | Produced by a Liquid loop (`theme-styles-variables.liquid:243–352`) — text literal is `--font-[preset]--size:` not a final name | Effectively `:root` | **Whitelisted** (regex cannot reliably find them) |
| 5 | `HORIZON_BODY_RUNTIME_TOKENS` | Set by inline JS on `document.body.style` at page load (`layout/theme.liquid:47–113`) | Global (on body) | **Whitelisted** (live in JS, not CSS) |
| 6 | `FCY_TOKENS` | `snippets/fcy-tokens.liquid`, declared by fancyfy | Always available | Own-source; validator trusts |

**Category notes derived from the audit:**

- **Scheme override patterns**: some tokens are declared globally as a fallback and overridden per-scheme (e.g., `--input-disabled-background-color`, `--font-h1--color`…`--font-h6--color`). Their effective scope is scheme; we list them under `HORIZON_SCHEME_TOKENS`.
- **Hidden scheme dependencies**: a small number of globally-declared tokens reference scheme-scoped values (e.g., `--checkbox-border` → `--opacity-35-55`). Outside a scheme wrapper they resolve to invalid CSS. Documented in comments inside `tokens.ts` where relevant.
- **Conditional tokens** (e.g., `--shadow-drawer`, `--shadow-popover`, `--shadow-blur`) are declared only when a specific merchant setting is enabled. These are *not* in the contract as of F0 — add to `HORIZON_SCHEME_TOKENS` if a section needs one, and document the conditionality in the section's manifest.

### 3. Token-name source of truth

The authoritative list of names is `fancyfy/ds/tokens.ts`, not this document. This ADR defines the *policy* (provenances, validator rules, PR process). The token inventory lives in code so:

- Names are typechecked at consumer site.
- `git blame` tracks every addition/removal.
- Copy-paste drift between ADR text and code cannot happen.

The audit report (`docs/horizon-audit.md`) is the evidence for why the initial inventory looks the way it does.

### 4. Validator — `fancyfy/cli/validate-contract.ts`

Behavior:

1. Read `snippets/theme-styles-variables.liquid`, `snippets/color-schemes.liquid`, and every `assets/*.css`.
2. Extract every CSS custom property declaration via regex `--name:`.
3. For every token in `CONTRACT_TOKENS_STATIC` (provenances 1–3): assert presence in the declaration set.
4. Skip `CONTRACT_TOKENS_WHITELISTED` (provenances 4–5) — they are Liquid-loop-emitted or JS-set, so a static regex cannot see them. The contract commits to the public name; the author takes responsibility for keeping those entries accurate during a merge, verified by manual spot-check or runtime test.
5. Output `✓ contract OK — N static tokens validated; M whitelisted`, or an error listing missing tokens with guidance.
6. Exit non-zero on missing. Blocks the PR and is part of the merge runbook (ADR-001 §4).

When a whitelisted token changes (runtime-emitted or body-runtime): the failure surfaces at section level (TypeScript fails because the consumed token no longer exists in the contract) or at runtime (visual regression caught by showcase smoke test).

### 5. Adding or changing a contract token

**Adding a Horizon token** (provenances 1–5):

1. Identify the correct provenance. The audit report classifies most tokens; follow its conventions.
2. Add the token to the matching array in `fancyfy/ds/tokens.ts`.
3. Run `npm run validate:contract` to confirm (provenances 1–3 only).
4. Justify in the PR: which section needs it, why an existing token wasn't sufficient.

**Adding a fancyfy token** (`FCY_TOKENS`):

1. Add the token definition to `fancyfy/ds/fcy-tokens.config.ts` with `FcyTokenDef` fields, including a `rationale` that survives review per ADR-003 §2 Category C.
2. Add the token name to `FCY_TOKENS` in `tokens.ts`.
3. Add the `:root { --fcy-...: ... }` line in `snippets/fcy-tokens.liquid`.
4. If merchant-editable, add the setting under `Fancyfy — Extensions` in `config/settings_schema.json`.

**Removing**: reverse. A removal PR must also verify no fancyfy section still consumes the token (`grep` across `fancyfy/sections/`).

### 6. Relationship to stylelint

Stylelint (ADR-003 §7) enforces that section SCSS uses `var(--...)` only. A future custom stylelint rule (`fcy/token-in-contract`) will additionally reject `var(--name)` where `--name` is not in the contract. Until that rule ships, TypeScript + validator cover most of the surface.

**Exception**: `fancyfy/ds/abstracts/**` may reference tokens not in the contract when implementing mixins that compose Horizon internals. These files opt out via a stylelint directive comment.

### 7. What the contract does NOT include

- **Horizon color-scheme instances themselves** (the literal `.color-scheme-N` classes and their per-scheme values). Those are merchant data.
- **Horizon component classes** (e.g., `.button`, `.form__input`). If a section reuses a Horizon utility class in markup, that is a separate coupling decision, documented at the section level, not here.
- **Horizon conditional tokens** (`--shadow-drawer`, `--shadow-popover`, etc.) unless a fancyfy section explicitly needs one.
- **Horizon-derived opacity tokens** (`--opacity-5-15`, `--opacity-10-25`, etc.) which are per-scheme computed from background brightness. Sections should avoid depending on them.

## Consequences

**Positive:**

- Every Horizon dependency fancyfy has is visible in one file.
- Merge surprises get caught immediately, not at a client's production site.
- TypeScript and the validator together enforce the contract at authoring and CI time.
- Six provenances make hidden coupling (hidden scheme deps, JS-set pseudo-tokens, Liquid-loop outputs) explicit instead of implicit.

**Negative / accepted costs:**

- Manual maintenance of the TS arrays. Accepted: low churn, curation is a feature.
- Initial inventory is ~270 tokens across the six provenances. Reviewable but non-trivial to scan.
- Whitelisted provenances (4, 5) are not statically verified — a Horizon rename of a runtime-emitted or body-runtime token will only surface via TypeScript errors in a consuming section or via visual regression. Acceptable because these are a small minority of the contract.

## Alternatives considered

- **Auto-generate from Horizon's CSS.** Rejected: Horizon's file is Liquid with dynamic settings; parsing reliably is brittle. And we want curation (opt-in) not mass import.
- **No contract — trust that Horizon rarely renames.** Rejected: silent breakage on merge is the failure mode this ADR exists to prevent.
- **Single-provenance contract (treat everything as "global").** Rejected: the audit showed that treating scheme tokens as global produced a concrete bug (`--color-variant-selected-*` name inversion) and hidden scope errors (checkbox-border outside a scheme wrapper).
- **Pin Horizon's upstream version as the contract.** Rejected: doesn't tell us *which* tokens we depend on, only that we depend on *some* version.
