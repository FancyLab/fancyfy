/**
 * fancyfy-exclusive tokens — the source of truth for values that
 * end up declared in `snippets/fcy-tokens.liquid`.
 *
 * Per ADR-003 §2 Category C, a `--fcy-*` token is justified only when:
 *   1. Horizon has no token of equivalent meaning, AND
 *   2. The value is shared between multiple selectors, AND
 *   3. Merchant customization makes sense OR the value is a stable
 *      cross-file constant.
 *
 * F0 starts with this list empty. Sections add tokens as needed in
 * their own PRs, adding a row here and an entry in FCY_TOKENS in
 * fancyfy/ds/tokens.ts.
 */

export interface FcyTokenDef {
  /** The CSS custom property name, including the `--fcy-` prefix. */
  name: string;
  /** Default value. Can reference Horizon tokens via var(--...). */
  default: string;
  /** Why this token is justified (for the PR reviewer). */
  rationale: string;
  /** Optional: the theme settings key whose value overrides the default. */
  settingKey?: string;
  /** Which section(s) consume it (documentation hint). */
  consumedBy: readonly string[];
}

export const FCY_TOKEN_DEFS: readonly FcyTokenDef[] = [
  // Example shape — uncomment when the first section needs it:
  //
  // {
  //   name: '--fcy-color-pin',
  //   default: '#FFD54A',
  //   rationale: 'Shoppable-image pin overlay; Horizon has no accent token suitable for overlay markers.',
  //   settingKey: 'fancyfy_color_pin',
  //   consumedBy: ['shoppable-image'],
  // },
];
