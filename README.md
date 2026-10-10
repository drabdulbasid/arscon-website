# ARSCON industrial valve website

Responsive, accessible B2B website and small server-side Node.js application for ARSCON, an industrial valve and flow-control business in Dubai, UAE. The website is intentionally honest about missing business and catalogue information: it does not invent products, specifications, prices, stock, certifications, technical capabilities, contact details or submitted enquiries.

## Requirements

- Node.js 22.9 or newer (required for Node.js's built-in optional `.env` loader).
- npm (included with the standard Node.js installer).
- No additional dependencies, CMS, database, cloud account or API credentials are required to run the site.

## Start the website

```powershell
Copy-Item .env.example .env
npm.cmd start
```

Open <http://localhost:3000>. To restart automatically when server files change:

```powershell
npm.cmd run dev
```

`.env` is ignored by Git. The example has no real credentials. You can omit `.env` for local browsing and tests. Keep credentials out of HTML, JavaScript, Git and issue reports.

## Pages and features

- Home, About, Product Catalogue, verified-product details, Industries, Solutions, Technical Resources, Valve Application Assistant, RFQ, Privacy and Cookie Details.
- Original ARSCON visual identity, responsive mobile navigation and original technical illustration. The illustration is conceptual, not an ARSCON product photograph or specification.
- Product search, category filtering, deterministic sorting, verified product comparison (up to three products, with absent data labelled rather than invented), detail pages and related products. A product is shown only if its catalogue record has been approved.
- Preliminary application checker with a rules-only experience and optional server-side AI. Recommendations require exact matches for every supplied requirement against verified catalogue attributes. A qualified engineer must validate safety-critical product selection.
- Validated B2B quotation form with consent, request limits, an anti-spam honeypot, explicit failure states, and an optional local enquiry-draft download.
- ARSCON must authorize and configure a real, owner-controlled HTTPS webhook before RFQ requests are sent. Without it, the server returns an error and explicitly says the request was not sent.
- Search metadata, semantic headings, accessible navigation and forms, focus indication, reduced-motion styling, qualification-aware product schema, sitemap and secure default crawl controls.

The currently empty ARSCON catalogue is intentional. The only sample entries are synthetic fixtures in automated tests; test catalogue products are not shown to site visitors.

## Run checks

```powershell
npm.cmd test
npm.cmd run check
```

The test suite uses Node.js's built-in `node:test` runner; no third-party development or testing packages are installed.

## Content and products

The Node.js service uses separate structured JSON files, not a live CMS, inventory system, database or product feed:

- `src/business-config.json` records supplied business details and null placeholders for facts that ARSCON has not confirmed.
- `src/catalog.json` starts with an empty list of verified products. Only add real details approved by the ARSCON product owner. Each product requires an `id`, `name`, `category` and `"verified": true`. `verified` is an editorial approval gate, not a manufacturer's certificate.
- Supported specification fields are `valveType`, `material`, `pressureClass`, `nominalSize`, `connection`, `operatingPressure`, `operatingTemperature`, `applicableStandards`, `application`, `compatibleMedia`, `industries` and `otherConstraints`.
- Optional manufacturer documents must be approved and stored within `public/documents/`. Optional related product references must point to published IDs.

Only the person responsible for technical accuracy should approve product data, standards, compatibility, ratings, datasheets, certifications and service or inventory claims. For independent business-user editing, the proposed next step is an authenticated, role-controlled headless CMS with approval, content versioning, image/document uploads and backups. No CMS account or editor interface has been configured.

The website does not invent a published email address, contact phone, WhatsApp number, postal address, legal company name, clients, certifications, brand partnerships or project claims. See `docs/CONTENT_VERIFICATION.md` before adding or publishing business information.

## Environment variables

All optional settings are documented in [.env.example](./.env.example). No values in the example are real credentials.

| Variable | Purpose |
|---|---|
| `PORT` | Listening port; defaults to `3000`. |
| `PUBLIC_SITE_URL` | Verified production HTTPS origin, such as `https://www.arscon.example`. Enables domain-qualified canonical metadata, qualified structured data and the sitemap. |
| `AI_API_BASE_URL` | Root URL of an explicitly approved HTTPS OpenAI-compatible provider. |
| `AI_API_KEY` | Private server-side credential; never expose it to the browser. |
| `AI_MODEL` | Model identifier required by the approved provider. |
| `RFQ_WEBHOOK_URL` | Business-owned HTTPS endpoint to which valid, consented enquiries can be delivered. Without this setting, the site refuses the submission. |
| `RFQ_WEBHOOK_TOKEN` | Optional server-only bearer token for the owner-approved RFQ endpoint. |
| `TRUSTED_PROXY_IPS` | Optional, comma-separated IP addresses of explicitly trusted reverse proxies. Set only when the proxy **overwrites**, rather than appends to, `X-Forwarded-For` and supplies one validated client IP. Forwarded addresses from untrusted peers are ignored. |

Enable AI only by configuring **all three** AI variables. Keep them empty for the rule-based mode. Use the deployment provider's protected server-side secret manager for production credentials. Obtain owner and privacy approval before forwarding any enquiries or project information to an external service.

## Deployment and repository

See [deployment and recovery instructions](./docs/DEPLOYMENT.md), the [implementation plan](./docs/IMPLEMENTATION_PLAN.md), the [website audit](./docs/WEBSITE_AUDIT.md) and [required business-content approval](./docs/CONTENT_VERIFICATION.md).

Canonical source repository: [github.com/drabdulbasid/arscon-website](https://github.com/drabdulbasid/arscon-website). Repository source hosting is separate from hosting the live ARSCON website: production hosting, public DNS and domain, paid services, catalogue activation and production credentials still require business-owner authorization. Public deployment needs Node.js 22.9 or newer behind a maintained HTTPS reverse proxy. Read the deployment guide for backup, recovery and rate-limiting boundaries.
