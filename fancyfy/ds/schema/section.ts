import type { SectionSchema } from './types.js';

/**
 * Identity helper that lets section schemas be authored in TS with
 * full type checking and then serialized to JSON at build time.
 *
 * The Vite plugin (fancyfy/cli/vite-plugin.ts) dynamically imports
 * `fcy-<id>.schema.ts`, calls `JSON.stringify()` on the default
 * export, and injects the result into the section's liquid as a
 * `{% schema %} ... {% endschema %}` block.
 */
export function defineSection(schema: SectionSchema): SectionSchema {
  return schema;
}
