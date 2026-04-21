/**
 * Shared schema authoring helpers — used by `fcy-<id>.schema.ts` files.
 *
 * These helpers emit plain JSON that matches Shopify's {% schema %}
 * format, but they provide typesafety and reuse across sections
 * (see ADR-002 §4).
 */

export { defineSection } from './section.js';
export { defineBlock } from './block.js';
export { colorScheme } from './color-scheme.js';
export type { SectionSchema, BlockSchema, SchemaSetting } from './types.js';
