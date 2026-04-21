import type { SchemaSetting } from './types.js';

/**
 * Returns a Shopify color_scheme setting entry that reuses Horizon's
 * color-scheme group. Every fancyfy section that renders visible
 * content MUST include this so its markup can be wrapped in the
 * matching `color-{{ section.settings.color_scheme }}` class (ADR-003 §2 Category B).
 *
 * @example
 *   settings: [
 *     colorScheme({ default: 'scheme-1' }),
 *     // ...
 *   ]
 */
export function colorScheme(
  options: { id?: string; label?: string; default?: string; info?: string } = {},
): SchemaSetting {
  return {
    type: 'color_scheme',
    id: options.id ?? 'color_scheme',
    label: options.label ?? 'Color scheme',
    default: options.default ?? 'scheme-1',
    ...(options.info !== undefined ? { info: options.info } : {}),
  };
}
