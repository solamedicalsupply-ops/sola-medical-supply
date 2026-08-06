const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const trackingHtml = readFileSync(resolve(__dirname, '..', 'track.html'), 'utf8');
const trackingScript = readFileSync(resolve(__dirname, '..', 'assets/js/tracking.js'), 'utf8');

test('a delivery partner link is enough to show public carrier tracking', () => {
  assert.match(trackingScript, /carrier\.hidden = !\(data\.localCarrier \|\| data\.localTrackingNumber \|\| carrierUrl\)/);
  assert.match(trackingScript, /const carrierUrl = safeHttpsUrl\(data\.localTrackingUrl\)/);
  assert.match(trackingHtml, /data-carrier-link hidden[^>]*>Track with delivery partner<\/a>/);
});

test('legacy courier details stay hidden when only a link is available', () => {
  assert.match(trackingScript, /\$\('\[data-carrier-details\]'\)\.hidden = !\(data\.localCarrier \|\| data\.localTrackingNumber\)/);
  assert.match(trackingHtml, /data-carrier-details/);
});
