import { defineSection, colorScheme } from '../../ds/schema/index.js';

// Per Shopify 2.0 theme-block model, each child block type's schema
// lives in its own blocks/fcy-mm-*.liquid file (inline {% schema %}).
// Here we only declare the section schema; `blocks` references types
// by name, Shopify resolves them from the block files.

export default defineSection({
  name: 'Fancyfy — Megamenu',
  class: 'fcy-megamenu-section',
  tag: 'section',
  enabled_on: { groups: ['header'] },
  settings: [
    { type: 'header', content: 'General' },
    colorScheme({ default: 'scheme-1' }),
    {
      type: 'link_list',
      id: 'menu',
      label: 'Menu',
      info:
        'The top-level navigation. Configure in Online Store → Navigation. Each top-level link can optionally have a panel block defined in this section.',
      default: 'main-menu',
    },
    {
      type: 'select',
      id: 'panel_width',
      label: 'Default panel width',
      info: 'Individual panel blocks can override this.',
      options: [
        { value: 'contained', label: 'Contained (normal page width)' },
        { value: 'full', label: 'Full width' },
      ],
      default: 'contained',
    },
    {
      type: 'select',
      id: 'open_on',
      label: 'Desktop open trigger',
      options: [
        { value: 'hover', label: 'Hover' },
        { value: 'click', label: 'Click only' },
      ],
      default: 'hover',
    },
    {
      type: 'range',
      id: 'hover_delay_ms',
      label: 'Hover open delay (ms)',
      info: 'Prevents accidental open on cursor pass-through. 0 = instant.',
      min: 0,
      max: 400,
      step: 20,
      default: 120,
    },

    { type: 'header', content: 'Typography' },
    {
      type: 'select',
      id: 'top_level_font_size',
      label: 'Top-level font size',
      options: [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ],
      default: 'md',
    },
    {
      type: 'select',
      id: 'top_level_case',
      label: 'Top-level case',
      options: [
        { value: 'none', label: 'As typed' },
        { value: 'uppercase', label: 'Uppercase' },
        { value: 'lowercase', label: 'Lowercase' },
      ],
      default: 'uppercase',
    },
    {
      type: 'range',
      id: 'top_level_letter_spacing',
      label: 'Top-level letter spacing (em × 100)',
      min: -5,
      max: 20,
      step: 1,
      default: 6,
    },

    { type: 'header', content: 'Active indicator' },
    {
      type: 'select',
      id: 'active_indicator',
      label: 'Active item indicator',
      options: [
        { value: 'none', label: 'None' },
        { value: 'underline', label: 'Underline' },
        { value: 'color', label: 'Color change' },
        { value: 'both', label: 'Underline + color' },
      ],
      default: 'underline',
    },
  ],
  // Section root accepts only the panel block. Panel's own schema
  // (in blocks/fcy-mm-panel.liquid) declares which children it accepts.
  blocks: [{ type: 'fcy-mm-panel', name: 'Panel (top-level item)' }],
  presets: [
    {
      name: 'Fancyfy — Megamenu',
      category: 'Navigation',
      settings: {
        menu: 'main-menu',
        panel_width: 'contained',
        open_on: 'hover',
      },
    },
  ],
});
