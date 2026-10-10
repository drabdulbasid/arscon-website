# Deployment, configuration and recovery

## Current deployment status

**Source delivered; not deployed.** The source repository is `https://github.com/drabdulbasid/arscon-website`. No production host, domain, DNS, TLS certificate, CMS, published catalogue, AI service, RFQ recipient or production credentials have been configured. Live website publication, production service activation and DNS changes require separate ARSCON authorization.

## Start and check locally

Prerequisite: Node.js **22.9 or newer** and npm. The runtime uses Node.js's built-in optional `.env` file support. There are no third-party packages to install.

```powershell
Copy-Item .env.example .env
npm.cmd run check
npm.cmd start
```

Browse <http://localhost:3000>. For local watch-and-restart development:

```powershell
npm.cmd run dev
```

Run only the full automated test suite with `npm.cmd test`. `npm.cmd run check` runs syntax checks for both server and browser JavaScript before running that test suite.

## Production provisioning

1. Obtain written approval of the company/contact details, legal copy, catalogue, datasheets, privacy and RFQ operation in `CONTENT_VERIFICATION.md`.
2. Provision an ARSCON-owned Node.js 22.9+ hosting service with supported system updates, disk and process permissions and enforced HTTPS at a maintained reverse proxy. If the proxy overwrites the incoming `X-Forwarded-For` header with exactly one validated source address, add the proxy peer address (not the user's IP) to `TRUSTED_PROXY_IPS`. Never trust forwarded headers from untrusted peers.
3. Store production secrets exclusively in the host's restricted, encrypted environment or dedicated secrets manager. Keep `.env`, access tokens and enquiry data out of the web root and source control.
4. Set `PUBLIC_SITE_URL` to the verified HTTPS origin only, for example `https://www.arscon.example`. Without it, the sitemap has no crawlable URLs and the default crawler policy denies indexing. Canonical, social and qualified structured data use that approved origin.
5. Add only owner-approved product and legal files. Review the exact production product API output, document paths, product detail rendering and CMS/editorial permissions.
6. Configure and test `RFQ_WEBHOOK_URL` as an ARSCON-owned HTTPS URL using a corresponding optional `RFQ_WEBHOOK_TOKEN`. Confirm delivery into the correct approved business system and assess outage, timeout, retry, access, duplication and retention behaviors before accepting public RFQs. Without the webhook, RFQs return a visible failure and are not presented as sent.
7. Enable AI only after separately approving its endpoint, credentials, model, data-processing region, terms and information transfer. Configure all three `AI_API_BASE_URL`, `AI_API_KEY` and `AI_MODEL`; leave all blank for rule-based assistance. The AI API key must never reach the browser.
8. Run `npm.cmd run check` against the exact release source. Check HTTPS redirect policy, reverse proxy timeouts, static route/MIME handling, security headers, the live crawl policy, catalogue state, RFQ errors/consent, AI failure mode, mobile pages and accessibility using production-like tools.
9. Document each release, responsible owner, secret manager, monitoring escalation and production contact. Enable only ARSCON-approved operational logs, analytics and processors.

## Backup, update and recovery

- Store encrypted, access-controlled backups of approved business data, verified catalogue records, legal content and source using an ARSCON-approved location and retention window.
- Store environment secrets, RFQ requests, customer contact data, deployment logs and backups outside the repository. Restrict access; do not print secret values or submission data in logs.
- Keep future source changes in the authorized review flow and preserve last-known approved releases. A source-control commit is not a backup of any business-owned external system.
- Test recovery from a previous version of the verified catalogue, content, application source, documents and protected service settings in a non-production environment. Recheck domain and certificates before serving live traffic.
- On external-service outage, disable the affected optional service and show an explicit error. Do not silently queue, redirect, discard, resubmit or claim an RFQ was delivered unless an approved persistent storage/retry workflow has been built and verified.
- Review all manufacturer's documents before updating or retracting them. Remove superseded material promptly and confirm there are no stale caches or links.
- Upgrade supported Node.js and hosting security patches; test, restart and verify every active server after code/configuration updates.
- The bundled rate limiter is in-memory and only for one process; it resets during restarts and does not coordinate across multiple instances. The application trusts `X-Forwarded-For` only when its direct peer matches an explicitly configured `TRUSTED_PROXY_IPS` address and the header contains one syntactically valid address. Configure your authorized proxy to overwrite the inbound header. Use the host's centrally managed limiter, bot protection, request/body limits and appropriate monitoring for a distributed or production workload.

## Explicit operational boundaries

The application does not persist RFQs to a database, send email by itself, accept file attachments, support an administration portal, process orders, take card payments, invoice, or synchronize any ERP/catalogue/warehouse. Add those integrations only after selecting a legitimate service and reviewing its business owner, access model, data handling, failure handling, audit trail, privacy, cost and recovery arrangements.
