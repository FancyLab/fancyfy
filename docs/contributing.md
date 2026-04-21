# Contributing to fancyfy

This is fancylab's internal section library on top of Shopify Horizon. See `docs/adr/` for the architecture and `docs/roadmap.md` for phase planning.

## Quick start

```bash
# 1. Install Node 20+ (pinned in .nvmrc) and npm
nvm use

# 2. Install dependencies
npm install

# 3. Start the Vite file emitter (watches fancyfy/ and rebuilds assets/ + sections/)
npm run dev

# 4. In a second terminal, serve the showcase store
npm run dev:shopify

# 5. (Optional third terminal) Capture dev errors to .fancyfy-logs/
npm run dev:logs
```

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Vite in watch mode — re-emits `sections/fcy-*.liquid` and `assets/fcy-*.*` on every change. |
| `npm run dev:shopify` | `shopify theme dev` against the showcase dev store. |
| `npm run dev:logs` | Starts the local error-log collector at http://127.0.0.1:8787 (ADR-007). |
| `npm run build` | Production build of all sections + DS. |
| `npm run new:section <id>` | Scaffolds `fancyfy/sections/<id>/` from the template (ADR-002). |
| `npm run validate:contract` | Verifies Horizon still declares every token in `fancyfy/ds/tokens.ts` (ADR-010). |
| `npm run typecheck` | TypeScript strict check against `tsconfig.build.json`. |
| `npm run lint` | ESLint over fancyfy TS/TSX. |
| `npm run lint:style` | Stylelint over fancyfy SCSS. |
| `npm run check` | Typecheck + lint + lint:style + validate:contract (the CI gate). |
| `npm run format` | Prettier write. |

## Adding a new section

1. `npm run new:section sticky-atc`
2. Edit the scaffolded files under `fancyfy/sections/sticky-atc/`:
   - `fcy-sticky-atc.liquid` — markup with `color-{{ settings.color_scheme }}` wrapper (ADR-003 §2 Category B).
   - `fcy-sticky-atc.ts` — web component (extend `FcyElement`, never `HTMLElement` directly).
   - `fcy-sticky-atc.scss` — styles using Horizon tokens (ADR-010 contract).
   - `fcy-sticky-atc.schema.ts` — TS schema via `defineSection(...)`.
   - `fcy-sticky-atc.manifest.json` — portability contract (ADR-002 §5).
   - `README.md` — cherry-pick guide and settings matrix.
3. `npm run dev` — the build emits:
   - `sections/fcy-sticky-atc.liquid` (with `{% schema %}` injected).
   - `assets/fcy-sticky-atc.[hash].js` + `.css`.
4. Open the showcase store; drag the section in.
5. Measure against ADR-006 budgets. Ship when green.

## The contract (ADR-010) — what tokens can I use?

All fancyfy SCSS and TS MUST consume tokens listed in `fancyfy/ds/tokens.ts`:

- **Horizon global tokens** (`:root`) — spacing, typography, animation, z-index, etc. Use directly: `var(--padding-xl)`.
- **Horizon scheme-scoped tokens** (`.color-scheme-N`) — colors. Available only inside the section's color-scheme wrapper.
- **Fancyfy-exclusive tokens** (`--fcy-*`) — declared in `snippets/fcy-tokens.liquid`. Start empty; add only when Horizon has no equivalent and the justification in `fcy-tokens.config.ts#FCY_TOKEN_DEFS` holds.

If you need a Horizon token not in the contract yet, add it to `fancyfy/ds/tokens.ts` and ensure `npm run validate:contract` passes.

## Logging (ADR-007)

Never call `console.*` directly. ESLint enforces this.

```ts
import { createLogger } from '@fancyfy/shared';
const log = createLogger('my-section');

log.debug('panel opened', { itemId });       // dev only, stripped in prod
log.info('section ready');                    // dev only, stripped in prod
log.warn('fallback triggered');               // kept in prod
log.error('hydration failed', err);           // kept in prod
const stop = log.time('init'); /* ... */ stop();
```

## Merging Horizon upstream

See ADR-001 §4 for the runbook. Short version:

1. `git fetch horizon && git merge horizon/main`
2. Resolve conflicts — **always take Horizon's version** inside Horizon territory.
3. `npm run validate:contract` — must pass.
4. Verify `docs/horizon-patches.md` patches still apply (if any exist yet).
5. `npm run build` — regenerate `fcy-*` outputs.
6. Update `fancyfy/HORIZON_VERSION`.
7. Smoke test on the showcase store.

## Questions

- Architecture decisions live in `docs/adr/`. Read the index at `docs/adr/README.md` first.
- Phase planning: `docs/roadmap.md`.
