# ARSCON business content verification

## Publication policy

Business, product, engineering, safety, privacy, legal, inventory and service statements must be approved by the relevant ARSCON business owner before publication. `"verified": true` is an editorial approval gate; it is not a manufacturer-issued certification, technical assurance or substitute for reviewing source documents.

The brief supplied no actual products, product data, manufacturer datasheets, stock, prices, warranty, certifications, project history, named clients, service records, company contact, public business email, phone or WhatsApp. The site does not invent those details.

## Supplied business facts

| Fact | Supplied information |
|---|---|
| Business identity | ARSCON |
| Business activity | Industrial valves and flow-control solutions for B2B customers |
| Business location | Dubai, United Arab Emirates |
| Business direction | The brief mentions business-to-business valve sales, UAE inventory, order and invoicing ambitions; no operational system, catalog, stock or transaction capability has been verified or integrated. |
| Website/domain | Not supplied. Set `PUBLIC_SITE_URL` only after verifying the business-approved HTTPS domain. |
| Business contacts and public address | Not supplied. |

Unknown business facts are kept null or empty in `src/business-config.json`. Customers are never directed to an invented phone, WhatsApp number, personal email address or business location.

## Owner verification checklist

1. **Entity and identity:** Approve the full legal and trading names, jurisdiction, registration identifiers where lawfully appropriate, registered and operating addresses, ARSCON branding and authorized domains.
2. **Customer contact:** Verify published work email, country-code telephone, official business WhatsApp profile if requested, business-hours/time-zone commitment, response policy and contact owner.
3. **Product records:** For every individual model and configuration, verify exact manufacturer/product identifier, valve type, size, end connection, body and trim material, pressure class, temperature range, medium compatibility, service limitations and installation constraints.
4. **Ratings and standards:** Confirm operating versus design conditions, pressure and temperature rating, unit conversions, applicable standards/editions and certificate scope from the current exact-model manufacturer's data. Obtain technical-owner/qualified-engineer approval.
5. **Documentation:** Obtain permission to reproduce current datasheets, name and artwork. Verify edition, model coverage, third-party usage rights, PDF contents, safe link path, revision owner and removal of obsolete materials.
6. **Product availability:** Verify stock feed ownership, real-time update cadence, location, in-stock/reserved/out-of-stock definitions, counts, unit/currency, price validity, minimum order, tax, lead time, handling and return terms before communicating availability or quoting.
7. **Company capabilities:** Establish proof before claiming sector experience, sourcing relationships, engineering, design, material review, quality assurance, maintenance, calibration, inspection, repair, warranty, installation, emergency response, delivery performance or customer testimonials.
8. **Business and transaction security:** Identify and separately authorize all order/inventory/invoice/payment integrations, business owners and failure, reconciliation, audit and rollback workflows before adding transactional features.
9. **RFQ processing:** Choose the real business-owned receiving inbox, CRM or HTTPS endpoint. Test ownership, access roles, transport security, validation, anti-spam limits, uptime, acknowledgment, errors, retention, export, deletion, monitoring, backup and incident handling with approved test records. Do not enable `RFQ_WEBHOOK_URL` until these steps pass.
10. **Third-party AI:** Review provider, account, service/model, data-use/training terms, processing jurisdiction, retention, DPA, traffic, limitations, support and human-review responsibility. Approve and disclose these before setting AI credentials.
11. **Legal and privacy:** Ask an appropriately qualified professional to approve the actual data-controller identity, applicable laws, request consent wording, privacy contact, processors, data location, cross-border disclosures, lawful purpose, retention, rights, incident contact, cookies and publication date.
12. **Images, citations and localization:** Approve copyrights, photo provenance, asset licences, case-study permission, project/customer release and Arabic/English technical translations. Do not publish unreviewed machine-translated standards, legal or safety content.
13. **Accessibility and operational readiness:** Verify real production pages with keyboard and assistive technology, conduct user testing, audit contrast and mobile usability, and approve hosting, HTTPS, backups, restore, vulnerability patching, monitoring and service ownership.

## Catalogue editing

`src/catalog.json` is intentionally empty of ARSCON products. The service publishes only records marked `"verified": true`, with a validated identifier, name and category. Allowed attributes are `valveType`, `material`, `pressureClass`, `nominalSize`, `connection`, `operatingPressure`, `operatingTemperature`, `applicableStandards`, `application`, `compatibleMedia`, `industries` and `otherConstraints`. Related records require real published IDs. Approved datasheets must have authorized document rights and live below `/documents/`.

The assistant can shortlist only products with a separately recorded exact match for **every non-empty requirement** supplied by the visitor. A model name, product description, text similarity or partially matching rating is never proof of suitability. Any discrepancy, unknown value, unit mismatch, missing feature or unsupported compatibility excludes a record. Preliminary suggestions still require engineering validation and written availability confirmation.

There is no non-technical editor or CMS. Use a business-owned, authenticated headless CMS with role-based permissions, review-before-publication, change history, approved asset upload and tested backup/restore if ongoing self-service editing is required. Until authorized and integrated, request technical review for edits to the JSON catalogue or website pages.


## Stage 1 additions: category taxonomy and imagery

ARSCON must confirm before launch:
- Which of the 13 proposed categories in `src/taxonomy.json` it actually supplies, stocks or manufactures; remove or rename the rest. Every category is currently marked `pending-confirmation`.
- That the generic category descriptions are acceptable to publish.
- Approved business telephone, email and address for `/contact.html` and the footer (none are published).
- Approved real product photography, with ownership or written permission, to replace the conceptual illustrations in `public/images/categories/`.
- Per product: valve type, material, pressure class, size, connection, standards, certifications, datasheets, availability and pricing, supplied through `src/catalog.json` with `verified: true`. Nothing is displayed as stocked or specified until then.

## Update: ARSCON Product Catalogue PDF
- Taken from the PDF cover: legal name ARSCON Valves Co. L.L.C (Arabic: ???? ?????? ???????? ?.?.?), phone +971 56 994 1333, email arsconvalves@gmail.com, website www.arsconvalves.com, address Warehouse 2, Next to Al Haaj Ismaiel Al Buraimy Circle, Ind. Area 6, Sharjah, UAE. Owner to confirm.
- The PDF address is in **Sharjah**; earlier copy said Dubai. Site copy now says UAE/Sharjah. Confirm whether a Dubai presence also exists.
- Social media: the PDF lists no handles. Add HTTPS URLs to `social` in `src/business-config.json`; icons appear only for filled entries.
- Catalogue entries (`src/catalog.json`) were transcribed from the PDF. Verify standards and sizes for gate, ball, butterfly and check valves; other entries carry no specifications.
- Unclear PDF text not published: knife edge gate connection wording; forged steel pressure rating (cut off after 1500#).
