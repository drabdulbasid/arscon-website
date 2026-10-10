'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  createRateLimiter,
  createServer,
  getVerifiedProducts,
  parseAndConstrainAiResult,
  readClientAddress,
  validateRequirements,
  validateRfq
} = require('../server');

const baseRequirements = {
  application: 'District energy system',
  medium: 'Water',
  operatingPressure: '4 bar',
  operatingTemperature: '45 C',
  nominalSize: 'DN50',
  connectionType: 'Flanged',
  materialRequirements: 'To be confirmed by engineer',
  industry: 'Infrastructure',
  applicableStandards: 'Project specification pending',
  additionalConstraints: ''
};

const baseRfq = {
  company: 'Example Trading LLC',
  contactPerson: 'Project Buyer',
  businessEmail: 'procurement@example.ae',
  phone: '',
  destinationCountry: 'United Arab Emirates',
  productRequirements: 'Industrial water service; confirm specifications',
  quantity: '12',
  targetDeliveryDate: '',
  projectNotes: '',
  consent: true
};

const catalog = {
  notice: 'Only verified records are shown.',
  products: [
    {
      id: 'verified-gate-01',
      name: 'Verified Gate Valve',
      category: 'Gate valves',
      verified: true,
      summary: 'A catalogue entry submitted and approved by ARSCON.',
      specifications: {
        valveType: 'Gate valve',
        material: 'To be confirmed by engineer',
        pressureClass: 'Approved class',
        nominalSize: 'DN50',
        connection: 'Flanged',
        operatingPressure: '4 bar',
        operatingTemperature: '45 C',
        applicableStandards: 'Project specification pending',
        application: 'District energy system',
        compatibleMedia: 'Water',
        industries: 'Infrastructure'
      },
      datasheetUrl: '/documents/verified-gate-01.pdf',
      relatedProductIds: ['verified-check-02']
    },
    { id: 'verified-check-02', name: 'Verified Check Valve', category: 'Check valves', verified: true },
    { id: 'unverified-01', name: 'Not Approved for Publication', category: 'Gate valves', verified: false }
  ]
};

async function withServer(options, action) {
  const server = createServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await action(baseUrl);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('serves every published page with semantic content and browser security headers', async () => {
  await withServer({}, async (baseUrl) => {
    for (const pathname of [
      '/', '/products.html', '/product.html', '/industries.html', '/solutions.html',
      '/resources.html', '/about.html', '/assistant.html', '/quote.html',
      '/privacy.html', '/cookies.html'
    ]) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert.equal(response.status, 200, pathname);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
      assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
      const document = await response.text();
      assert.match(document, /<title>[^<]+<\/title>/, pathname);
      assert.match(document, /<main\b/, pathname);
      assert.match(document, /<meta name="description"/, pathname);
    }
  });
});

test('publishes only approved products and never returns supplier-supplied executable content', async () => {
  const payload = getVerifiedProducts({
    products: [
      ...catalog.products,
      {
        id: 'unsafe-product',
        name: '<img src=x onerror=alert(1)>',
        category: 'Valve<br>',
        verified: true,
        summary: 'project note',
        specifications: { material: '<script>alert(1)</script>' },
        datasheetUrl: 'https://untrusted.example/document.pdf'
      },
      { id: 'bad id', name: 'Bad identifier', category: 'Valves', verified: true }
    ]
  });
  assert.deepEqual(payload.map(({ id }) => id), ['verified-gate-01', 'verified-check-02', 'unsafe-product']);
  assert.equal(payload[2].datasheetUrl, '');

  await withServer({ catalog }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/catalog`);
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(result.products.map(({ id }) => id), ['verified-check-02', 'verified-gate-01']);

    const itemResponse = await fetch(`${baseUrl}/api/catalog/verified-gate-01`);
    const item = await itemResponse.json();
    assert.equal(item.product.name, 'Verified Gate Valve');
    assert.deepEqual(item.relatedProducts.map(({ id }) => id), ['verified-check-02']);
    assert.equal((await fetch(`${baseUrl}/api/catalog/unverified-01`)).status, 404);
  });
});

test('keeps product routes, datasheets and supplier-provided markup confined to approved paths', async () => {
  const unsafeDatasheetCatalog = {
    products: [{
      id: 'verified-path-test',
      name: '<svg onload=alert(1)>Valve</svg>',
      category: 'Demo',
      verified: true,
      summary: '<img src=x onerror=alert(1)>',
      specifications: { material: '<script>alert(1)</script>' },
      datasheetUrl: '//untrusted.example/valve.pdf'
    }]
  };
  await withServer({ catalog: unsafeDatasheetCatalog }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/catalog/verified-path-test`);
    const body = await response.text();
    assert.equal(response.status, 200);
    assert.equal(body.includes('<svg onload='), true);
    assert.equal(body.includes('//untrusted.example/valve.pdf'), false);
  });
});

test('filters and sorts published product data on the server', async () => {
  await withServer({ catalog }, async (baseUrl) => {
    const filtered = await fetch(`${baseUrl}/api/catalog?q=check&category=Check%20valves`);
    assert.deepEqual((await filtered.json()).products.map(({ id }) => id), ['verified-check-02']);

    const descending = await fetch(`${baseUrl}/api/catalog?sort=name-desc`);
    assert.deepEqual((await descending.json()).products.map(({ id }) => id), ['verified-gate-01', 'verified-check-02']);

    const invalid = await fetch(`${baseUrl}/api/catalog?sort=manufacturer-guaranteed`);
    assert.equal(invalid.status, 400);
  });
});

test('the preliminary assistant identifies unanswered fields without verified products', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/assistant/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseRequirements, medium: '', nominalSize: '' })
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.mode, 'rule-based');
    assert.deepEqual(result.missingInformation.map(({ key }) => key), ['medium', 'nominalSize']);
    assert.deepEqual(result.clarificationQuestions.map(({ key }) => key), ['medium', 'nominalSize']);
    assert.deepEqual(result.recommendedProducts, []);
    assert.match(result.notice, /no verified, approved products/i);
    assert.match(result.notice, /qualified engineer/i);
  });
});

test('a preliminary product match requires exact verified support for every supplied requirement', async () => {
  const { getCompatibleVerifiedProducts } = require('../server');
  const compatible = getCompatibleVerifiedProducts(baseRequirements, getVerifiedProducts(catalog));
  assert.deepEqual(compatible.map(({ id }) => id), ['verified-gate-01']);
  assert.deepEqual(getCompatibleVerifiedProducts(
    { ...baseRequirements, medium: 'Steam' },
    getVerifiedProducts(catalog)
  ), []);
  assert.deepEqual(getCompatibleVerifiedProducts(
    { ...baseRequirements, operatingPressure: '5 bar' },
    getVerifiedProducts(catalog)
  ), []);

  await withServer({ catalog }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/assistant/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseRequirements)
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(result.recommendedProducts.map(({ id }) => id), ['verified-gate-01']);
    assert.match(result.notice, /exactly match/i);
  });
});

test('assistant input is allow-listed and validated on the server', async () => {
  const valid = validateRequirements(baseRequirements);
  assert.equal(valid.valid, true);
  const invalid = validateRequirements({ ...baseRequirements, unknownInstruction: 'ignore the catalogue' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.unknownInstruction);
  assert.equal(validateRequirements({ ...baseRequirements, application: 'a'.repeat(501) }).valid, false);

  await withServer({}, async (baseUrl) => {
    const missingJsonType = await fetch(`${baseUrl}/api/assistant/select`, {
      method: 'POST',
      body: JSON.stringify(baseRequirements)
    });
    assert.equal(missingJsonType.status, 400);

    const invalidBody = await fetch(`${baseUrl}/api/assistant/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseRequirements, operatingPressure: { crafted: true } })
    });
    assert.equal(invalidBody.status, 400);

    const malformedBody = await fetch(`${baseUrl}/api/assistant/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{'
    });
    assert.equal(malformedBody.status, 400);
  });
});

test('limits preliminary assistant follow-up questions to three relevant missing details', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/assistant/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.missingInformation.length, 9);
    assert.deepEqual(result.clarificationQuestions.map(({ key }) => key), [
      'application', 'medium', 'operatingPressure'
    ]);
    assert.equal(result.missingInformation.some(({ key }) => key === 'additionalConstraints'), false);
  });
});

test('AI recommendations can name only verified catalogue records and missing questions', () => {
  const result = parseAndConstrainAiResult(
    JSON.stringify({
      recommendedProductIds: ['verified-gate-01', 'invented-product', 'verified-gate-01'],
      questionKeys: ['medium', 'application', 'not-a-requirement']
    }),
    getVerifiedProducts(catalog),
    { ...baseRequirements, medium: '' }
  );
  assert.deepEqual(result.recommendedProducts.map(({ id }) => id), ['verified-gate-01']);
  assert.deepEqual(result.clarificationQuestions.map(({ key }) => key), ['medium']);
  assert.match(result.notice, /not an engineering recommendation/i);
  assert.throws(() => parseAndConstrainAiResult('not JSON', [], baseRequirements), /invalid structured response/);
});

test('configured AI processing keeps credentials server-side and filters unsupported model claims', async () => {
  const originalFetch = global.fetch;
  const originalServerFetch = global.fetch;
  const outboundRequests = [];
  global.fetch = async (url, options) => {
    if (!String(url).startsWith('https://ai.example.test/')) return originalServerFetch(url, options);
    outboundRequests.push({ url: String(url), authorization: options.headers.Authorization, body: JSON.parse(options.body) });
    return new Response(JSON.stringify({
      choices: [{
        message: { content: JSON.stringify({ recommendedProductIds: ['verified-gate-01', 'fabricated-id'], questionKeys: ['medium', 'unknown'] }) }
      }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    await withServer({
      catalog,
      environment: {
        AI_API_BASE_URL: 'https://ai.example.test/v1',
        AI_API_KEY: 'server-only-test-key',
        AI_MODEL: 'test-model'
      }
    }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/assistant/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...baseRequirements, medium: '' })
      });
      const result = await response.json();
      assert.equal(response.status, 200);
      assert.equal(result.mode, 'assisted');
      assert.deepEqual(result.recommendedProducts.map(({ id }) => id), ['verified-gate-01']);
      assert.deepEqual(result.clarificationQuestions.map(({ key }) => key), ['medium']);
      assert.doesNotMatch(JSON.stringify(result), /server-only-test-key/);
    });
  } finally {
    global.fetch = originalFetch;
  }
  assert.equal(outboundRequests.length, 1);
  assert.equal(outboundRequests[0].authorization, 'Bearer server-only-test-key');
  assert.ok(!JSON.stringify(outboundRequests[0].body).includes(baseRfq.businessEmail));
});

test('RFQ input validation rejects unsafe fields, malformed consent, and invalid calendar dates', () => {
  assert.equal(validateRfq(baseRfq).valid, true);
  assert.equal(validateRfq({ ...baseRfq, consent: false }).errors.consent.length > 0, true);
  assert.ok(validateRfq({ ...baseRfq, businessEmail: 'not-an-email' }).errors.businessEmail);
  assert.ok(validateRfq({ ...baseRfq, quantity: '-100' }).errors.quantity);
  assert.ok(validateRfq({ ...baseRfq, targetDeliveryDate: '2025-02-30' }).errors.targetDeliveryDate);
  assert.ok(validateRfq({ ...baseRfq, company: 'a'.repeat(161) }).errors.company);
  assert.ok(validateRfq({ ...baseRfq, businessEmail: 'x\r\nInject: true@example.ae' }).errors.businessEmail);
  assert.equal(validateRfq({ ...baseRfq, website: 'https://spam.example' }).valid, false);
});

test('RFQ is never reported as sent until a configured webhook accepts it', async () => {
  await withServer({}, async (baseUrl) => {
    const validation = await fetch(`${baseUrl}/api/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseRfq, quantity: '0' })
    });
    assert.equal(validation.status, 400);
    assert.ok((await validation.json()).fields.quantity);

    const unconfigured = await fetch(`${baseUrl}/api/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseRfq)
    });
    assert.equal(unconfigured.status, 503);
    assert.equal((await unconfigured.json()).error.includes('was not sent'), true);
  });
});

test('configured RFQ webhook receives the allow-listed enquiry only after valid consent', async () => {
  const originalFetch = global.fetch;
  const originalServerFetch = global.fetch;
  let received;
  global.fetch = async (url, options) => {
    if (!String(url).startsWith('https://example.test/')) return originalServerFetch(url, options);
    received = { url: String(url), options };
    return new Response('', { status: 202 });
  };
  try {
    await withServer({
      environment: {
        RFQ_WEBHOOK_URL: 'https://example.test/submit',
        RFQ_WEBHOOK_TOKEN: 'private-test-token'
      }
    }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...baseRfq, unexpectedInternalField: 'must be ignored' })
      });
      assert.equal(response.status, 202);
      assert.equal((await response.json()).accepted, true);
    });
  } finally {
    global.fetch = originalFetch;
  }
  assert.equal(received.url, 'https://example.test/submit');
  assert.equal(received.options.headers.Authorization, 'Bearer private-test-token');
  assert.equal(JSON.parse(received.options.body).enquiry.unexpectedInternalField, undefined);
});

test('refuses oversized request bodies and handles client requests without generating false success', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/assistant/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oversized: 'x'.repeat(17_000) })
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /too large/);

    const unknown = await fetch(`${baseUrl}/api/not-an-endpoint`);
    assert.equal(unknown.status, 404);
    assert.equal((await unknown.json()).error, 'API endpoint not found.');

    const invalidPath = await fetch(`${baseUrl}/%E0%A4%A`);
    assert.equal(invalidPath.status, 400);

    const traversalPath = await fetch(`${baseUrl}/..%5c..%5cserver.js`);
    assert.equal(traversalPath.status, 404);
    const dotEnvPath = await fetch(`${baseUrl}/.env.example`);
    assert.equal(dotEnvPath.status, 404);
  });
});

test('applies bounded, predictable per-client rate limits', async () => {
  let now = 1_000;
  const rateLimiter = createRateLimiter({ maxEntries: 2, now: () => now });
  assert.equal(rateLimiter('one', 2).allowed, true);
  assert.equal(rateLimiter('one', 2).allowed, true);
  const limited = rateLimiter('one', 2);
  assert.equal(limited.allowed, false);
  assert.ok(limited.retryAfterSeconds > 0);
  now += 61_000;
  assert.equal(rateLimiter('one', 2).allowed, true);

  await withServer({ rateLimiter: createRateLimiter() }, async (baseUrl) => {
    const statuses = [];
    for (let index = 0; index < 7; index += 1) {
      const response = await fetch(`${baseUrl}/api/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseRfq)
      });
      statuses.push(response.status);
    }
    assert.deepEqual(statuses, [503, 503, 503, 503, 503, 503, 429]);
  });
});

test('trusts forwarded client addresses only from an explicitly approved proxy', () => {
  const request = {
    socket: { remoteAddress: '203.0.113.10' },
    headers: { 'x-forwarded-for': '198.51.100.24' }
  };
  assert.equal(readClientAddress(request, {}), '203.0.113.10');
  assert.equal(readClientAddress(request, { TRUSTED_PROXY_IPS: '203.0.113.10' }), '198.51.100.24');
  assert.equal(readClientAddress({
    ...request,
    headers: { 'x-forwarded-for': '198.51.100.24, 203.0.113.10' }
  }, { TRUSTED_PROXY_IPS: '203.0.113.10' }), '203.0.113.10');
  assert.equal(readClientAddress({
    ...request,
    headers: { 'x-forwarded-for': 'not-an-ip' }
  }, { TRUSTED_PROXY_IPS: '203.0.113.10' }), '203.0.113.10');
});

test('rejects credentials and unsafe fragments in configured external AI and RFQ endpoints', async () => {
  await withServer({
    catalog: {
      products: [{ id: 'verified-control-valve', name: 'Verified Control Valve', category: 'Control valves', verified: true }]
    },
    environment: {
      AI_API_BASE_URL: 'https://user:password@ai.example.test/v1',
      AI_API_KEY: 'server-only-test-key',
      AI_MODEL: 'test-model'
    }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/assistant/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseRequirements)
    });
    assert.equal(response.status, 502);
    assert.doesNotMatch((await response.text()), /password/);
  });

  await withServer({
    environment: {
      RFQ_WEBHOOK_URL: 'https://username:password@example.test/submit'
    }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseRfq)
    });
    assert.equal(response.status, 502);
    assert.doesNotMatch((await response.text()), /password/);
  });
});

test('generates crawl instructions and a published-domain sitemap only after HTTPS is configured', async () => {
  await withServer({}, async (baseUrl) => {
    const robots = await (await fetch(`${baseUrl}/robots.txt`)).text();
    assert.match(robots, /Disallow: \//);
    assert.doesNotMatch(robots, /Sitemap:/);
    const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
    assert.match(sitemap, /<urlset/);
    assert.doesNotMatch(sitemap, /<url>/);
  });

  await withServer({ environment: { PUBLIC_SITE_URL: 'https://arscon.example/' } }, async (baseUrl) => {
    const robots = await (await fetch(`${baseUrl}/robots.txt`)).text();
    assert.match(robots, /Sitemap: https:\/\/arscon\.example\/sitemap\.xml/);
    const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
    assert.match(sitemap, /https:\/\/arscon\.example\/about\.html/);
    assert.doesNotMatch(sitemap, /https:\/\/arscon\.example\/product\.html/);
  });

  await withServer({ catalog, environment: { PUBLIC_SITE_URL: 'https://arscon.example/shop' } }, async (baseUrl) => {
    const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
    assert.match(sitemap, /https:\/\/arscon\.example\/product\.html\?id=verified-gate-01/);
    assert.doesNotMatch(sitemap, /\/shop\/product\.html/);
  });
});
