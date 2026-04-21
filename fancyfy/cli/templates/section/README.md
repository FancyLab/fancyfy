# fcy-__ID__

TODO: Brief description + screenshot.

## Settings

| Setting | Type | Default | Notes |
| --- | --- | --- | --- |
| `color_scheme` | `color_scheme` | `scheme-1` | Picks the Horizon scheme to wrap the section with. |
| `heading` | `text` | `__PASCAL__` | The visible heading. |

## Cherry-pick procedure

Per ADR-005. Read the latest `fcy-__ID__.manifest.json` before starting.

1. **Verify compatibility with the target theme**:
   - Horizon version ≥ value in `horizon_min_version`.
   - All tokens in `tokens_required` exist in `fancyfy/ds/tokens.ts` of the target theme (or in the client's DS).
2. **Copy files** listed in `manifest.files` at the same paths:
   - `sections/fcy-__ID__.liquid`
   - `assets/fcy-__ID__.*.js`, `assets/fcy-__ID__.*.css` (post-build)
3. **Ensure fancyfy DS is present** in the client:
   - `snippets/fcy-tokens.liquid`
   - DS CSS asset (`assets/fcy-ds.*.css`)
   - `layout/theme.liquid` renders `fcy-tokens` and `fcy-editor-badge`
4. **Ensure target settings exist**:
   - Any key in `settings_schema_required` is present under the Fancyfy groups in `config/settings_schema.json`.
5. **Commit** with a conventional message:
   ```
   feat(sections): add fcy-__ID__@0.1.0 from fancyfy@<version>
   ```
6. **Record** the install in the agency's client ledger (outside the repo).

## Changelog

### 0.1.0 — TODO

- Initial scaffold.
