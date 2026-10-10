# Website and repository audit

## Scope inspected

- Supplied source brief: `arsconvalve.md`.
- GitHub repository: `https://github.com/drabdulbasid/arscon-website`.
- Current upstream branch: `main`.
- Upstream content: one introductory `README.md`; no application.
- Original working directory: only the user-provided `arsconvalve.md`; it had no Git checkout.
- Competitor/reference URL: `https://matvalve.com/`.
- Available tooling: Windows PowerShell, Git, Node.js v24 and npm. Claude CLI is not installed or available.

## Original state and preservation

The original upstream repository contained no functioning site, server, product data, routes, services, framework, dependency manifest, content-management system, customer details, contacts, media files, deployment configuration, tests or products. Its introductory README has been retained and expanded, not discarded. The project brief is preserved at the working-tree root. The repository was initialized locally; the original `main` branch was fetched and set as upstream. No source was pushed or committed.

No inventory, order fulfilment, invoicing, payment, verified catalogue, business email, phone, WhatsApp, legal-entity name, office address, manufacturer, certification, client, capability, statistic or engineering record was available. The resulting site does not imply any of these facts are verified.

## Reference review

The integrated browser could not load the reference site before its timeout. A public content fetch returned a limited passage about after-sales support. It is not evidence that ARSCON provides after-sales support. The ARSCON site makes no such claim. Its palette and identity are independent; the valve graphic is original and is expressly marked as conceptual, not a real product.

## Implemented architecture

- Dependency-free Node.js HTTP application with static HTML/CSS/JavaScript and HTTP JSON API.
- `src/business-config.json` for known identity facts and placeholders for missing information.
- `src/catalog.json` as a separate, initially empty product catalogue; server and browser expose only entries approved with an explicit verification flag.
- Search, filtering, sorting, individual product pages, related-product links, approved-document link controls and specification-missing disclosures.
- Ten informational and transactional pages covering home, catalogue, product details, industry applications, project support, resources, about, assistant, quotation, privacy and cookie preferences.
- Working rule-based requirement collection and missing-field discovery, with deterministic product matching across every specification supplied by the user. An optional, provider-independent server-side AI request is subject to final deterministic catalogue eligibility checks.
- Input-validated RFQ with consent, required business/contact/destination/product/quantity fields, optional delivery date and notes, an anti-spam honeypot, rate limits, explicit errors and local `.txt` draft. Live forwarding requires the owner-approved HTTPS webhook.
- Restrictive same-origin CSP, anti-framing/content-sniffing/referrer and permissions response headers, request-size limits, error responses without sensitive fields, outbound timeouts, redirect refusal and private server credentials.
- SEO metadata, relevant industrial search-intent copy without unsupported claims, HTTPS-origin-qualified canonical URL and sitemap, accurate organization/breadcrumb/product structured data when eligible, and safe `robots.txt` when production is not yet configured.
- Accessible semantic headings, a skip link, keyboard-operable responsive navigation, form labels, status output, visible focus, descriptive alternative text, reduced-motion CSS and responsive layout.
- Browser local storage only for an optional essential-only preference. No analytics, advertising pixels, machine translation or tracking service.
- Automated Node.js tests for document endpoints, headers, product data integrity, exact-match suitability, malformed user input, rate limits, assistant behavior, webhook success/failure, crawlability and structured external-service configuration.

## Limitations and production risks

- This is not a populated ARSCON catalogue, ecommerce/order/purchase, live inventory, invoice/payment, customer administration, hosted service, CMS, CRM, persistent RFQ inbox or legal-reviewed/privacy-certified site.
- The catalogue remains empty pending owner approval. No approved product datasheet, case study, CMS account or commercial product data has been supplied.
- Attachments are intentionally not accepted. Accepting uploads needs a protected business-owned storage service, inspection, access controls, retention and malware scanning.
- AI and RFQ endpoints remain disabled absent owner-controlled credentials or a destination. RFQs are not silently collected, redirected, sent to a personal email or described as successful.
- The in-memory rate limit is a single-process supplementary safeguard. Public deployment needs HTTPS enforcement, a protected host/reverse proxy, central rate limiting for multiple instances, security updates, controlled operational logging, monitoring, encrypted external secret storage and restricted platform access.
- The website source repository was the expressly selected delivery target and is separate from a publicly hosted site. No live site hosting, registered domain or DNS change was authorized or configured.
- A separately synced `ARSCON PROFILE.pdf` is present in the local Windows working directory. Its contents and permitted use have not been reviewed; it has not been used as a source for business or technical claims and has not been copied into the public website.

## Tooling and reference limitations

No external runtime, build, test, image or font dependencies are used. Claude Code was not installed in the environment, so no Claude skill was available for inspection. No unreviewed remote installer, image provider or machine translation was used. See `docs/CONTENT_VERIFICATION.md` and `docs/DEPLOYMENT.md` for launch blockers and operational requirements.
