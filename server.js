'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');

const ROOT = __dirname;
const PUBLIC_ROOT = path.join(ROOT, 'public');
const DEFAULT_CATALOG = require('./src/catalog.json');
const BUSINESS_CONFIG = require('./src/business-config.json');
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMITS = { '/api/rfq': 6, '/api/assistant/select': 20 };
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};
const REQUIREMENTS = [
  ['application', 'Application or equipment'],
  ['medium', 'Fluid or medium'],
  ['operatingPressure', 'Operating pressure'],
  ['operatingTemperature', 'Operating temperature'],
  ['nominalSize', 'Nominal size'],
  ['connectionType', 'Connection type'],
  ['materialRequirements', 'Material requirements'],
  ['industry', 'Industry or project sector'],
  ['applicableStandards', 'Applicable standards'],
  ['additionalConstraints', 'Other constraints']
];
const REQUIREMENT_TO_SPECIFICATION = {
  application: 'application',
  medium: 'compatibleMedia',
  operatingPressure: 'operatingPressure',
  operatingTemperature: 'operatingTemperature',
  nominalSize: 'nominalSize',
  connectionType: 'connection',
  materialRequirements: 'material',
  industry: 'industries',
  applicableStandards: 'applicableStandards',
  additionalConstraints: 'otherConstraints'
};

function createRateLimiter({ maxEntries = 2000, now = Date.now } = {}) {
  const clients = new Map();

  return function checkLimit(key, limit, windowMs = RATE_WINDOW_MS) {
    const currentTime = now();
    const record = clients.get(key);
    const freshRecord = !record || currentTime - record.startedAt >= windowMs;

    if (clients.size >= maxEntries && !clients.has(key)) {
      for (const [existingKey, value] of clients) {
        if (currentTime - value.startedAt >= windowMs) clients.delete(existingKey);
      }
      if (clients.size >= maxEntries) clients.delete(clients.keys().next().value);
    }

    if (freshRecord) {
      clients.set(key, { count: 1, startedAt: currentTime });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    record.count += 1;
    if (record.count <= limit) return { allowed: true, retryAfterSeconds: 0 };

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((record.startedAt + windowMs - currentTime) / 1000))
    };
  };
}

function readClientAddress(request, environment = process.env) {
  const remoteAddress = request.socket.remoteAddress || 'unknown';
  const trustedProxies = (environment.TRUSTED_PROXY_IPS || '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
  if (!trustedProxies.includes(remoteAddress)) return remoteAddress;

  const forwardedAddress = request.headers['x-forwarded-for'];
  if (typeof forwardedAddress !== 'string' || forwardedAddress.includes(',')) return remoteAddress;
  const normalizedAddress = forwardedAddress.trim();
  return net.isIP(normalizedAddress) ? normalizedAddress : remoteAddress;
}

function setSecurityHeaders(response, contentType) {
  response.setHeader('Content-Type', contentType);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'");
}

function sendJson(response, status, payload, extraHeaders = {}) {
  setSecurityHeaders(response, MIME_TYPES['.json']);
  response.setHeader('Cache-Control', 'no-store');
  for (const [header, value] of Object.entries(extraHeaders)) response.setHeader(header, value);
  response.writeHead(status);
  response.end(JSON.stringify(payload));
}

function getPublicSiteUrl(environment) {
  try {
    const configuredUrl = new URL(environment.PUBLIC_SITE_URL || '');
    if (configuredUrl.protocol !== 'https:' || configuredUrl.username || configuredUrl.password) return null;
    return configuredUrl.origin;
  } catch {
    return null;
  }
}

async function readJsonBody(request) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    return { error: 'Content-Type must be application/json.' };
  }

  const contentLength = Number(request.headers['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return { error: 'The request is too large.' };
  }

  let bytes = 0;
  const chunks = [];
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) return { error: 'The request is too large.' };
    chunks.push(chunk);
  }

  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return { error: 'The request body must contain valid JSON.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: 'The request body must be a JSON object.' };
  }
  return { data: parsed };
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const cleanValue = value.trim();
  if (cleanValue.length > maxLength || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(cleanValue)) return null;
  return cleanValue;
}

function validateRfq(data) {
  const requiredFields = {
    company: 160,
    contactPerson: 120,
    businessEmail: 254,
    destinationCountry: 100,
    productRequirements: 3000,
    quantity: 40
  };
  const optionalFields = { phone: 50, targetDeliveryDate: 10, projectNotes: 3000 };
  const errors = {};
  const rfq = {};

  for (const [field, limit] of Object.entries(requiredFields)) {
    const value = cleanText(data[field], limit);
    if (!value) errors[field] = `${field} is required and must be no longer than ${limit} characters.`;
    else rfq[field] = value;
  }

  for (const [field, limit] of Object.entries(optionalFields)) {
    const value = data[field] === undefined || data[field] === '' ? '' : cleanText(data[field], limit);
    if (value === null) errors[field] = `${field} must be no longer than ${limit} characters.`;
    else rfq[field] = value;
  }

  if (rfq.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rfq.businessEmail)) {
    errors.businessEmail = 'Enter a valid business email address.';
  }
  if (rfq.quantity && !/^\d{1,9}$/.test(rfq.quantity)) {
    errors.quantity = 'Enter a whole-number quantity from 1 to 999,999,999.';
  } else if (rfq.quantity && Number(rfq.quantity) < 1) {
    errors.quantity = 'Quantity must be at least 1.';
  }
  if (rfq.targetDeliveryDate) {
    const deliveryDate = new Date(`${rfq.targetDeliveryDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rfq.targetDeliveryDate) ||
      Number.isNaN(deliveryDate.valueOf()) ||
      deliveryDate.toISOString().slice(0, 10) !== rfq.targetDeliveryDate) {
      errors.targetDeliveryDate = 'Use a valid delivery date.';
    }
  }
  if (data.consent !== true) errors.consent = 'Consent is required before you can submit an enquiry.';
  if (data.website !== undefined &&
    (typeof data.website !== 'string' || data.website.trim() !== '')) {
    errors.website = 'The enquiry could not be accepted.';
  }

  return { valid: Object.keys(errors).length === 0, errors, rfq };
}

function validateRequirements(data) {
  const requirements = {};
  const errors = {};
  const knownFields = new Set(REQUIREMENTS.map(([key]) => key));

  for (const field of Object.keys(data)) {
    if (!knownFields.has(field)) errors[field] = 'This field is not recognized.';
  }
  for (const [field] of REQUIREMENTS) {
    const value = cleanText(data[field] === undefined ? '' : data[field], 500);
    if (value === null) errors[field] = 'Use no more than 500 characters.';
    else requirements[field] = value;
  }

  return { valid: Object.keys(errors).length === 0, errors, requirements };
}

function getVerifiedProducts(catalog) {
  if (!Array.isArray(catalog.products)) return [];
  return catalog.products.flatMap((product) => {
    if (!product || product.verified !== true) return [];
    const id = cleanText(product.id, 120);
    const name = cleanText(product.name, 160);
    const category = cleanText(product.category, 120);
    if (!id || !/^[\w.-]+$/.test(id) || !name || !category) return [];

    const sourceSpecs = product.specifications && typeof product.specifications === 'object'
      ? product.specifications
      : {};
    const specFields = [
      'valveType', 'material', 'pressureClass', 'nominalSize', 'connection',
      'operatingPressure', 'operatingTemperature', 'applicableStandards',
      'application', 'compatibleMedia', 'industries', 'otherConstraints'
    ];
    const specifications = {};
    for (const field of specFields) {
      const value = cleanText(sourceSpecs[field], 240);
      if (value) specifications[field] = value;
    }

    return [{
      id,
      name,
      category,
      summary: cleanText(product.summary || '', 1200) || '',
      specifications,
      datasheetUrl: typeof product.datasheetUrl === 'string' &&
        /^\/documents\/[\w.-]+\.pdf$/i.test(product.datasheetUrl)
        ? product.datasheetUrl
        : '',
      relatedProductIds: Array.isArray(product.relatedProductIds)
        ? product.relatedProductIds.filter((relatedId) => typeof relatedId === 'string' && /^[\w.-]+$/.test(relatedId))
        : []
    }];
  });
}

function buildFallback(requirements, products) {
  const missingInformation = getMissingFields(requirements);

  const matchedProducts = getCompatibleVerifiedProducts(requirements, products);
  return {
    mode: 'rule-based',
    missingInformation,
    clarificationQuestions: missingInformation.slice(0, 3).map(({ key, label }) => ({ key, question: `What ${label.toLowerCase()} should we consider for this application?` })),
    recommendedProducts: matchedProducts,
    notice: matchedProducts.length
      ? 'Only supplied, verified catalogue attributes that exactly match the provided fields are shown; other requirements remain unconfirmed. This preliminary comparison is not an engineering recommendation. A qualified engineer must validate the exact product, current approved documentation, standards and application before procurement or use.'
      : products.length
        ? 'No verified catalogue entry has exact, documented matches for every supplied requirement. A qualified engineer must validate product selection and application suitability before procurement or use.'
      : 'The ARSCON product catalogue has no verified, approved products yet. We cannot recommend, compare, confirm availability, or make engineering assurances until product data is verified. A qualified engineer must validate any safety-critical application.',
    summary: 'Your requirements are captured for preliminary review. Missing information is listed above; no purchase or engineering decision has been made.'
  };
}

function normalizeSpecification(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/µ/g, 'u').replace(/°/g, 'deg');
}

function getCompatibleVerifiedProducts(requirements, products) {
  return products.filter((product) =>
    Object.entries(REQUIREMENT_TO_SPECIFICATION).every(([requirement, specification]) => {
      const requestedValue = requirements[requirement];
      if (!requestedValue) return true;
      const verifiedValue = product.specifications[specification];
      if (!verifiedValue) return false;
      return verifiedValue
        .split(/[;,|]/)
        .some((value) => normalizeSpecification(value) === normalizeSpecification(requestedValue));
    })
  );
}

function parseAndConstrainAiResult(responseText, products, requirements) {
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error('The configured AI service returned an invalid structured response.');
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('The configured AI service returned an invalid structured response.');
  }

  const compatibleIds = new Set(getCompatibleVerifiedProducts(requirements, products).map((product) => product.id));
  const recommendedProducts = Array.isArray(result.recommendedProductIds)
    ? result.recommendedProductIds
      .filter((id) => typeof id === 'string' && compatibleIds.has(id))
      .map((id) => products.find((product) => product.id === id))
      .filter((product, index, all) => all.findIndex((item) => item.id === product.id) === index)
    : [];
  const allowedQuestions = new Map(getMissingFields(requirements).map(({ key, label }) => [key, label]));
  const orderedKeys = [...allowedQuestions.keys()];
  const clarificationQuestions = Array.isArray(result.questionKeys)
    ? [...new Set(result.questionKeys)]
      .filter((key) => allowedQuestions.has(key))
      .sort((first, second) => orderedKeys.indexOf(first) - orderedKeys.indexOf(second))
      .slice(0, 3)
      .map((key) => ({ key, question: `What ${allowedQuestions.get(key).toLowerCase()} should we consider for this application?` }))
    : [];

  return {
    mode: 'assisted',
    missingInformation: getMissingFields(requirements),
    clarificationQuestions,
    recommendedProducts,
    notice: 'AI-assisted preliminary matching is not an engineering recommendation. A qualified engineer must validate the application, product specifications, applicable standards, and suitability before procurement or use.',
    summary: 'A preliminary review is complete. Confirm the outstanding information below before requesting a product shortlist.'
  };
}

function getMissingFields(requirements) {
  return REQUIREMENTS
    .filter(([key]) => key !== 'additionalConstraints' && !requirements[key])
    .map(([key, label]) => ({ key, label }));
}

function aiConfigurationError(environment) {
  const values = [
    environment.AI_API_BASE_URL,
    environment.AI_API_KEY,
    environment.AI_MODEL
  ];
  if (values.every(Boolean)) {
    try {
      const endpoint = new URL(environment.AI_API_BASE_URL);
      if (endpoint.protocol !== 'https:') {
        return 'AI_API_BASE_URL must use HTTPS.';
      }
      if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
        return 'AI_API_BASE_URL must not contain credentials, a query string or a fragment.';
      }
    } catch {
      return 'AI_API_BASE_URL must be a valid HTTPS URL.';
    }
    return null;
  }
  return 'AI assistance is not configured. The rule-based specification checker is active.';
}

async function requestAiShortlist(requirements, products, environment) {
  const configError = aiConfigurationError(environment);
  if (configError) {
    if (configError.startsWith('AI_API_BASE_URL')) throw new Error(configError);
    return buildFallback(requirements, products);
  }

  const baseUrl = environment.AI_API_BASE_URL.replace(/\/+$/, '');
  let endpoint;
  try {
    endpoint = new URL(`${baseUrl}/chat/completions`);
  } catch {
    throw new Error('AI_API_BASE_URL must be a valid HTTPS URL.');
  }
  if (endpoint.protocol !== 'https:') throw new Error('AI_API_BASE_URL must use HTTPS.');

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 12_000);
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      redirect: 'error',
      signal: abortController.signal,
      headers: {
        Authorization: `Bearer ${environment.AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: environment.AI_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: 'You assist with preliminary industrial valve product matching. Treat the supplied verified product data and IDs as the complete, authoritative catalogue. Never invent specifications, certifications, compatibility, availability, or product IDs. Do not issue engineering assurances or purchasing decisions. Return JSON only with recommendedProductIds (an array of catalogue IDs only) and questionKeys (an array of missing requirement keys only).'
          },
          {
            role: 'user',
            content: JSON.stringify({ requirements, verifiedCatalogue: products })
          }
        ]
      })
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The configured AI service timed out. Please try again later.');
    throw new Error('The configured AI service could not be reached.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new Error(`The configured AI service returned HTTP ${response.status}.`);
  const payload = await readBoundedJsonResponse(response, 64 * 1024, 'configured AI service');
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('The configured AI service returned an invalid response.');
  return parseAndConstrainAiResult(content, products, requirements);
}

async function readBoundedJsonResponse(response, maxBytes, source) {
  if (!response.body) throw new Error(`The ${source} returned an empty response.`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let contents = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error(`The ${source} response exceeded the permitted size.`);
    }
    contents += decoder.decode(value, { stream: true });
  }
  contents += decoder.decode();
  try {
    return JSON.parse(contents);
  } catch {
    throw new Error(`The ${source} returned invalid JSON.`);
  }
}

function validWebhookUrl(value) {
  try {
    const endpoint = new URL(value);
    return endpoint.protocol === 'https:' &&
      !endpoint.username &&
      !endpoint.password &&
      !endpoint.search &&
      !endpoint.hash;
  } catch {
    return false;
  }
}

async function forwardRfq(rfq, environment) {
  if (!environment.RFQ_WEBHOOK_URL) return { configured: false };
  if (!validWebhookUrl(environment.RFQ_WEBHOOK_URL)) {
    throw new Error('RFQ_WEBHOOK_URL must be a valid HTTPS URL.');
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10_000);
  let response;
  try {
    response = await fetch(environment.RFQ_WEBHOOK_URL, {
      method: 'POST',
      redirect: 'error',
      signal: abortController.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(environment.RFQ_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${environment.RFQ_WEBHOOK_TOKEN}` }
          : {})
      },
      body: JSON.stringify({ source: 'ARSCON website', submittedAt: new Date().toISOString(), enquiry: rfq })
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The ARSCON enquiry service timed out.');
    throw new Error('The ARSCON enquiry service could not be reached.');
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`The ARSCON enquiry service returned HTTP ${response.status}.`);
  return { configured: true };
}

function createServer({ environment = process.env, catalog = DEFAULT_CATALOG, rateLimiter = createRateLimiter() } = {}) {
  const server = http.createServer(async (request, response) => {
    let requestUrl;
    try {
      requestUrl = new URL(request.url, 'http://localhost');
    } catch {
      sendJson(response, 400, { error: 'Invalid request URL.' });
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname.startsWith('/api/catalog/')) {
      let id;
      try {
        id = decodeURIComponent(requestUrl.pathname.slice('/api/catalog/'.length));
      } catch {
        sendJson(response, 400, { error: 'Invalid product identifier.' });
        return;
      }
      const product = getVerifiedProducts(catalog).find((item) => item.id === id);
      if (!product) {
        sendJson(response, 404, { error: 'No verified catalogue product was found.' });
        return;
      }
      const relatedProducts = getVerifiedProducts(catalog)
        .filter((item) => product.relatedProductIds.includes(item.id) && item.id !== product.id)
        .map(({ relatedProductIds, ...item }) => item);
      const { relatedProductIds, ...details } = product;
      sendJson(response, 200, { product: details, relatedProducts });
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/catalog') {
      const products = getVerifiedProducts(catalog);
      const query = (requestUrl.searchParams.get('q') || '').trim().toLowerCase();
      const category = requestUrl.searchParams.get('category') || '';
      const results = products.filter((product) =>
        (!query || `${product.name} ${product.category}`.toLowerCase().includes(query)) &&
        (!category || product.category === category)
      );
      const sorting = requestUrl.searchParams.get('sort') || 'name-asc';
      if (!['name-asc', 'name-desc', 'category'].includes(sorting)) {
        sendJson(response, 400, { error: 'Choose a valid catalogue sort order.' });
        return;
      }
      results.sort((first, second) => {
        const firstValue = sorting === 'category' ? `${first.category} ${first.name}` : first.name;
        const secondValue = sorting === 'category' ? `${second.category} ${second.name}` : second.name;
        const comparison = firstValue.localeCompare(secondValue);
        return sorting === 'name-desc' ? -comparison : comparison;
      });
      sendJson(response, 200, {
        products: results,
        count: results.length,
        categories: [...new Set(products.map((product) => product.category))].sort(),
        notice: catalog.notice
      });
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/site') {
      let siteUrl = null;
      siteUrl = getPublicSiteUrl(environment);
      sendJson(response, 200, {
        name: BUSINESS_CONFIG.name,
        location: BUSINESS_CONFIG.location,
        website: siteUrl
      });
      return;
    }

    const limit = RATE_LIMITS[requestUrl.pathname];
    if (limit && request.method === 'POST') {
      const rateResult = rateLimiter(`${requestUrl.pathname}:${readClientAddress(request, environment)}`, limit);
      if (!rateResult.allowed) {
        sendJson(response, 429, { error: 'Too many requests. Please wait before trying again.' }, {
          'Retry-After': String(rateResult.retryAfterSeconds)
        });
        return;
      }
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/rfq') {
      const parsed = await readJsonBody(request);
      if (parsed.error) {
        sendJson(response, 400, { error: parsed.error });
        return;
      }
      const validation = validateRfq(parsed.data);
      if (!validation.valid) {
        sendJson(response, 400, { error: 'Please review the highlighted information.', fields: validation.errors });
        return;
      }
      let result;
      try {
        result = await forwardRfq(validation.rfq, environment);
      } catch (error) {
        console.error(`[rfq] ${error.message}`);
        sendJson(response, 502, { error: 'The ARSCON enquiry service could not accept your request. Your enquiry was not sent. Please try again later.' });
        return;
      }
      if (!result.configured) {
        sendJson(response, 503, { error: 'RFQ submission is not configured yet. Your enquiry was not sent. Please contact ARSCON through an approved business channel.' });
        return;
      }
      sendJson(response, 202, { accepted: true, message: 'The configured ARSCON enquiry channel accepted your request.' });
      return;
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/assistant/select') {
      const parsed = await readJsonBody(request);
      if (parsed.error) {
        sendJson(response, 400, { error: parsed.error });
        return;
      }
      const validation = validateRequirements(parsed.data);
      if (!validation.valid) {
        sendJson(response, 400, { error: 'Please review the valve application requirements.', fields: validation.errors });
        return;
      }
      const products = getVerifiedProducts(catalog);
      if (!products.length) {
        sendJson(response, 200, { ...buildFallback(validation.requirements, products), mode: 'rule-based' });
        return;
      }
      try {
        const result = await requestAiShortlist(validation.requirements, products, environment);
        sendJson(response, 200, result);
      } catch (error) {
        console.error(`[assistant] ${error.message}`);
        sendJson(response, 502, { error: 'The configured AI service could not complete a safe preliminary match. No product recommendation was made. Please try again later.' });
      }
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendJson(response, 405, { error: 'Method not allowed.' }, { Allow: 'GET, HEAD, POST' });
      return;
    }

    if (requestUrl.pathname.startsWith('/api/')) {
      sendJson(response, 404, { error: 'API endpoint not found.' });
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/robots.txt') {
      let siteUrl = null;
      siteUrl = getPublicSiteUrl(environment);
      setSecurityHeaders(response, MIME_TYPES['.txt']);
      response.setHeader('Cache-Control', 'public, max-age=3600');
      response.writeHead(200);
      response.end(siteUrl
        ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`
        : 'User-agent: *\nDisallow: /\n');
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/sitemap.xml') {
      let siteUrl = null;
      siteUrl = getPublicSiteUrl(environment);
      const pages = [
        '/', '/products.html', '/industries.html', '/solutions.html', '/resources.html',
        '/about.html', '/assistant.html', '/quote.html', '/privacy.html', '/cookies.html'
      ];
      const productPages = getVerifiedProducts(catalog)
        .map((product) => `/product.html?id=${encodeURIComponent(product.id)}`);
      const entries = siteUrl
        ? [...pages, ...productPages].map((page) => `  <url><loc>${siteUrl}${page.replace(/&/g, '&amp;')}</loc></url>`).join('\n')
        : '';
      setSecurityHeaders(response, 'application/xml; charset=utf-8');
      response.setHeader('Cache-Control', 'public, max-age=3600');
      response.writeHead(200);
      response.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}${entries ? '\n' : ''}</urlset>\n`);
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      sendJson(response, 400, { error: 'Invalid request path.' });
      return;
    }
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.resolve(PUBLIC_ROOT, `.${pathname}`);
    if (!filePath.startsWith(`${PUBLIC_ROOT}${path.sep}`)) {
      sendJson(response, 404, { error: 'Not found.' });
      return;
    }

    try {
      const content = await fs.readFile(filePath);
      const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()];
      if (!contentType) {
        sendJson(response, 404, { error: 'Not found.' });
        return;
      }
      setSecurityHeaders(response, contentType);
      response.setHeader('Cache-Control', contentType.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600');
      response.writeHead(200);
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`[static] ${error.code || 'read error'}`);
        sendJson(response, 500, { error: 'The requested page could not be loaded.' });
        return;
      }
      sendJson(response, 404, { error: 'Not found.' });
    }
  });
  server.headersTimeout = 10_000;
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 5_000;
  server.maxRequestsPerSocket = 100;
  return server;
}

if (require.main === module) {
  createServer().listen(PORT, '0.0.0.0', () => {
    console.log(`ARSCON website listening on port ${PORT}.`);
  });
}

module.exports = {
  buildFallback,
  createRateLimiter,
  createServer,
  getVerifiedProducts,
  parseAndConstrainAiResult,
  getCompatibleVerifiedProducts,
  readClientAddress,
  validateRequirements,
  validateRfq
};
