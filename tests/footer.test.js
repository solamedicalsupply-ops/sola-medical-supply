const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const root = resolve(__dirname, '..');
const script = readFileSync(resolve(root, 'assets/js/main.js'), 'utf8');
const start = script.indexOf('function siteFooter(');
assert.notEqual(start, -1, 'The shared footer function must exist');
const nextFunction = script.slice(start + 1).search(/^function /m);
const end = nextFunction === -1 ? script.length : start + 1 + nextFunction;
// The footer must work on detail and journal pages that have no catalogue data.
const footer = vm.runInNewContext(`${script.slice(start, end)}; siteFooter`, {}, { timeout: 1000 });
const site = 'https://sola.test';

function linksIn(html) {
  return Array.from(html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi), match => ({
    href: match[1].replace(/&amp;/g, '&'),
    label: match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }));
}

function textIn(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

test('footer displays the supplied SOLA address, email and clickable phone exactly once', () => {
  const html = footer();
  const links = linksIn(html);
  const text = textIn(html);
  assert.match(html, /<footer\b/);
  assert.ok(text.includes('Keangnam Hanoi Landmark Tower, A-72 Story Building, Me Tri Ward, Nam Tu Liem District, Hanoi.'));
  assert.equal((text.match(/VAT code: LT130009543714/g) || []).length, 1, 'Display the user-supplied VAT code exactly once');
  const emailLinks = links.filter(link => link.href === 'mailto:sales@solamedicalsupply.com');
  const phoneLinks = links.filter(link => link.href === 'tel:+84981778670');
  assert.equal(emailLinks.length, 1, 'Email should have one working mailto link');
  assert.equal(phoneLinks.length, 1, 'Phone should have one working tel link');
  assert.ok(emailLinks[0].label.includes('sales@solamedicalsupply.com'));
  assert.match(phoneLinks[0].label.replace(/\s/g, ''), /\+84981778670/);
});

test('footer provides Products, Company and Resources groups without copied company details', () => {
  const html = footer();
  for (const heading of ['Products', 'Company', 'Resources']) {
    assert.match(html, new RegExp(`<h[2-6]\\b[^>]*>\\s*${heading}\\s*<\\/h[2-6]>`), `${heading} should be a semantic group heading`);
  }
  assert.doesNotMatch(html, /bioresus|orders@|Vilnius|Lithuania|309318358|LT100009543714/i);
});

test('footer has no placeholder links and all local destinations exist', () => {
  const links = linksIn(footer());
  assert.ok(links.length >= 6, 'The footer should provide useful navigation');
  for (const link of links) {
    assert.ok(link.href && link.href !== '#' && !/^javascript:/i.test(link.href), `${link.label}: placeholder destination`);
    const url = new URL(link.href, `${site}/index.html`);
    if (['mailto:', 'tel:'].includes(url.protocol)) continue;
    if (url.origin !== site) {
      assert.equal(url.origin, 'https://wa.me', `${link.label}: unexpected external destination`);
      assert.equal(url.pathname, '/84981778670', 'WhatsApp should use the supplied contact number');
      continue;
    }
    const pathname = decodeURIComponent(url.pathname);
    const file = pathname === '/track' || pathname.startsWith('/track/')
      ? 'track.html'
      : pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    assert.ok(existsSync(resolve(root, file)), `${link.label}: missing destination ${pathname}`);
  }
});

test('nested product and journal pages retain the same footer destinations and logo', () => {
  const rootHTML = footer();
  const nestedHTML = footer('../');
  const rootLinks = linksIn(rootHTML);
  const nestedLinks = linksIn(nestedHTML);
  assert.equal(nestedLinks.length, rootLinks.length);
  for (const page of ['/products/profhilo.html', '/blog/index.html']) {
    rootLinks.forEach((link, index) => {
      assert.equal(
        new URL(nestedLinks[index].href, `${site}${page}`).href,
        new URL(link.href, `${site}/index.html`).href,
        `${link.label} resolves incorrectly from ${page}`
      );
    });
    const rootImage = rootHTML.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
    const nestedImage = nestedHTML.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
    assert.ok(rootImage && nestedImage, 'The footer should include the SOLA brand logo');
    assert.equal(new URL(nestedImage[1], `${site}${page}`).href, new URL(rootImage[1], `${site}/index.html`).href);
    assert.ok(existsSync(resolve(root, decodeURIComponent(new URL(rootImage[1], `${site}/index.html`).pathname).replace(/^\//, ''))));
  }
});
