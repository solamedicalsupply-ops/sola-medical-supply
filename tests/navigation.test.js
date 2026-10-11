const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const root = resolve(__dirname, '..');
const script = readFileSync(resolve(root, 'assets/js/main.js'), 'utf8');
const start = script.indexOf('function siteNavigation(');
assert.notEqual(start, -1, 'The shared navigation data function must exist');
const nextFunction = script.slice(start + 1).search(/^function /m);
const end = nextFunction === -1 ? script.length : start + 1 + nextFunction;
// Evaluate only the navigation definition: detail, journal and tracking pages
// intentionally do not load the product dataset. No DOM is needed for the menu.
const navigation = vm.runInNewContext(`${script.slice(start, end)}; siteNavigation`, { URLSearchParams }, { timeout: 1000 });
const catalogueContext = { window: {} };
vm.runInNewContext(readFileSync(resolve(root, 'assets/data/products.js'), 'utf8'), catalogueContext, { timeout: 1000 });
const products = catalogueContext.window.SOLA_PRODUCTS;
const site = 'https://sola.test';

function linksIn(groups) {
  return groups.flatMap(group => [
    { label: group.allLabel || group.label, href: group.href },
    ...group.columns.flatMap(column => column.links)
  ]);
}

test('navigation is available without the catalogue dataset or DOM', () => {
  const groups = navigation();
  assert.ok(groups.length >= 2, 'The menu needs multiple browse groups');
  assert.equal(new Set(groups.map(group => group.id)).size, groups.length, 'Menu panel IDs must be unique');
  for (const group of groups) {
    assert.ok(group.id && group.label && group.title && group.description && group.href && group.allLabel);
    assert.ok(group.columns.length > 0, `${group.label} must provide links`);
    for (const column of group.columns) {
      assert.ok(column.title && column.links.length > 0);
      for (const link of column.links) assert.ok(link.label && link.href);
    }
  }
});

test('every category and brand menu link selects real catalogue products', () => {
  let categoryLinks = 0;
  let brandLinks = 0;
  for (const link of linksIn(navigation())) {
    const url = new URL(link.href, `${site}/index.html`);
    for (const field of ['category', 'brand']) {
      if (!url.searchParams.has(field)) continue;
      if (field === 'category') categoryLinks += 1;
      if (field === 'brand') brandLinks += 1;
      const value = url.searchParams.get(field);
      assert.ok(products.some(product => product[field] === value), `${link.label}: unknown ${field} ${value}`);
    }
    if (url.searchParams.has('q')) {
      const query = url.searchParams.get('q').trim().toLowerCase();
      assert.ok(query && products.some(product => `${product.name} ${product.brand} ${product.category} ${product.origin || ''} ${product.tag || ''}`.toLowerCase().includes(query)), `${link.label}: search must return catalogue products`);
    }
    const fields = ['category', 'brand', 'origin'].filter(field => url.searchParams.has(field));
    const query = (url.searchParams.get('q') || '').trim().toLowerCase();
    if (fields.length || query) {
      const matches = products.filter(product =>
        fields.every(field => product[field] === url.searchParams.get(field)) &&
        (!query || `${product.name} ${product.brand} ${product.category} ${product.origin || ''} ${product.tag || ''}`.toLowerCase().includes(query))
      );
      assert.ok(matches.length > 0, `${link.label}: combined filters must return products (${url.search})`);
    }
  }
  assert.ok(categoryLinks > 0, 'Category browsing should be represented');
  assert.ok(brandLinks > 0, 'Brand browsing should be represented');
});

test('all internal menu destinations exist, including the tracking route', () => {
  for (const link of linksIn(navigation())) {
    const url = new URL(link.href, `${site}/index.html`);
    if (url.origin !== site) continue;
    const pathname = decodeURIComponent(url.pathname);
    const file = pathname === '/track' || pathname.startsWith('/track/')
      ? 'track.html'
      : pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    assert.ok(existsSync(resolve(root, file)), `${link.label}: missing destination ${pathname}`);
  }
});

test('nested product and journal pages resolve to the same menu destinations', () => {
  const rootLinks = linksIn(navigation());
  const nestedLinks = linksIn(navigation('../'));
  assert.equal(nestedLinks.length, rootLinks.length);
  for (const page of ['/products/profhilo.html', '/blog/index.html']) {
    rootLinks.forEach((link, index) => {
      assert.equal(
        new URL(nestedLinks[index].href, `${site}${page}`).href,
        new URL(link.href, `${site}/index.html`).href,
        `${link.label} resolves incorrectly from ${page}`
      );
    });
  }
});

function readSavedQuote(getItem) {
  const quoteStart = script.indexOf('function readQuoteList(');
  const quoteEnd = script.indexOf('\nconst quoteList =', quoteStart);
  assert.ok(quoteStart >= 0 && quoteEnd > quoteStart, 'The shared quote reader must exist');
  const readQuoteList = vm.runInNewContext(`${script.slice(quoteStart, quoteEnd)}; readQuoteList`, {
    QUOTE_STORAGE_KEY: 'sola-quote-list',
    sessionStorage: { getItem }
  }, { timeout: 1000 });
  return Array.from(readQuoteList().keys());
}

test('saved quote selections restore once per product without the catalogue dataset', () => {
  const names = ['Profhilo', 'Juvéderm Volux — Korean Market', 'Profhilo'];
  assert.deepEqual(readSavedQuote(key => {
    assert.equal(key, 'sola-quote-list');
    return JSON.stringify(names);
  }), names.slice(0, 2));
});

test('unavailable or malformed quote storage does not break the shared header', () => {
  for (const value of [null, '{broken-json', 'null', '{}', 'true', '42']) {
    assert.deepEqual(readSavedQuote(() => value), []);
  }
  assert.deepEqual(readSavedQuote(() => { throw new Error('Storage unavailable'); }), []);
  assert.deepEqual(readSavedQuote(() => JSON.stringify([42, null, {}, ['nested'], 'x'.repeat(201), 'Profhilo'])), ['Profhilo']);
});
