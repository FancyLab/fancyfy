/**
 * Horizon DS contract — see ADR-010.
 *
 * Canonical list of CSS custom properties fancyfy sections may consume.
 * Each token is declared in one of five provenances:
 *
 *   1. HORIZON_GLOBAL_TOKENS          — static :root declarations in Horizon.
 *   2. HORIZON_SCHEME_TOKENS          — scoped to .color-scheme-N classes.
 *   3. HORIZON_SCOPED_CLASS_TOKENS    — scoped to non-scheme classes (.page-width-*).
 *   4. HORIZON_RUNTIME_EMITTED_TOKENS — produced by a Liquid loop at render time
 *                                       (theme-styles-variables.liquid:243–352).
 *   5. HORIZON_BODY_RUNTIME_TOKENS    — set by inline JS on document.body.style
 *                                       (layout/theme.liquid:47–113).
 *   6. FCY_TOKENS                     — fancyfy-exclusive, in snippets/fcy-tokens.liquid.
 *
 * Changes require explicit PR review (ADR-010 §5). The validator script
 * (fancyfy/cli/validate-contract.ts) confirms provenances 1–3 via static
 * CSS scan; provenances 4–5 are whitelisted because regex cannot reliably
 * find them in Liquid loops or JS string literals.
 */

// ──────────────────────────────────────────────────────────
// 1. Horizon global tokens — static :root declarations.
// Declared in snippets/theme-styles-variables.liquid (static portion)
// or assets/base.css :root block.
// ──────────────────────────────────────────────────────────
export const HORIZON_GLOBAL_TOKENS = [
  // Layout & page widths
  '--sidebar-width',
  '--narrow-content-width',
  '--normal-content-width',
  '--wide-content-width',
  '--narrow-page-width',
  '--normal-page-width',
  '--wide-page-width',

  // Typography — families (body/subheading/heading/accent)
  '--font-body--family',
  '--font-body--style',
  '--font-body--weight',
  '--font-heading--family',
  '--font-heading--style',
  '--font-heading--weight',
  '--font-subheading--family',
  '--font-subheading--style',
  '--font-subheading--weight',
  '--font-accent--family',
  '--font-accent--style',
  '--font-accent--weight',

  // Typography — absolute hardcoded size scale
  '--font-size--3xs',
  '--font-size--2xs',
  '--font-size--xs',
  '--font-size--sm',
  '--font-size--md',
  '--font-size--lg',
  '--font-size--xl',
  '--font-size--2xl',
  '--font-size--3xl',
  '--font-size--4xl',
  '--font-size--5xl',
  '--font-size--6xl',

  // Menu font scale (megamenu / navigation)
  '--menu-font-sm--size',
  '--menu-font-sm--line-height',
  '--menu-font-md--size',
  '--menu-font-md--line-height',
  '--menu-font-lg--size',
  '--menu-font-lg--line-height',
  '--menu-font-xl--size',
  '--menu-font-xl--line-height',
  '--menu-font-2xl--size',
  '--menu-font-2xl--line-height',

  // Heading spacing
  '--font-heading--spacing',
  '--font-h1--spacing',
  '--font-h2--spacing',
  '--font-h3--spacing',
  '--font-h4--spacing',
  '--font-h5--spacing',
  '--font-h6--spacing',
  '--font-paragraph--spacing',

  // Letter-spacing scales
  '--letter-spacing-sm',
  '--letter-spacing-md',
  '--letter-spacing--body-tight',
  '--letter-spacing--body-normal',
  '--letter-spacing--body-loose',
  '--letter-spacing--heading-tight',
  '--letter-spacing--heading-normal',
  '--letter-spacing--heading-loose',
  '--letter-spacing--display-tight',
  '--letter-spacing--display-normal',
  '--letter-spacing--display-loose',

  // Line-height scales
  '--line-height',
  '--line-height--body-tight',
  '--line-height--body-normal',
  '--line-height--body-loose',
  '--line-height--heading-tight',
  '--line-height--heading-normal',
  '--line-height--heading-loose',
  '--line-height--display-tight',
  '--line-height--display-normal',
  '--line-height--display-loose',

  // Max widths (measure constraints)
  '--max-width--body-normal',
  '--max-width--body-narrow',
  '--max-width--heading-normal',
  '--max-width--heading-narrow',
  '--max-width--display-normal',
  '--max-width--display-narrow',
  '--max-width--display-tight',

  // Spacing — margin scale
  '--margin-3xs',
  '--margin-2xs',
  '--margin-xs',
  '--margin-sm',
  '--margin-md',
  '--margin-lg',
  '--margin-xl',
  '--margin-2xl',
  '--margin-3xl',
  '--margin-4xl',
  '--margin-5xl',
  '--margin-6xl',

  // Spacing — padding scale
  '--padding-3xs',
  '--padding-2xs',
  '--padding-xs',
  '--padding-sm',
  '--padding-md',
  '--padding-lg',
  '--padding-xl',
  '--padding-2xl',
  '--padding-3xl',
  '--padding-4xl',
  '--padding-5xl',
  '--padding-6xl',

  // Spacing — gap scale
  '--gap-3xs',
  '--gap-2xs',
  '--gap-xs',
  '--gap-sm',
  '--gap-md',
  '--gap-lg',
  '--gap-xl',
  '--gap-2xl',
  '--gap-3xl',

  // Spacing — misc
  '--spacing-scale-sm',
  '--spacing-scale-md',
  '--spacing-scale-default',
  '--scroll-margin',
  '--checkout-button-gap',

  // Borders — radius
  '--style-border-radius-xs',
  '--style-border-radius-sm',
  '--style-border-radius-md',
  '--style-border-radius-lg',
  '--style-border-radius-50',
  '--style-border-radius-pills',
  '--style-border-radius-inputs',
  '--style-border-radius-buttons-primary',
  '--style-border-radius-buttons-secondary',
  '--style-border-radius-popover',
  '--border-radius-sm',

  // Borders — width
  '--style-border-width',
  '--style-border-width-primary',
  '--style-border-width-secondary',
  '--style-border-width-inputs',
  '--border-width-sm',
  '--border-width-md',
  '--border-width-lg',

  // Borders — composed shorthands
  '--style-border-popover',
  '--style-border-drawer',
  '--style-border-swatch-width',
  '--style-border-swatch-style',
  '--style-border-swatch-opacity',
  '--border-color',

  // Hover interaction tokens
  '--hover-lift-amount',
  '--hover-scale-amount',
  '--hover-subtle-zoom-amount',
  '--hover-shadow-color',
  '--hover-transition-duration',
  '--hover-transition-timing',

  // Surface / panel / drawer transitions
  '--surface-transition-duration',
  '--surface-transition-timing',

  // Submenu / flyout animation
  '--submenu-animation-speed',
  '--submenu-animation-easing',

  // Animation — speeds & easings
  '--animation-speed',
  '--animation-speed-fast',
  '--animation-speed-slow',
  '--animation-speed-medium',
  '--animation-easing',
  '--animation-slideshow-easing',
  '--animation-values',
  '--animation-values-slow',
  '--animation-values-fast',
  '--animation-values-allow-discrete',
  '--ease-out-cubic',
  '--ease-out-quad',
  '--ease-in-out-quad',
  '--animation-timing-hover',
  '--animation-timing-active',
  '--animation-timing-bounce',
  '--animation-timing-default',
  '--animation-timing-fade-in',
  '--animation-timing-fade-out',
  '--drawer-animation-speed',

  // Springs
  '--spring-d300-b0-easing',
  '--spring-d300-b0-duration',
  '--spring-d280-b0-easing',
  '--spring-d280-b0-duration',
  '--spring-d260-b0-easing',
  '--spring-d260-b0-duration',
  '--spring-d220-b0-easing',
  '--spring-d220-b0-duration',
  '--spring-d180-b0-easing',
  '--spring-d180-b0-duration',

  // View transitions
  '--view-transition-old-main-content',
  '--view-transition-new-main-content',

  // Z-index / layering
  '--layer-section-background',
  '--layer-lowest',
  '--layer-base',
  '--layer-flat',
  '--layer-raised',
  '--layer-heightened',
  '--layer-sticky',
  '--layer-window-overlay',
  '--layer-header-menu',
  '--layer-overlay',
  '--layer-menu-drawer',
  '--layer-temporary',

  // Focus
  '--focus-outline-width',
  '--focus-outline-offset',

  // Opacity scale
  '--opacity-5',
  '--opacity-8',
  '--opacity-10',
  '--opacity-15',
  '--opacity-20',
  '--opacity-25',
  '--opacity-30',
  '--opacity-40',
  '--opacity-50',
  '--opacity-60',
  '--opacity-70',
  '--opacity-80',
  '--opacity-85',
  '--opacity-90',
  '--opacity-subdued-text',

  // Shadow & gradient
  '--shadow-button',
  '--gradient-image-overlay',

  // Status colors (global — declared at :root, not scheme-scoped)
  '--color-error',
  '--color-success',
  '--color-white',
  '--color-white-rgb',
  '--color-black',
  '--color-instock',
  '--color-lowstock',
  '--color-outofstock',

  // Icons
  '--icon-size-2xs',
  '--icon-size-xs',
  '--icon-size-sm',
  '--icon-size-md',
  '--icon-size-lg',
  '--icon-stroke-width',

  // Inputs (non-color dimensions)
  '--input-padding',
  '--input-padding-x',
  '--input-padding-y',
  '--input-box-shadow',
  '--input-box-shadow-width',
  '--input-box-shadow-focus',
  '--input-email-min-width',
  '--input-search-max-width',
  '--input-textarea-min-height',

  // Drawers
  '--drawer-inline-padding',
  '--drawer-menu-inline-padding',
  '--drawer-header-block-padding',
  '--drawer-content-block-padding',
  '--drawer-header-desktop-top',
  '--drawer-padding',
  '--drawer-height',
  '--drawer-width',
  '--drawer-max-width',

  // Buttons (non-color)
  '--button-size-sm',
  '--button-size-md',
  '--button-size',
  '--button-padding-inline',
  '--button-padding-block',
  '--button-font-family-primary',
  '--button-font-family-secondary',
  '--button-text-case',
  '--button-text-case-primary',
  '--button-text-case-secondary',
  '--height-buy-buttons',

  // Variant picker (non-color dimensions)
  '--variant-picker-swatch-width',
  '--variant-picker-swatch-height',
  '--variant-picker-swatch-radius',
  '--variant-picker-border-width',
  '--variant-picker-border-style',
  '--variant-picker-border-opacity',
  '--variant-picker-button-radius',
  '--variant-picker-button-border-width',

  // Section heights & media
  '--section-height-small',
  '--section-height-medium',
  '--section-height-large',
  '--height-small',
  '--height-medium',
  '--height-large',
  '--height-full',
  '--card-width-small',

  // Cards (interaction)
  '--card-bg-hover',
  '--card-border-hover',
  '--card-border-focus',

  // Modal & quick-add
  '--modal-max-height',
  '--quick-add-modal-height',
  '--quick-add-modal-width',
  '--quick-add-modal-gallery-width',

  // Slideshow
  '--slideshow-controls-size',
  '--slideshow-controls-icon',
  '--peek-next-slide-size',

  // Utility
  '--backdrop-opacity',
  '--backdrop-color-rgb',
  '--minimum-touch-target',
  '--disabled-opacity',
  '--skeleton-opacity',

  // Shapes
  '--shape--circle',
  '--shape--sunburst',
  '--shape--diamond',
  '--shape--blob',

  // Checkbox
  '--checkbox-size',
  '--checkbox-border-radius',
  '--checkbox-border',
  '--checkbox-label-padding',

  // Cart (non-color typography)
  '--cart-primary-font-family',
  '--cart-primary-font-style',
  '--cart-primary-font-weight',
  '--cart-secondary-font-family',
  '--cart-secondary-font-style',
  '--cart-secondary-font-weight',

  // Badges
  '--badge-blob-padding-block',
  '--badge-blob-padding-inline',
  '--badge-rectangle-padding-block',
  '--badge-rectangle-padding-inline',
] as const;

// ──────────────────────────────────────────────────────────
// 2. Horizon color-scheme-scoped tokens — declared inside
// .color-scheme-N contexts in snippets/color-schemes.liquid.
// Only resolve when an ancestor carries the scheme class.
// Every fancyfy section with visible content MUST wrap with
// `color-{{ settings.color_scheme }}`.
// ──────────────────────────────────────────────────────────
export const HORIZON_SCHEME_TOKENS = [
  // Core surface / text
  '--color-foreground',
  '--color-foreground-rgb',
  '--color-foreground-muted',
  '--color-foreground-heading',
  '--color-foreground-heading-rgb',
  '--color-background',
  '--color-background-rgb',
  '--color-border',
  '--color-border-rgb',
  '--color-shadow',
  '--color-shadow-rgb',

  // Heading preset colors (declared global AND per-scheme; effective scope is scheme)
  '--font-h1--color',
  '--font-h2--color',
  '--font-h3--color',
  '--font-h4--color',
  '--font-h5--color',
  '--font-h6--color',

  // Primary link / accent
  '--color-primary',
  '--color-primary-rgb',
  '--color-primary-hover',
  '--color-primary-hover-rgb',

  // Primary button
  '--color-primary-button-text',
  '--color-primary-button-background',
  '--color-primary-button-border',
  '--color-primary-button-hover-text',
  '--color-primary-button-hover-background',
  '--color-primary-button-hover-border',

  // Secondary button
  '--color-secondary-button-text',
  '--color-secondary-button-background',
  '--color-secondary-button-border',
  '--color-secondary-button-hover-text',
  '--color-secondary-button-hover-background',
  '--color-secondary-button-hover-border',

  // Input (color portion; dimensions live in GLOBAL)
  '--color-input-background',
  '--color-input-border',
  '--color-input-text',
  '--color-input-text-rgb',
  '--color-input-hover-background',
  '--input-disabled-background-color',
  '--input-disabled-border-color',
  '--input-disabled-text-color',

  // Variant picker — unselected
  '--color-variant-background',
  '--color-variant-text',
  '--color-variant-text-rgb',
  '--color-variant-border',
  '--color-variant-hover-background',
  '--color-variant-hover-text',
  '--color-variant-hover-border',

  // Variant picker — SELECTED state (correct name order: selected-variant-*)
  '--color-selected-variant-background',
  '--color-selected-variant-text',
  '--color-selected-variant-border',
  '--color-selected-variant-hover-background',
  '--color-selected-variant-hover-text',
  '--color-selected-variant-hover-border',
] as const;

// ──────────────────────────────────────────────────────────
// 3. Tokens scoped to non-scheme classes (e.g., .page-width-*).
// Consumers must ensure the scoping class is on an ancestor.
// ──────────────────────────────────────────────────────────
export const HORIZON_SCOPED_CLASS_TOKENS = [
  // Declared under .page-width-{narrow,normal,wide}
  '--page-margin',
  '--page-content-width',
  '--page-width',
  '--full-page-grid-with-margins',
] as const;

// ──────────────────────────────────────────────────────────
// 4. Runtime-emitted tokens — produced by a Liquid loop in
// snippets/theme-styles-variables.liquid:243–352. The static
// validator whitelists these (regex cannot reliably match).
// Scope: effectively :root (emitted there by the loop).
// ──────────────────────────────────────────────────────────
export const HORIZON_RUNTIME_EMITTED_TOKENS = [
  // First loop — fluid font-size per preset
  '--font-size--paragraph',
  '--font-size--h1',
  '--font-size--h2',
  '--font-size--h3',
  '--font-size--h4',
  '--font-size--h5',
  '--font-size--h6',

  // Second loop — per-preset typography bundle
  '--font-paragraph--size',
  '--font-paragraph--family',
  '--font-paragraph--style',
  '--font-paragraph--weight',
  '--font-paragraph--line-height',
  '--font-paragraph--letter-spacing',
  '--font-paragraph--case',
  '--font-h1--size',
  '--font-h1--family',
  '--font-h1--style',
  '--font-h1--weight',
  '--font-h1--line-height',
  '--font-h1--letter-spacing',
  '--font-h1--case',
  '--font-h2--size',
  '--font-h2--family',
  '--font-h2--style',
  '--font-h2--weight',
  '--font-h2--line-height',
  '--font-h2--letter-spacing',
  '--font-h2--case',
  '--font-h3--size',
  '--font-h3--family',
  '--font-h3--style',
  '--font-h3--weight',
  '--font-h3--line-height',
  '--font-h3--letter-spacing',
  '--font-h3--case',
  '--font-h4--size',
  '--font-h4--family',
  '--font-h4--style',
  '--font-h4--weight',
  '--font-h4--line-height',
  '--font-h4--letter-spacing',
  '--font-h4--case',
  '--font-h5--size',
  '--font-h5--family',
  '--font-h5--style',
  '--font-h5--weight',
  '--font-h5--line-height',
  '--font-h5--letter-spacing',
  '--font-h5--case',
  '--font-h6--size',
  '--font-h6--family',
  '--font-h6--style',
  '--font-h6--weight',
  '--font-h6--line-height',
  '--font-h6--letter-spacing',
  '--font-h6--case',
] as const;

// ──────────────────────────────────────────────────────────
// 5. Body-runtime tokens — set on document.body.style by the
// inline IIFE in layout/theme.liquid:47–113.
// Static validator whitelists these (they live in JS, not CSS).
// Scope: global (on body element).
// ──────────────────────────────────────────────────────────
export const HORIZON_BODY_RUNTIME_TOKENS = [
  '--header-height',
  '--header-group-height',
  '--top-row-height',
  '--transparent-header-offset-boolean',
] as const;

// ──────────────────────────────────────────────────────────
// 6. Fancyfy-exclusive tokens — declared in snippets/fcy-tokens.liquid.
// Starts empty; sections add as needed (ADR-003 §2 Category C).
// ──────────────────────────────────────────────────────────
export const FCY_TOKENS = [] as const;

// Type unions
export type HorizonGlobalToken = (typeof HORIZON_GLOBAL_TOKENS)[number];
export type HorizonSchemeToken = (typeof HORIZON_SCHEME_TOKENS)[number];
export type HorizonScopedClassToken = (typeof HORIZON_SCOPED_CLASS_TOKENS)[number];
export type HorizonRuntimeEmittedToken = (typeof HORIZON_RUNTIME_EMITTED_TOKENS)[number];
export type HorizonBodyRuntimeToken = (typeof HORIZON_BODY_RUNTIME_TOKENS)[number];
export type FcyToken = (typeof FCY_TOKENS)[number];
export type AnyToken =
  | HorizonGlobalToken
  | HorizonSchemeToken
  | HorizonScopedClassToken
  | HorizonRuntimeEmittedToken
  | HorizonBodyRuntimeToken
  | FcyToken;

/**
 * Typed `var(--...)` helper. ESLint forbids inline `'var(--...)'`
 * string literals — always use this function instead.
 */
export function cssVar<T extends AnyToken>(token: T): `var(${T})` {
  return `var(${token})` as `var(${T})`;
}

/** Statically-verifiable tokens (provenances 1–3). */
export const CONTRACT_TOKENS_STATIC: readonly string[] = [
  ...HORIZON_GLOBAL_TOKENS,
  ...HORIZON_SCHEME_TOKENS,
  ...HORIZON_SCOPED_CLASS_TOKENS,
];

/** Whitelisted tokens (provenances 4–5) — validator skips these. */
export const CONTRACT_TOKENS_WHITELISTED: readonly string[] = [
  ...HORIZON_RUNTIME_EMITTED_TOKENS,
  ...HORIZON_BODY_RUNTIME_TOKENS,
];

/** All contract tokens (all six provenances). */
export const ALL_CONTRACT_TOKENS: readonly string[] = [
  ...CONTRACT_TOKENS_STATIC,
  ...CONTRACT_TOKENS_WHITELISTED,
  ...FCY_TOKENS,
];
