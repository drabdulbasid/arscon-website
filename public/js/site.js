'use strict';

const navigation = [
  ['Home', '/'],
  ['Products', '/products.html'],
  ['Industries', '/industries.html'],
  ['Solutions', '/solutions.html'],
  ['Resources', '/resources.html'],
  ['About', '/about.html'],
  ['Contact', '/contact.html']
];
const iconArrow = '<svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M2 8h11m-4-4 4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const catalogueSelections = new Map();
let availableProducts = new Map();
const comparisonFields = [
  ['valveType', 'Valve type'],
  ['material', 'Material'],
  ['pressureClass', 'Pressure class'],
  ['nominalSize', 'Nominal size'],
  ['connection', 'Connection'],
  ['operatingPressure', 'Operating pressure'],
  ['operatingTemperature', 'Operating temperature'],
  ['applicableStandards', 'Applicable standards'],
  ['application', 'Verified application'],
  ['compatibleMedia', 'Verified compatible media'],
  ['industries', 'Verified industries']
];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const activePath = window.location.pathname.replace(/\/+$/, '') || '/';

function brandMarkup() {
  return '<a class="brand" href="/" aria-label="ARSCON home"><img src="/images/arscon-mark.svg" alt="" width="36" height="36"><span><span class="brand-name">ARSCON</span><span class="brand-note">Industrial flow control</span></span></a>';
}

let categoriesPromise;
function getCategories() {
  categoriesPromise ||= fetch('/api/categories', { headers: { Accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
  return categoriesPromise;
}

function renderHeader() {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;
  const isProducts = activePath === '/products.html' || activePath === '/category.html' || activePath === '/product.html';
  const links = navigation.filter(([label]) => label !== 'Products').map(([label, href]) =>
    `<a href="${href}"${activePath === href ? ' aria-current="page"' : ''}>${label}</a>`
  );
  const dropdown = (`<div class="nav-dropdown"><button class="nav-trigger" type="button" aria-expanded="false" aria-controls="product-menu"${isProducts ? ' data-current="true"' : ''}>Products <svg aria-hidden="true" viewBox="0 0 12 12" fill="none"><path d="m2.5 4.5 3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="mega-menu" id="product-menu" hidden><div class="mega-head"><strong>Product categories</strong><a href="/products.html">All products ${iconArrow}</a></div><div class="mega-grid" data-category-links><a href="/products.html">Browse the catalogue</a></div><p class="mega-note">Proposed categories. Availability is confirmed only by ARSCON.</p></div></div>`);
  const desktopLinks = [links[0], dropdown, ...links.slice(1)].join('');
  const productsMobile = (`<a href="/products.html"${activePath === '/products.html' ? ' aria-current="page"' : ''}>Products</a><div class="mobile-categories" data-category-links-mobile></div>`);
  const mobileLinks = [links[0], productsMobile, ...links.slice(1)].join('');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="header-inner">
      ${brandMarkup()}
      <nav class="desktop-nav" aria-label="Main navigation">${desktopLinks}<a class="button header-cta" href="/quote.html">Request a quote ${iconArrow}</a></nav>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open navigation">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <nav class="site-menu" id="mobile-menu" data-open="false" aria-label="Mobile navigation" inert>${mobileLinks}<a class="button" href="/quote.html">Request a quote ${iconArrow}</a></nav>`;

  const toggle = header.querySelector('.menu-toggle');
  const menu = header.querySelector('.site-menu');
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    menu.dataset.open = String(!isOpen);
    menu.inert = isOpen;
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      menu.dataset.open = 'false';
      menu.inert = true;
    }
  });

  const trigger = header.querySelector('.nav-trigger');
  const mega = header.querySelector('.mega-menu');
  const setMega = (open) => {
    trigger.setAttribute('aria-expanded', String(open));
    mega.hidden = !open;
  };
  trigger.addEventListener('click', () => setMega(mega.hidden));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mega.hidden) { setMega(false); trigger.focus(); }
  });
  document.addEventListener('click', (event) => {
    if (!mega.hidden && !event.target.closest('.nav-dropdown')) setMega(false);
  });
  mega.addEventListener('focusout', (event) => {
    if (!mega.hidden && event.relatedTarget && !event.relatedTarget.closest('.nav-dropdown')) setMega(false);
  });

  getCategories().then((payload) => {
    if (!payload) return;
    const items = payload.categories.map((category) =>
      `<a href="/category.html?slug=${encodeURIComponent(category.slug)}">${escapeHtml(category.name)}</a>`).join('');
    header.querySelector('[data-category-links]').innerHTML = items;
    header.querySelector('[data-category-links-mobile]').innerHTML = items;
  });
}
function renderFooter() {
  const footer = document.querySelector('[data-site-footer]');
  if (!footer) return;
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">${brandMarkup()}<p>Industrial valves and flow-control products from Sharjah, UAE.</p><address class="footer-contact" data-footer-contact></address><ul class="social-list" data-footer-social hidden></ul></div>
        <div class="footer-col"><h2>Explore</h2><div class="footer-links"><a href="/products.html">Product catalogue</a><a href="/industries.html">Applications</a><a href="/solutions.html">Solutions</a><a href="/resources.html">Technical resources</a></div></div>
        <div class="footer-col"><h2>ARSCON</h2><div class="footer-links"><a href="/about.html">About the business</a><a href="/contact.html">Contact</a><a href="/quote.html">Request a quotation</a><a href="/assistant.html">Valve assistant</a></div></div>
        <div class="footer-col"><h2>Information</h2><div class="footer-links"><a href="/privacy.html">Privacy notice</a><a href="/cookies.html">Cookie details</a><button class="cookie-toggle" type="button" data-cookie-settings>Cookie preferences</button><a href="https://github.com/drabdulbasid/arscon-website" target="_blank" rel="noopener noreferrer">GitHub project ${iconArrow}</a></div></div>
      </div>
      <div class="footer-bottom"><span>© <span data-year></span> ARSCON Valves Co. L.L.C · Sharjah, United Arab Emirates</span><span>Product specifications, pricing and availability require written confirmation.</span></div>
    </div>`;
  footer.insertAdjacentHTML('beforeend', `
    <div class="cookie-banner" data-cookie-banner hidden role="region" aria-label="Cookie preferences">
      <h2>Essential preferences only</h2>
      <p>This site uses local storage only to remember your essential cookie preference. No analytics or advertising cookies are configured. <a href="/cookies.html">Cookie details</a>.</p>
      <button class="button" type="button" data-cookie-essential>Continue with essential only</button>
      <button class="cookie-toggle" type="button" data-cookie-close>Close</button>
    </div>`);
  footer.querySelector('[data-year]').textContent = new Date().getFullYear();
  loadContactDetails();
}

function renderBreadcrumbs() {
  const target = document.querySelector('[data-breadcrumbs]');
  if (!target) return;
  const pageName = document.querySelector('main')?.dataset.pageName;
  if (!pageName || pageName === 'Home') return;
  target.className = 'container breadcrumb-wrap';
  target.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(pageName)}</span></nav>`;
}

async function loadStructuredData() {
  try {
    const response = await fetch('/api/site', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const business = await response.json();
    if (!business.website) return;

    const canonicalUrl = new URL(window.location.pathname, business.website);
    if (window.location.pathname === '/product.html') {
      const productId = new URLSearchParams(window.location.search).get('id');
      if (productId) canonicalUrl.searchParams.set('id', productId);
    }
    if (window.location.pathname === '/category.html') {
      const slug = new URLSearchParams(window.location.search).get('slug');
      if (slug) canonicalUrl.searchParams.set('slug', slug);
      await getCategories();
    }
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = canonicalUrl.href;
    document.head.append(canonical);
    const graph = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: business.name,
      url: business.website,
      legalName: business.legalName || undefined,
      email: business.email || undefined,
      telephone: business.phone || undefined,
      sameAs: business.social?.length ? business.social.map((item) => item.url) : undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address || undefined,
        addressLocality: 'Sharjah',
        addressCountry: 'AE'
      }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(graph);
    document.head.append(script);
    const pageName = document.querySelector('main')?.dataset.pageName;
    if (pageName && pageName !== 'Home') {
      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${business.website}/` },
          { '@type': 'ListItem', position: 2, name: pageName, item: canonicalUrl.href }
        ]
      });
      document.head.append(breadcrumbScript);
    }
    const image = document.createElement('meta');
    image.setAttribute('property', 'og:image');
    image.content = `${business.website}/images/valve-illustration.svg`;
    document.head.append(image);
    const imageAlt = document.createElement('meta');
    imageAlt.setAttribute('property', 'og:image:alt');
    imageAlt.content = 'Original conceptual illustration; not a verified ARSCON product.';
    document.head.append(imageAlt);
  } catch {
    // SEO metadata remains optional when no public domain is configured.
  }
}

async function loadCatalogue(search = '', category = '', sorting = 'name-asc') {
  const list = document.querySelector('[data-catalog-results]');
  if (!list) return;
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (category) params.set('category', category);
  params.set('sort', sorting);
  const response = await fetch(`/api/catalog?${params}`, { headers: { Accept: 'application/json' } });
  const payload = await response.json();

  if (!response.ok) throw new Error(payload.error || 'The catalogue could not be loaded.');
  const categoryField = document.querySelector('[data-catalog-search] select[name="category"]');
  if (categoryField) {
    const selectedCategory = categoryField.value;
    categoryField.replaceChildren(
      new Option('All categories', ''),
      ...payload.categories.map((name) => new Option(name, name))
    );
    categoryField.value = payload.categories.includes(selectedCategory) ? selectedCategory : '';
  }
  if (!payload.products.length) {
    availableProducts = new Map();
    list.innerHTML = `<div class="catalog-empty"><h3>No verified products are published yet.</h3><p>${escapeHtml(payload.notice)} Our team can only confirm product details after the product owner provides approved catalogue data.</p><a class="button" href="/quote.html">Describe your requirement ${iconArrow}</a></div>`;
    renderProductComparison();
    return;
  }
  availableProducts = new Map(payload.products.map((product) => [product.id, product]));
  list.innerHTML = payload.products.map((product) => `
    <article class="card" data-catalog-product="${escapeHtml(product.id)}">
      <span class="card-index">${escapeHtml(product.category)}</span>
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(product.summary || 'Verified product reference. Confirm complete specifications, application suitability and commercial terms directly with ARSCON.')}</p>
      <a class="text-link" href="/product.html?id=${encodeURIComponent(product.id)}">Product details ${iconArrow}</a>
      <button class="comparison-button" type="button" data-compare-product="${escapeHtml(product.id)}" aria-pressed="${catalogueSelections.has(product.id)}"${!catalogueSelections.has(product.id) && catalogueSelections.size >= 3 ? ' disabled' : ''}>${catalogueSelections.has(product.id) ? 'Remove from comparison' : 'Add to comparison'}</button>
    </article>`).join('');
  renderProductComparison();
}

function syncComparisonButtons() {
  document.querySelectorAll('[data-compare-product]').forEach((button) => {
    const isSelected = catalogueSelections.has(button.dataset.compareProduct);
    button.setAttribute('aria-pressed', String(isSelected));
    button.disabled = !isSelected && catalogueSelections.size >= 3;
    button.textContent = isSelected ? 'Remove from comparison' : 'Add to comparison';
  });
}

function renderProductComparison() {
  const tray = document.querySelector('[data-comparison]');
  if (!tray) return;
  const selectedProducts = [...catalogueSelections.values()];
  tray.hidden = selectedProducts.length === 0;
  if (!selectedProducts.length) {
    tray.innerHTML = '';
    syncComparisonButtons();
    return;
  }
  const header = selectedProducts.map((product) =>
    `<th scope="col">${escapeHtml(product.name)}<br><button type="button" class="cookie-toggle comparison-remove" data-remove-comparison="${escapeHtml(product.id)}">Remove</button></th>`
  ).join('');
  const rows = comparisonFields.map(([field, label]) =>
    `<tr><th scope="row">${label}</th>${selectedProducts.map((product) =>
      `<td>${escapeHtml(product.specifications?.[field] || 'Not provided in the verified ARSCON catalogue.')}</td>`
    ).join('')}</tr>`
  ).join('');
  const limitMessage = selectedProducts.length >= 3
    ? '<p class="fine-print" role="status">Three verified products are selected, the comparison limit. Remove a product before adding another.</p>'
    : '<p class="fine-print">Only expressly provided, verified catalogue attributes can be compared. Missing data is not an assumption.</p>';
  tray.innerHTML = `<h3>Compare verified products</h3>${limitMessage}<table class="comparison-table"><caption class="visually-hidden">Verified and documented attributes of the selected valve products</caption><thead><tr><th scope="col">Attribute</th>${header}</tr></thead><tbody>${rows}</tbody></table>`;
  tray.querySelectorAll('[data-remove-comparison]').forEach((button) => {
    button.addEventListener('click', () => {
      catalogueSelections.delete(button.dataset.removeComparison);
      renderProductComparison();
    });
  });
  syncComparisonButtons();
}

function initProductDetails() {
  const details = document.querySelector('[data-product-details]');
  if (!details) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const result = document.querySelector('[data-product-result]');
  if (!id || id.length > 120) {
    result.innerHTML = '<div class="notice-band"><strong>No product selected.</strong><p>Open a product from the verified catalogue to view its approved information.</p><a class="text-link" href="/products.html">Return to the catalogue →</a></div>';
    return;
  }
  fetch(`/api/catalog/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } })
    .then(parseApiResponse)
    .then(({ product, relatedProducts }) => {
      document.title = `${product.name} | ARSCON`;
      document.querySelector('meta[name="description"]')?.setAttribute(
        'content',
        product.summary || `Verified catalogue information for ${product.name}. Confirm all product specifications and application suitability directly with ARSCON.`
      );
      const specifications = [
        ['valveType', 'Valve type'],
        ['material', 'Material'],
        ['pressureClass', 'Pressure class'],
        ['nominalSize', 'Nominal size'],
        ['connection', 'End connection'],
        ['operatingPressure', 'Operating pressure'],
        ['operatingTemperature', 'Operating temperature'],
        ['applicableStandards', 'Applicable standards'],
        ['application', 'Verified intended application'],
        ['compatibleMedia', 'Documented compatible media'],
        ['industries', 'Verified industries'],
        ['otherConstraints', 'Verified application constraints']
      ];
      const rows = specifications
        .map(([field, label]) => `<tr><th scope="row">${label}</th><td>${escapeHtml(product.specifications[field] || 'Not provided in the verified ARSCON catalogue.')}</td></tr>`)
        .join('');
      const datasheet = product.datasheetUrl
        ? `<a class="text-link" href="${escapeHtml(product.datasheetUrl)}" target="_blank" rel="noopener noreferrer">View approved product datasheet ${iconArrow}</a>`
        : '<p class="fine-print">No approved datasheet has been supplied for this product.</p>';
      const related = relatedProducts.length
        ? `<h3>Related verified products</h3><ul>${relatedProducts.map((item) => `<li><a href="/product.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a></li>`).join('')}</ul>`
        : '';
      result.innerHTML = `
        <div class="split-grid">
          <div>
            <div class="product-image"><img src="${escapeHtml(product.image || '/images/valve-illustration.svg')}" width="900" height="760" alt="${escapeHtml(product.image ? (product.imageAlt || product.name) : 'Conceptual illustration; not a photograph of ' + product.name + '.')}"></div>
            <p class="fine-print trust-top">Illustrative artwork only; not a photograph of this product.</p>
          </div>
          <div>
            <p class="eyebrow">${escapeHtml(product.category)}</p>
            <h1>${escapeHtml(product.name)}</h1>
            <p class="lead">${escapeHtml(product.summary || 'Verified ARSCON catalogue reference.')}</p>
            <div class="disclosure"><strong>Verify before specifying.</strong> Published product data does not replace review of the current manufacturer documentation, project requirements and service conditions. Obtain confirmation of suitability, availability, price and delivery directly from ARSCON.</div>
            <table class="product-specs space-top-lg"><caption class="visually-hidden">Verified product specifications</caption><tbody>${rows}</tbody></table>
            <div class="form-actions">${datasheet}<a class="button" href="/quote.html?product=${encodeURIComponent(product.id)}">Enquire about this product →</a></div>
            ${related}
          </div>
        </div>`;
      const breadcrumb = document.querySelector('[data-breadcrumbs] .breadcrumbs [aria-current="page"]');
      if (breadcrumb) {
        breadcrumb.textContent = product.name;
        const breadcrumbSchema = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .map((element) => {
            try {
              return JSON.parse(element.textContent);
            } catch {
              return null;
            }
          })
          .find((data) => data?.['@type'] === 'BreadcrumbList');
        if (breadcrumbSchema?.itemListElement?.[1]) {
          breadcrumbSchema.itemListElement[1].name = product.name;
          breadcrumbSchema.itemListElement[1].item = canonicalUrlForProduct(product.id);
          const breadcrumbElement = [...document.querySelectorAll('script[type="application/ld+json"]')]
            .find((element) => {
              try {
                return JSON.parse(element.textContent)?.['@type'] === 'BreadcrumbList';
              } catch {
                return false;
              }
            });
          if (breadcrumbElement) breadcrumbElement.textContent = JSON.stringify(breadcrumbSchema);
        }
      }
      const structuredData = document.createElement('script');
      structuredData.type = 'application/ld+json';
      structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        category: product.category,
        ...(product.summary ? { description: product.summary } : {})
      });
      document.head.append(structuredData);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${product.name} | ARSCON`);
      document.querySelector('meta[property="og:description"]')?.setAttribute(
        'content',
        product.summary || `Verified catalogue information for ${product.name}. Confirm all product specifications and application suitability directly with ARSCON.`
      );
    })
    .catch((error) => {
      result.innerHTML = `<div class="catalog-empty"><h2>No verified product record found.</h2><p>${escapeHtml(error.message)}</p><a class="button" href="/products.html">Return to the catalogue →</a></div>`;
    });
}

function canonicalUrlForProduct(productId) {
  const canonical = document.querySelector('link[rel="canonical"]');
  const url = new URL(canonical?.href || `${window.location.origin}/product.html`);
  url.searchParams.set('id', productId);
  return url.href;
}

function initCatalogue() {
  const form = document.querySelector('[data-catalog-search]');
  if (!form) return;
  const status = document.querySelector('[data-catalog-status]');
  const query = form.querySelector('input[name="q"]');
  const category = form.querySelector('select[name="category"]');
  const sorting = form.querySelector('select[name="sort"]');
  const runSearch = async () => {
    status.textContent = 'Updating catalogue results…';
    try {
      await loadCatalogue(query.value.trim(), category.value, sorting.value);
      status.textContent = '';
    } catch {
      status.textContent = 'The catalogue could not be loaded. Please try again.';
    }
  };
  form.addEventListener('submit', (event) => { event.preventDefault(); runSearch(); });
  category.addEventListener('change', runSearch);
  sorting.addEventListener('change', runSearch);
  document.querySelector('[data-catalog-results]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-compare-product]');
    if (!button) return;
    const product = availableProducts.get(button.dataset.compareProduct);
    if (!product) return;
    if (catalogueSelections.has(product.id)) catalogueSelections.delete(product.id);
    else if (catalogueSelections.size < 3) catalogueSelections.set(product.id, product);
    renderProductComparison();
  });
  loadCatalogue('', '', sorting.value).catch(() => { status.textContent = 'The catalogue could not be loaded. Please try again.'; });
}

function renderRfqStatus(form, message, error = false) {
  const status = form.querySelector('[data-form-status]');
  status.textContent = message;
  status.classList.toggle('status-error', error);
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.error || 'The request could not be completed.'), { payload });
  return payload;
}

function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach((element) => element.remove());
  form.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
}

function showFieldErrors(form, errors) {
  for (const [name, message] of Object.entries(errors || {})) {
    const field = form.elements.namedItem(name);
    if (!field || !('setAttribute' in field)) continue;
    field.setAttribute('aria-invalid', 'true');
    const error = document.createElement('span');
    error.className = 'field-error';
    error.textContent = message;
    field.closest('.form-field, .checkbox-row')?.append(error);
  }
}

function formDataObject(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const consent = form.elements.namedItem('consent');
  if (consent instanceof HTMLInputElement && consent.type === 'checkbox') values.consent = consent.checked;
  return values;
}

function initRfqForm() {
  const form = document.querySelector('[data-rfq-form]');
  if (!form) return;
  const requirementsField = form.elements.namedItem('productRequirements');
  const product = new URLSearchParams(window.location.search).get('product');
  if (product && requirementsField && !requirementsField.value) {
    requirementsField.value = `Please provide verified information for catalogue reference: ${product}`;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    renderRfqStatus(form, 'Submitting your enquiry…');
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const response = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formDataObject(form))
      });
      const result = await parseApiResponse(response);
      renderRfqStatus(form, result.message || 'Your enquiry was accepted.');
      form.reset();
    } catch (error) {
      showFieldErrors(form, error.payload?.fields);
      renderRfqStatus(form, error.message, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  form.querySelector('[data-download-draft]')?.addEventListener('click', () => {
    const data = formDataObject(form);
    delete data.consent;
    delete data.website;
    const lines = Object.entries(data)
      .filter(([, value]) => String(value).trim())
      .map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}: ${value}`);
    const contents = `ARSCON — Preliminary RFQ draft (not submitted)\n\n${lines.join('\n')}\n\nThis local draft has not been sent to ARSCON. Confirm business contact details and submission configuration before sending project information.`;
    const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'arscon-rfq-draft.txt';
    link.click();
    URL.revokeObjectURL(link.href);
    renderRfqStatus(form, 'A local draft was downloaded. It has not been sent to ARSCON.');
  });
}

function initAssistant() {
  const form = document.querySelector('[data-assistant-form]');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const resultElement = document.querySelector('[data-assistant-result]');
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    resultElement.innerHTML = '<p role="status">Reviewing the supplied application information…</p>';
    try {
      const response = await fetch('/api/assistant/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formDataObject(form))
      });
      const result = await parseApiResponse(response);
      const questions = result.clarificationQuestions.map(({ question }) => `<li>${escapeHtml(question)}</li>`).join('');
      const missing = result.missingInformation.map(({ label }) => escapeHtml(label)).join(', ');
      const products = result.recommendedProducts.length
        ? `<h3>Verified catalogue matches</h3><ul>${result.recommendedProducts.map((product) => `<li>${escapeHtml(product.name)} — ${escapeHtml(product.category)}</li>`).join('')}</ul>`
        : '<p>No verified products are available for matching.</p>';
      resultElement.innerHTML = `<span class="assistant-tag">${result.mode === 'assisted' ? 'AI-assisted preliminary review' : 'Rule-based specification check'}</span><h3>Preliminary review</h3><p>${escapeHtml(result.summary)}</p>${missing ? `<p><strong>Missing details:</strong> ${missing}</p>` : ''}${questions ? `<h3>Useful follow-up questions</h3><ul>${questions}</ul>` : ''}${products}<div class="disclosure"><strong>Important:</strong> ${escapeHtml(result.notice)}</div><p><a class="text-link" href="/quote.html">Prepare an RFQ ${iconArrow}</a></p>`;
      resultElement.focus();
    } catch (error) {
      showFieldErrors(form, error.payload?.fields);
      resultElement.innerHTML = `<p class="status-error" role="alert">${escapeHtml(error.message)}</p>`;
    } finally {
      button.disabled = false;
    }
  });
}

function initCookies() {
  const panel = document.querySelector('[data-cookie-banner]');
  if (!panel) return;
  const choiceKey = 'arscon-cookie-choice';
  let hasChoice = false;
  try {
    hasChoice = Boolean(localStorage.getItem(choiceKey));
  } catch {
    hasChoice = false;
  }
  panel.hidden = hasChoice;
  panel.querySelector('[data-cookie-essential]').addEventListener('click', () => {
    try {
      localStorage.setItem(choiceKey, 'essential-only');
    } catch {
      panel.querySelector('p').textContent = 'Your preference applies for this visit but could not be saved in this browser.';
    }
    panel.hidden = true;
  });
  panel.querySelector('[data-cookie-close]').addEventListener('click', () => { panel.hidden = true; });
  document.querySelector('[data-cookie-settings]')?.addEventListener('click', () => {
    const wasHidden = panel.hidden;
    try {
      localStorage.removeItem(choiceKey);
    } catch {
      if (wasHidden) panel.hidden = false;
    }
    if (wasHidden) panel.hidden = false;
    if (!panel.hidden) panel.querySelector('[data-cookie-essential]').focus();
  });
}

function categoryHref(category) {
  return `/category.html?slug=${encodeURIComponent(category.slug)}`;
}

function categoryCard(category) {
  const count = category.productCount
    ? `${category.productCount} verified ${category.productCount === 1 ? 'product' : 'products'}`
    : 'Catalogue category';
  return `<a class="media-card" href="${categoryHref(category)}">
    <span class="media-card-image"><img src="${escapeHtml(category.image)}" width="480" height="340" loading="lazy" alt="${escapeHtml(category.imageAlt)}"></span>
    <span class="media-card-body"><span class="media-card-tag">${escapeHtml(count)}</span><strong>${escapeHtml(category.name)}</strong><span class="media-card-text">${escapeHtml(category.description)}</span><span class="media-card-link">View category ${iconArrow}</span></span>
  </a>`;
}

function productCard(product) {
  return `<article class="card" data-catalog-product="${escapeHtml(product.id)}">
    ${product.image ? `<span class="product-card-image"><img src="${escapeHtml(product.image)}" width="360" height="240" loading="lazy" alt="${escapeHtml(product.imageAlt || product.name)}"></span>` : ''}<span class="card-index">${escapeHtml(product.category)}</span>
    <h3>${escapeHtml(product.name)}</h3>
    <p>${escapeHtml(product.summary || 'Verified product reference. Confirm complete specifications, application suitability and commercial terms directly with ARSCON.')}</p>
    <a class="text-link" href="/product.html?id=${encodeURIComponent(product.id)}">Product details ${iconArrow}</a>
  </article>`;
}

function emptyCatalogueMarkup(heading, message) {
  return `<div class="catalog-empty"><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(message)}</p><a class="button" href="/quote.html">Describe your requirement ${iconArrow}</a></div>`;
}

function initCategoryGrids() {
  const grids = document.querySelectorAll('[data-category-grid]');
  if (!grids.length) return;
  getCategories().then((payload) => {
    grids.forEach((grid) => {
      grid.innerHTML = payload
        ? payload.categories.map(categoryCard).join('')
        : '<div class="catalog-empty"><h3>Categories could not be loaded.</h3><p>Please refresh the page or use the catalogue link.</p><a class="button" href="/products.html">Open the catalogue</a></div>';
    });
  });
}

function initFeaturedProducts() {
  const target = document.querySelector('[data-featured-products]');
  if (!target) return;
  fetch('/api/catalog?sort=name-asc', { headers: { Accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('unavailable'))))
    .then((payload) => {
      target.innerHTML = payload.products.length
        ? `<div class="card-grid">${payload.products.slice(0, 3).map(productCard).join('')}</div>`
        : emptyCatalogueMarkup('Featured products are not available yet.', 'ARSCON has not yet supplied approved product records, so no product is presented as available or specified.');
    })
    .catch(() => {
      target.innerHTML = emptyCatalogueMarkup('Featured products could not be loaded.', 'Please try again shortly or contact ARSCON through the enquiry form.');
    });
}

function initCategoryPage() {
  const page = document.querySelector('[data-category-page]');
  if (!page) return;
  const slug = new URLSearchParams(window.location.search).get('slug') || '';
  const hero = page.querySelector('[data-category-hero]');
  const results = page.querySelector('[data-category-products]');
  const others = page.querySelector('[data-category-others]');
  getCategories().then((payload) => {
    const category = payload?.categories.find((item) => item.slug === slug);
    if (!payload || !category) {
      hero.innerHTML = '<div class="container"><p class="eyebrow">Category not found</p><h1>This category is <span class="serif-accent">not available.</span></h1><p class="lead">Choose one of the product categories below.</p></div>';
      results.innerHTML = '';
      if (payload) others.innerHTML = payload.categories.map(categoryCard).join('');
      return;
    }
    document.title = `${category.name} | ARSCON Industrial Valves`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${category.description} Product availability and specifications are published only after ARSCON verification.`);
    page.dataset.pageName = category.name;
    const crumbs = document.querySelector('[data-breadcrumbs]');
    crumbs.className = 'container breadcrumb-wrap';
    crumbs.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/products.html">Products</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(category.name)}</span></nav>`;
    hero.innerHTML = `<div class="container category-hero-grid">
      <div><p class="eyebrow">Product category</p><h1>${escapeHtml(category.title)}</h1><p class="lead">${escapeHtml(category.description)}</p>
      <div class="hero-actions"><a class="button" href="/quote.html">Request a quotation ${iconArrow}</a><a class="button button-outline" href="/assistant.html">Check your specifications ${iconArrow}</a></div>
      <p class="hero-note">Catalogue photos are illustrative; confirm specifications and availability with ARSCON.</p></div>
      <div class="category-hero-image"><img src="${escapeHtml(category.image)}" width="480" height="340" alt="${escapeHtml(category.imageAlt)}"></div></div>`;
    others.innerHTML = payload.categories.filter((item) => item.slug !== slug).map(categoryCard).join('');

    const search = page.querySelector('[data-category-search]');
    const input = search.querySelector('input[name="q"]');
    const load = async () => {
      const params = new URLSearchParams({ category: category.name, sort: 'name-asc' });
      if (input.value.trim()) params.set('q', input.value.trim());
      try {
        const response = await fetch(`/api/catalog?${params}`, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('unavailable');
        const catalogue = await response.json();
        search.hidden = !catalogue.products.length && !input.value.trim();
        results.innerHTML = catalogue.products.length
          ? `<div class="card-grid">${catalogue.products.map(productCard).join('')}</div>`
          : emptyCatalogueMarkup(input.value.trim() ? 'No verified products match your search.' : `No verified ${category.name.toLowerCase()} are published yet.`, 'Product records appear here only after ARSCON confirms and approves them. You can still describe your requirement for the team to review.');
      } catch {
        results.innerHTML = emptyCatalogueMarkup('Products could not be loaded.', 'Please try again shortly or use the enquiry form.');
      }
    };
    search.addEventListener('submit', (event) => { event.preventDefault(); load(); });
    load();
  });
}

function initProductCategoryChips() {
  const target = document.querySelector('[data-category-chips]');
  if (!target) return;
  getCategories().then((payload) => {
    if (!payload) return;
    target.innerHTML = payload.categories.map((category) => `<a class="chip" href="${categoryHref(category)}">${escapeHtml(category.name)}</a>`).join('');
  });
}

renderHeader();
renderFooter();
renderBreadcrumbs();
initCategoryPage();
loadStructuredData();
initCategoryGrids();
initFeaturedProducts();
initProductCategoryChips();
initCatalogue();
initProductDetails();
initRfqForm();
initAssistant();
initCookies();

function socialIcon(name) {
  return escapeHtml(name.slice(0, 2).toUpperCase());
}

async function loadContactDetails() {
  let site;
  try {
    const response = await fetch('/api/site', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    site = await response.json();
  } catch {
    return;
  }
  const tel = site.phone ? site.phone.replace(/[^\d+]/g, '') : '';
  const rows = [
    site.phone && `<a href="tel:${escapeHtml(tel)}">${escapeHtml(site.phone)}</a>`,
    site.email && `<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a>`,
    site.publicWebsite && `<a href="${escapeHtml(site.publicWebsite)}" rel="noopener noreferrer">${escapeHtml(site.publicWebsite.replace(/^https?:\/\//, ''))}</a>`,
    site.address && `<span>${escapeHtml(site.address)}</span>`
  ].filter(Boolean);
  const list = rows.map((row) => `<span class="contact-row">${row}</span>`).join('');
  const footerContact = document.querySelector('[data-footer-contact]');
  if (footerContact) footerContact.innerHTML = list;
  const card = document.querySelector('[data-contact-details]');
  if (card) card.innerHTML = `<h3>${escapeHtml(site.legalName || site.name)}</h3>${site.legalNameArabic ? `<p lang="ar" dir="rtl">${escapeHtml(site.legalNameArabic)}</p>` : ''}${list}`;
  const links = (site.social || []).map((item) => `<li><a class="social-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="ARSCON on ${escapeHtml(item.platform)}">${socialIcon(item.platform)}<span class="visually-hidden">${escapeHtml(item.platform)}</span></a></li>`).join('');
  document.querySelectorAll('[data-footer-social], [data-social-list]').forEach((el) => { el.innerHTML = links; el.hidden = !links; });
  const block = document.querySelector('[data-social-block]');
  if (block) block.hidden = !links;
}
