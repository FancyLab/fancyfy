# ADR-004 — Build tooling (Vite + TypeScript + SASS)

- **Status**: Accepted
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F0
- **Related**: ADR-001 (territory), ADR-002 (section convention), ADR-003 (DS)

## Context

We need a build system that:

1. Compiles TypeScript and SCSS for fancyfy sections into hashed assets.
2. Injects schema (authored in TS per ADR-002 §4) into the liquid that ships to the theme.
3. Emits liquid files into Horizon territory (`sections/fcy-*.liquid`) with correct asset references.
4. Coexists with **Shopify CLI** (`shopify theme dev`, `shopify theme push`) — the CLI owns deployment; our build owns asset generation.
5. Does not force a build step on Horizon-only development (Horizon files render today without tooling; adding a mandatory bundler for the entire theme is out of scope).
6. Supports a fast dev loop (file watch + Shopify CLI hot reload).

Alternative bundlers considered up-front: esbuild (no SCSS story without a plugin), webpack (heavy, slow config), rollup (great core, but we want DX), Parcel (too magic for our custom liquid pipeline).

## Decision

### 1. Vite as the build tool

Vite gives us native TS, native SCSS (via `sass-embedded`), and a plugin API flexible enough for our custom liquid emission step. We use it in **library mode** (not app mode) with multiple entries.

### 2. Package layout

```
package.json                          ← new file at repo root
tsconfig.json
tsconfig.build.json
vite.config.ts                        ← new
.nvmrc                                ← Node LTS pinned
.npmrc
.prettierrc
.eslintrc.cjs
.stylelintrc.cjs
fancyfy/
├── ds/...
├── sections/...
├── shared/...                        ← FcyElement base, logger, schema-org helpers
├── cli/
│   ├── new-section.ts                ← scaffolder
│   └── log-collector.ts              ← dev-only error log sink (ADR-007)
└── VERSION
```

`package.json` declares the only runtime dependency allowed to ship to the client bundle: **zero** (we target vanilla Web Components + native APIs). Dev dependencies: Vite, TypeScript, sass-embedded, stylelint + plugins, eslint + plugins, prettier.

### 3. Custom Vite plugin: `fcy-theme-plugin`

Located at `fancyfy/cli/vite-plugin.ts`. Responsibilities, in order:

1. **Discover sections** — glob `fancyfy/sections/*/fcy-*.manifest.json`.
2. **Build entry graph** — for each section, register TS and SCSS entries with `rollupOptions.input`:
   - `fcy-<id>-js` → `fancyfy/sections/<id>/fcy-<id>.ts`
   - `fcy-<id>-css` → `fancyfy/sections/<id>/fcy-<id>.scss`
3. **Emit assets** — output to `assets/` with `[name].[hash].[ext]` naming, but stripped of the `-js` / `-css` suffix in final filename so the result is `assets/fcy-megamenu.[hash].js` and `assets/fcy-megamenu.[hash].css`.
4. **Resolve schema** — for each section, dynamic-import `fcy-<id>.schema.ts` (transpiled via tsx), serialize the exported default to JSON.
5. **Emit liquid** — read `fcy-<id>.liquid` source, replace:
   - `{%- render 'fcy-asset', handle: 'fcy-<id>.js' -%}` → `{{ 'fcy-<id>.<hash>.js' | asset_url | script_tag }}`
   - `{%- render 'fcy-asset', handle: 'fcy-<id>.css' -%}` → `{{ 'fcy-<id>.<hash>.css' | asset_url | stylesheet_tag }}`
   - `{%- fcy_schema -%}` sentinel → the serialized `{% schema %} ... {% endschema %}` block.
   
   Write to `sections/fcy-<id>.liquid` (Horizon territory, but always prefixed → territory rule satisfied per ADR-001).
6. **Emit blocks** — for each file under `fancyfy/sections/<id>/blocks/*.block.liquid`, copy to `blocks/` with the same rewrites.
7. **Emit manifest index** — `fancyfy/.build-manifest.json` (gitignored) records `{ sectionId → { jsHash, cssHash, liquidPath } }` for the dev log collector and debug tooling.

### 4. Design System build

In addition to sections, the plugin builds the DS itself:

- Entry: `fancyfy/ds/main.scss` + a synthesized root stylesheet from `tokens.config.ts`.
- Output: `assets/fcy-ds.[hash].css`, `fancyfy/ds/generated/_tokens.generated.scss`, `fancyfy/ds/generated/tokens.d.ts`, `fancyfy/ds/generated/settings-fragment.json`.
- Settings fragment is merged into `config/settings_schema.json` **only on `npm run build` with `--commit-schema`** (an opt-in flag). In watch mode, we write the fragment but do not rewrite the shared schema to avoid fighting the Shopify CLI.

### 5. Scripts

```jsonc
{
  "scripts": {
    "dev":              "vite build --watch --mode development",
    "dev:shopify":      "shopify theme dev",
    "dev:logs":         "tsx fancyfy/cli/log-collector.ts",
    "build":            "vite build --mode production",
    "build:schema":     "vite build --mode production -- --commit-schema",
    "new:section":      "tsx fancyfy/cli/new-section.ts",
    "lint":             "eslint 'fancyfy/**/*.{ts,tsx}'",
    "lint:style":       "stylelint 'fancyfy/**/*.scss'",
    "typecheck":        "tsc -p tsconfig.build.json --noEmit",
    "check":            "npm run typecheck && npm run lint && npm run lint:style"
  }
}
```

**Dev loop**: developer runs `npm run dev` (Vite watch emits assets + liquid) and `npm run dev:shopify` (Shopify CLI proxies the dev store) in two terminals. Vite writes file changes → Shopify CLI picks them up → dev store reloads.

**Optional third terminal**: `npm run dev:logs` starts the error log sink (ADR-007).

### 6. TypeScript configuration

- `tsconfig.json` — IDE config, covers all TS files with strict mode.
- `tsconfig.build.json` — excludes tests and CLI; used by the plugin and typecheck script.
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- Path aliases: `@fancyfy/ds`, `@fancyfy/shared`, `@fancyfy/sections/*` for cleaner imports.

### 7. SCSS configuration

- `sass-embedded` (faster than `sass`).
- Modern `@use` / `@forward`, no `@import`.
- Stylelint with `stylelint-config-standard-scss` and custom rules enforcing ADR-003 §5 (no hex in sections, no raw px for tokenable values).

### 8. Linting & formatting

- ESLint + `@typescript-eslint`, plus a project-specific rule forbidding `console.*` outside `fancyfy/shared/logger.ts` (ADR-007).
- Prettier for TS/JSON/MD; stylelint-prettier for SCSS.
- Husky + lint-staged on commit (lightweight): run `prettier --check`, `eslint --cache`, `stylelint --cache` on staged files only.

### 9. CI (proposed)

A GitHub Action `ci.yml` that on every PR runs `npm run check && npm run build`. Fails the PR if any lint/type/build error. Detailed CI design deferred to F0 implementation sprint.

### 10. What we do NOT do

- **We do not compile or touch Horizon's own assets.** `assets/*.js` and `assets/*.css` that ship with Horizon are left as-is. Shopify CLI serves them. Our plugin's output only lands on files with the `fcy-` prefix.
- **We do not introduce a package manager monorepo** (npm workspaces, pnpm workspaces). The entire repo is a single package; `fancyfy/` is a folder, not a separate workspace. Reason: simpler mental model; no publish flow; no need for `file:` protocol inter-deps.
- **We do not use Vite dev server** (`vite` command). Shopify CLI owns the serving; we use `vite build --watch` as a pure file emitter.

## Consequences

**Positive:**

- Sections get modern TS/SCSS with near-instant watch rebuilds.
- Shopify CLI's deploy/dev flow is preserved — reviewers and deploys don't learn a new tool.
- Horizon-only contributors can edit Horizon territory files without running the build (their changes don't affect the fancyfy outputs).
- One `vite.config.ts` + one custom plugin = the entire custom pipeline. Comprehensible.

**Negative / accepted costs:**

- Two-terminal dev loop (Vite watch + Shopify CLI) is slightly more friction than single-command. Documented in F0 onboarding guide; we can unify with a `concurrently` wrapper later.
- Emitted liquid files are checked into git (so Shopify CLI can push them). This is normal for Shopify themes with any build step; we gitignore `.build-manifest.json` and `fancyfy/ds/generated/` but not `sections/fcy-*.liquid` or `assets/fcy-*`.
- Building inside Horizon territory (file emission) requires discipline. The prefix rule (ADR-001) makes ownership unambiguous.

## Alternatives considered

- **esbuild with custom scripts.** Rejected: SCSS support needs a plugin, and we'd rebuild Vite's developer-friendly features ourselves.
- **webpack.** Rejected: heavy config, slower dev loop, no material advantage.
- **No bundler, plain TS compiler + dart-sass CLI.** Rejected: loses hashed asset output, tree-shaking, and the clean plugin hook for schema injection.
- **Theme Check / Shopify CLI asset compilation.** Rejected: Shopify CLI does not compile TS/SCSS — it just serves files.
- **pnpm workspaces monorepo.** Rejected for now: adds complexity without a present multi-package need.
