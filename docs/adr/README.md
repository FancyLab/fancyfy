# Architecture Decision Records — fancyfy

ADRs document the **why** behind architectural decisions. They are immutable once accepted; if a decision changes, write a new ADR that supersedes the old one and update the status of the superseded record.

## Format

We use a lightweight MADR-style template:

- **Status** — one of: `Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-XXX`
- **Date** — ISO date (`YYYY-MM-DD`)
- **Deciders** — who signed off
- **Context** — the forces at play
- **Decision** — the outcome
- **Consequences** — what changes downstream (positive and negative)
- **Alternatives considered** — what was rejected and why

## Index

| ID       | Title                                                    | Status                 | Phase |
| -------- | -------------------------------------------------------- | ---------------------- | ----- |
| ADR-001  | Fork strategy & merge discipline with upstream Horizon   | Accepted (amended)     | F0    |
| ADR-002  | Section authoring convention (`fcy-*`)                   | Accepted (amended)     | F0    |
| ADR-003  | Design System strategy — DS extender on Horizon          | Accepted (revised)     | F0    |
| ADR-004  | Build tooling (Vite + TypeScript + SASS)                 | Accepted               | F0    |
| ADR-005  | Distribution model & cherry-pick workflow                | Accepted               | F1    |
| ADR-006  | Performance budget & advanced web APIs                   | Accepted               | F0    |
| ADR-007  | Logging & developer telemetry                            | Accepted               | F0    |
| ADR-008  | schema.org strategy                                      | Accepted               | F6    |
| ADR-009  | Hidden prices by customer tag                            | Accepted               | F2    |
| ADR-010  | Horizon DS contract                                      | Accepted               | F0    |

**Revision history:**

- **ADR-003 (2026-04-21)** — Revised from a parallel `--fcy-*` Design System to an extender strategy that consumes Horizon's existing DS directly. Original approach was replaced after inspection of Horizon's `theme-styles-variables.liquid` (688 lines) and `base.css` (~5000 lines) revealed that a parallel DS would duplicate infrastructure and create merchant-UX incoherence (two color pickers, divergent palettes). The revised ADR documents the three-category token model (Horizon global, Horizon scheme-scoped, fancyfy-exclusive).
- **ADR-001 (2026-04-21)** — §2 amended: documents **Exception B** (`layout/theme.liquid` gains two render calls for `fcy-tokens` and `fcy-editor-badge`). Runbook §4 amended to add a Horizon DS contract validation step (ADR-010) and a Horizon patch re-verification step (ADR-009).
- **ADR-002 (2026-04-21)** — Amended §7 SCSS/TS/Liquid rules to align with the ADR-003 revision: sections consume Horizon tokens directly; every visual section must wrap markup with a `color-scheme-N` class; TS uses the typed `cssVar()` helper.
- **ADR-010 (2026-04-21)** — Revised after Horizon audit (`docs/horizon-audit.md`): expanded from 3 provenances to **6** (added scoped-class, runtime-emitted, body-runtime categories); fixed 6 inverted token names (`--color-variant-selected-*` → `--color-selected-variant-*`); added ~30 useful tokens surfaced by the audit. Source of truth moved from ADR text to `fancyfy/ds/tokens.ts`.

## Writing a new ADR

1. Copy the template from an existing ADR.
2. Assign the next ID. Never reuse IDs.
3. Open a PR titled `adr: ADR-XXX — <short title>`.
4. Merge only after explicit approval. ADRs are contracts.
