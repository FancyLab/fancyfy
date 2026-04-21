/**
 * Minimal types covering the Shopify section/block schema surface
 * that fancyfy sections use. Intentionally loose — we're not
 * reimplementing Shopify's full schema validator here.
 */

export interface SchemaSetting {
  type: string;
  id?: string;
  label?: string;
  default?: unknown;
  info?: string;
  content?: string; // for 'header' and 'paragraph'
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  [key: string]: unknown;
}

export interface BlockSchema {
  type: string;
  name: string;
  limit?: number;
  settings?: SchemaSetting[];
  /**
   * Shopify 2.0 theme blocks support nested blocks.
   * Declare allowed child block types here.
   */
  blocks?: BlockSchema[];
}

export interface PresetSchema {
  name: string;
  category?: string;
  settings?: Record<string, unknown>;
  blocks?: Array<{ type: string; settings?: Record<string, unknown> }>;
}

export interface EnabledOn {
  groups?: string[];
  templates?: string[];
}

export interface SectionSchema {
  name: string;
  class?: string;
  tag?: string;
  limit?: number;
  enabled_on?: EnabledOn;
  disabled_on?: EnabledOn;
  settings: SchemaSetting[];
  blocks?: BlockSchema[];
  max_blocks?: number;
  presets?: PresetSchema[];
  default?: { settings?: Record<string, unknown>; blocks?: unknown[] };
}
