# ADR-008 — schema.org strategy

- **Status**: Accepted
- **Date**: 2026-04-21
- **Deciders**: Miguel Soler (fancylab)
- **Phase**: F6
- **Related**: ADR-001 (territory), ADR-002 (section convention)

## Context

Structured data (schema.org JSON-LD) is a SEO requirement for Shopify stores and a first-class discoverability tool for LLM-driven search (AEO/GEO). Horizon ships some JSON-LD already — specifically on product and organization templates — but coverage is incomplete and not consistent across the templates we care about for client projects.

fancyfy needs a strategy that:

1. Centralizes JSON-LD generation so the same `Product` schema is emitted consistently across PDP, search result snippets, and related-product sections.
2. Avoids duplicate / conflicting JSON-LD blocks (search engines dislike duplicates and may ignore both).
3. Is validated against Google's Rich Results requirements as a release criterion.
4. Does not fight Horizon's existing JSON-LD — either we replace cleanly with a setting to toggle, or we extend deliberately.

## Decision

### 1. Central helpers in `fancyfy/shared/seo/`

A small TypeScript + Liquid helper library:

```
fancyfy/shared/seo/
├── schema-org.ts            ← type definitions for schema.org shapes we use
├── builders/
│   ├── organization.ts
│   ├── website.ts
│   ├── product.ts
│   ├── breadcrumb-list.ts
│   ├── item-list.ts
│   ├── faq.ts
│   └── local-business.ts
└── liquid/
    ├── fcy-ld-organization.liquid
    ├── fcy-ld-website.liquid
    ├── fcy-ld-product.liquid
    ├── fcy-ld-breadcrumb.liquid
    ├── fcy-ld-item-list.liquid
    ├── fcy-ld-faq.liquid
    └── fcy-ld-local-business.liquid
```

The TS builders are **reference implementations and type guards**, used by our build pipeline and tests. The Liquid snippets are what actually renders in the storefront (Liquid can produce JSON directly; we use `| json` for safety). The TS mirrors exist so we can generate types for section settings and validate shapes in tests.

### 2. Rendering contract

- JSON-LD is rendered inside `<script type="application/ld+json">` tags.
- Each ld snippet is **idempotent**: safe to render once per page regardless of how many times a section includes the wrapper, via a sentinel `request.fcy_ld_rendered` assign.
- Primary placement is in `layout/theme.liquid` for site-wide types (`Organization`, `WebSite`). Template-specific types render from inside their template (`product.liquid` etc.).

### 3. Coverage matrix

| Type | Where | Data source | Phase |
|---|---|---|---|
| `Organization` | `layout/theme.liquid` | `settings.fancyfy_org_*` + shop data | F6 |
| `WebSite` + `SearchAction` | `layout/theme.liquid` | shop data | F6 |
| `Product` | `templates/product.*` | product data | F6 |
| `BreadcrumbList` | product & collection templates | URL + handles | F6 |
| `ItemList` | collection templates | product list | F6 |
| `FAQPage` | from a future `fcy-faq` section | section block data | F6+ |
| `LocalBusiness` | from `fcy-store-locator` section only | metafield-driven locations | F5 (store locator) |
| `Article` | blog article template | article data | F6 |

Each row has an owner snippet + a "render it here" call from the corresponding template or section.

### 4. Data inputs

- Merchant-editable fields live under a `Fancyfy — SEO` settings group: legal name, sameAs URLs (social profiles), default logo, support contact.
- Product data is read from Shopify's product object; we map to schema.org with strict null handling — if a field is empty, we omit it from the JSON. No empty strings, no placeholder values.
- Review data: only emitted when actual reviews are present via a supported source (Shopify Reviews app, Judge.me, Okendo, Yotpo). Section author integrates per-project as needed, documented in the `fcy-ld-product` snippet.

### 5. Horizon compatibility

Horizon already emits JSON-LD on product pages. Our strategy:

1. **Detect** Horizon's existing blocks during F6 audit (one-time review).
2. **Decide per type**: for `Product`, we either replace Horizon's block (if ours is strictly richer) or extend it (if Horizon's is structurally different). Decision recorded here as a table when audit completes.
3. **Setting to disable Horizon's** via a boolean `settings.fancyfy_seo_replace_horizon_ld`, default OFF. Only set to ON when we've verified ours is a superset.
4. **Never emit both** — duplicates confuse crawlers. Either Horizon's or ours per type per page.

### 6. Validation

- **Dev**: a Playwright test opens showcase pages (`/`, `/products/:handle`, `/collections/:handle`) and asserts the expected JSON-LD types are present and pass a JSON Schema validation against schema.org shapes we care about.
- **Manual**: Google Rich Results Test linked in section READMEs for any section that ships JSON-LD.
- **Budget**: JSON-LD payload per page < 5 KB gzipped (not counting description fields for products with long descriptions — those are trimmed to 5000 chars per schema.org guidance).

### 7. Rules for section authors

- Never inline a `<script type="application/ld+json">` in a section. If a new section needs structured data, add a builder to `fancyfy/shared/seo/` and a liquid snippet, then reference the snippet from the section.
- Don't emit JSON-LD for a section that doesn't have a schema.org type in this matrix. If you think it does, propose an ADR update.
- For LocalBusiness (store locator), the locations come from a metaobject, and each location emits its own `LocalBusiness` node — this is defined in the store-locator section's own docs.

## Consequences

**Positive:**

- Consistent, validated structured data across all client stores that install fancyfy sections.
- Type-safety on builder side catches missing required fields at build time.
- Centralized audit trail — when Google changes Rich Results requirements, we update one place.
- Clean interop with Horizon's existing JSON-LD via a single toggle, avoiding silent duplication.

**Negative / accepted costs:**

- F6 scope requires a Horizon JSON-LD audit before we ship the SEO replacements; this pushes complete coverage later in the roadmap.
- Two sources (TS builder + Liquid snippet) for each type means mirroring maintenance. Mitigated by keeping the snippets thin and leaning on Liquid's `| json` filter.
- Review data sources vary per client; we don't unify them here — each implementation is documented per project.

## Alternatives considered

- **Inline `<script type="application/ld+json">` per section.** Rejected: duplicates the same product shape across sections; collision and inconsistency risk.
- **Generate JSON-LD entirely in TypeScript at build time and emit a static JSON.** Rejected: product data is dynamic per page; static emission doesn't work.
- **Rely on Horizon's existing JSON-LD alone.** Rejected: coverage is incomplete (e.g., collection `ItemList` not emitted, FAQ never emitted), and we have no way to extend it without forking the files.
- **Use a third-party Shopify SEO app for structured data.** Rejected: clients' choices vary; fancyfy aims to work without dependencies on specific apps.
