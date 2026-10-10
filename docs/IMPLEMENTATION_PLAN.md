# ARSCON website implementation plan

Initial approved scope: build and verify a professional, honest, maintainable ARSCON website, retain the supplied project brief and associate the working directory and source with the specifically requested `drabdulbasid/arscon-website` GitHub repository. The request authorizes repository source delivery. Deployment of a live public website, paid services or DNS changes were not authorized.

## Repository review

- Retrieved the specified GitHub repository and inspected its `main` branch and existing `README.md`. The repository had a single introductory README and no framework, application source, dependencies, catalogue, tests, deployment setup, website, backend, CMS or business assets.
- Confirmed the supplied working directory was not a Git checkout, while its contents included the user's `arsconvalve.md`. Initialized a local Git checkout, fetched the existing repository and checked out `main`; kept the original project brief in place as an untracked local file.
- Reviewed `arsconvalve.md` and used its requirements for functionality, factual integrity, accessibility, security, SEO, integrations, documentation and deployment readiness.
- Attempted to open the publicly accessible reference `https://matvalve.com/`; the integrated browser request timed out. A public content fetch returned an excerpt describing after-sales support. The ARSCON website does not claim that capability or copy the reference's identity, assets or written content.
- Checked installed Git, Node.js, npm and Claude tooling. Node.js 24 and npm are available. A `claude` executable is unavailable; no Claude-specific skill or plugin was installed.

## Delivery stages

1. Preserve the original project brief and existing repository history; configure and inspect the selected Git remote; deliver the source to the user-designated project.
2. Create an original ARSCON design, responsive user interface, accessible navigation, original artwork and complete informational/business website pages.
3. Implement a server-side Node.js layer for a separately structured, approval-gated product catalogue, safe search and product-detail delivery.
4. Build a rules-based application-assistance service and optional HTTPS-only external AI. Allow product recommendations only for exact, approved matches against every project requirement supplied.
5. Build a validated, rate-limited B2B RFQ with visible consent, confirmed delivery states, secure optional server-side webhook integration and explicit refusal until configured.
6. Prepare business, catalogue, privacy, deployment, operating and recovery documentation.
7. Add and run automated HTTP and input-validation tests; run all JavaScript syntax checks; fix test failures before delivery.

## Implementation outcome

All website pages, the responsive design system, structured server-side JSON files, Node.js service, optional integration interfaces, accessibility-conscious browser interactions, sitemap, security controls and automated tests have been implemented and delivered to the specified source repository. No framework, vendor package, CMS, database, persistent request store, inventory/order/invoice/payment service, business email or phone, outside AI, third-party analytics, live public domain or hosting subscription has been configured.

## Required production steps

Before live launch, ARSCON must verify the business identity, content, business contacts, legal text, customer-data processing, real catalogue and manufacturer documents; review a future CMS or data-editing policy; and approve and test the receiving webhook and optional AI provider. Configure production hosting, HTTPS, monitoring, durable encrypted backups and a public domain. Live website deployment and DNS changes require separate authorization.


## Premium redesign plan (reference-led, original identity)

Reference: matvalve.com. Only its general structure (header with product menu, hero, product-category grid, featured products, industries, services, company introduction, quotation CTA, footer) informs this work. No text, logo, imagery or visual identity is copied. The public fetch tool returned only page metadata and one text excerpt, so layout inferences are broad and unverified at pixel level.

Framework decision: the project stays on its existing dependency-free Node.js stack (static HTML, CSS, JavaScript and a JSON API). It is working and tested; a Next.js migration would rewrite working code and add dependencies. This is reversible: the JSON data files (`src/taxonomy.json`, `src/catalog.json`) are framework-independent and can be reused. Please confirm if you want a Next.js migration as a separate stage.

| Stage | Scope | Status |
| --- | --- | --- |
| 1 | Audit, plan, category taxonomy data, 13 original category illustrations, header product menu, homepage categories grid, featured-products empty state, company intro, reusable category pages, contact page, sitemap entries, tests | Done |
| 2 | Hero and section visual polish, industry/service pages, category filters once catalogue data exists | Pending |
| 3 | Verified catalogue import, approved product photography, structured product data | Needs ARSCON data and image permissions |
| 4 | Full QA pass, accessibility audit, performance review, production hosting | Pending; needs explicit approval to deploy |

Stage 1 files created: `src/taxonomy.json`, `public/category.html`, `public/contact.html`, `public/images/categories/*.svg`, `docs/IMAGE_ASSET_REGISTER.md`.
Stage 1 files modified: `server.js`, `public/js/site.js`, `public/css/site.css`, `public/index.html`, `public/products.html`, `test/server.test.js`, and the docs.
