const WHATSAPP_NUMBER = '84981778670';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const allProducts = window.SOLA_PRODUCTS || [];
const wa = (text = 'Hello SOLA Medical Supply, I would like to request a wholesale quotation.') => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escapeHTML = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const homeCategories = [
  { name: 'Dermal Fillers', label: 'Dermal fillers', note: 'Korean and international filler options', icon: 'DF' },
  { name: 'Skin Boosters / PN', label: 'Skin boosters / PN', note: 'PN, HA and hydration-focused products', icon: 'SB' },
  { name: 'Toxin', label: 'Toxins', note: 'Popular professional toxin requests', icon: 'TX' },
  { name: 'Exosome / Meso', label: 'Exosome / Meso', note: 'Meso and regenerative buyer requests', icon: 'EX' },
  { name: 'Lipolysis / Body', label: 'Lipolysis / Body', note: 'Body contouring and lipolysis picks', icon: 'LB' },
  { name: 'Injection Supplies', label: 'Injection supplies', note: 'Clinic essentials for order planning', icon: 'IS' }
];
const fastProductNames = [
  'Ultrafill', 'Sardenya', 'Rejuran HB', 'Profhilo', 'Asce', 'Botulax 100 Unit', 'Lemon Bottle', 'Mounjaro 2.5mg'
];
const partnerBrands = [
  'Juvederm', 'Profhilo', 'Teoxane', 'Jalupro', 'Restylane', 'Allergan',
  'Rejuran', 'Botulax', 'Nabota', 'Meditoxin', 'Melsmon', 'White Fill Pro'
];
const partnerBrandLogos = {
  Juvederm: 'https://www.sweye.com/wp-content/uploads/2019/05/gem20170813juvederm-5.png',
  Profhilo: 'https://shop.ibsaderma.de/images/thumbs/0000624_profhilo.svg',
  Teoxane: 'https://www.teoxane-event.de/wp-content/uploads/2022/11/tpi-logo-black-o-500.png',
  Jalupro: 'assets/images/products/jalupro.png',
  Restylane: 'https://www.conceptdermo.com/wp-content/uploads/2020/05/176-1760346_restylane-l-rgb-restylane-logo-png-clipart.jpg',
  Allergan: 'https://cdn.prod.website-files.com/64e8f4d701b9e5823df6b23e/6630f0b90eba44538e98a5d6_allergan-aesthetics-an-abbvie-company-fi5th-client-logo-01.png',
  Rejuran: 'https://www.cosmo-korea.com/web/image/product.brand.ept/26/logo/Rejuran?unique=e826a78',
  Botulax: 'https://www.cosmo-korea.com/web/image/product.brand.ept/3/logo/Botulax?unique=592e43b',
  Nabota: 'assets/images/products/nabota100.png',
  Meditoxin: 'https://www.cosmo-korea.com/web/image/product.brand.ept/42/logo/Meditoxin?unique=4d7092f',
  Melsmon: 'assets/images/products/melsmon.png',
  'White Fill Pro': 'assets/images/products/whiteFillPro.png'
};

function renderSiteChrome() {
  const path = location.pathname.replace(/\\/g, '/');
  const inBlog = path.includes('/blog/');
  const inProducts = path.includes('/products/');
  const base = inBlog || inProducts ? '../' : '';
  const page = location.pathname.split(/[\\/]/).pop() || 'index.html';
  const section = inBlog ? 'journal' : inProducts ? 'products' : page.replace('.html', '');
  const active = key => section === key ? ' class="active"' : '';
  const header = `<div class="topbar"><div class="wrap"><span>Professional aesthetic wholesale · Worldwide shipping support</span><a data-wa>Talk to a specialist →</a></div></div>
    <nav class="nav"><div class="wrap nav-inner"><a class="brand" href="${base}index.html"><img src="${base}assets/icons/logoNgang.png" alt="SOLA Medical Supply"></a><button class="menu" type="button" aria-label="Open navigation" aria-expanded="false">Menu</button><div class="links">
    <a${active('index')} href="${base}index.html">Home</a><a${active('products')} href="${base}products.html">Products</a><a${active('brands')} href="${base}brands.html">Brands</a><a${active('shipping')} href="${base}shipping.html">Shipping</a><a${active('about')} href="${base}about.html">About</a><a${active('faq')} href="${base}faq.html">FAQ</a><a${active('journal')} href="${base}blog/index.html">Journal</a><a${active('contact')} href="${base}contact.html">Contact</a><a class="btn primary" data-wa>Request a quote</a></div></div></nav>`;
  document.querySelector('.topbar')?.remove();
  document.querySelector('.nav')?.remove();
  document.body.insertAdjacentHTML('afterbegin', header);

  const footer = `<footer class="footer new-footer"><div class="wrap"><div class="footer-top"><div><img src="${base}assets/icons/logoNgang.png" alt="SOLA"><p>Professional aesthetic wholesale supply for clinics, spas, resellers and distributors worldwide.</p></div><div><b>Explore</b><a href="${base}products.html">Products</a><a href="${base}brands.html">Brands</a><a href="${base}shipping.html">Shipping</a><a href="${base}blog/index.html">Journal</a></div><div><b>Company</b><a href="${base}about.html">About SOLA</a><a href="${base}faq.html">FAQ</a><a href="${base}contact.html">Contact</a></div><div><b>Contact</b><a data-wa>WhatsApp: +84 98 177 86 70</a><a href="mailto:sales@solamedicalsupply.com">Email: sales@solamedicalsupply.com</a></div></div><div class="footer-bottom"><span>© 2026 SOLA Medical Supply</span><span>Professional buyers only · Product availability varies by market</span></div></div></footer>`;
  document.querySelector('.footer')?.remove();
  document.body.insertAdjacentHTML('beforeend', footer);
}

renderSiteChrome();

$('.menu')?.addEventListener('click', e => {
  $('.links')?.classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', $('.links')?.classList.contains('open') ? 'true' : 'false');
});
$$('[data-wa]').forEach(a => a.href = wa(a.dataset.wa || undefined));

const quoteList = new Map();
let visibleCount = 24;
let filteredProducts = allProducts;

function productFlag(p) {
  if (['Toxin', 'Skin Boosters / PN', 'Exosome / Meso', 'Lipolysis / Body', 'Weight Management'].includes(p.category)) return 'Fast-moving SKU';
  if ((p.origin || '').toLowerCase() === 'korea') return 'Korean supply';
  if ((p.category || '').toLowerCase().includes('injection')) return 'Clinic essential';
  return 'Wholesale quote';
}

function productCard(p) {
  const selected = quoteList.has(p.name);
  const action = $('[data-quote-drawer]')
    ? `<button class="add-quote ${selected ? 'selected' : ''}" data-add-quote="${p.name.replace(/"/g, '&quot;')}">${selected ? 'Added ✓' : '+ Add to quote'}</button>`
    : `<a class="add-quote" href="${wa('Hello SOLA Medical Supply, please quote: ' + p.name)}" target="_blank">Request quotation →</a>`;
  const url = `products/${slugify(p.name)}.html`;
  return `<article class="product">
    <figure><a href="${url}"><img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async"></a></figure>
    <div class="product-body"><div class="product-flags"><span>${productFlag(p)}</span><span>${p.origin || 'Global'}</span></div><h3><a href="${url}">${p.name}</a></h3><div class="meta"><span class="badge">${p.category}</span><span class="badge">${p.brand}</span></div>
    <p>${p.origin || 'International'} supply • ${p.tag || 'Available on request'}</p>
    ${action}</div>
  </article>`;
}

function renderGrid(grid, list) {
  const isFull = grid.dataset.mode === 'all';
  const shown = isFull ? list.slice(0, visibleCount) : list;
  grid.innerHTML = shown.map(productCard).join('') || '<p>No products found. Try another search.</p>';
  const count = $('[data-results-count]');
  if (count && isFull) count.textContent = `${list.length} products found · showing ${shown.length}`;
  const more = $('[data-load-more]');
  if (more) more.hidden = visibleCount >= list.length;
}

function updateQuoteBar() {
  const drawer = $('[data-quote-drawer]');
  const count = $('[data-quote-count]');
  const send = $('[data-send-quote]');
  if (count) count.textContent = quoteList.size;
  drawer?.classList.toggle('open', quoteList.size > 0);
  if (send) send.disabled = quoteList.size === 0;
}

document.addEventListener('click', e => {
  const add = e.target.closest('[data-add-quote]');
  if (add) {
    const name = add.dataset.addQuote;
    quoteList.has(name) ? quoteList.delete(name) : quoteList.set(name, true);
    add.classList.toggle('selected', quoteList.has(name));
    add.textContent = quoteList.has(name) ? 'Added ✓' : '+ Add to quote';
    updateQuoteBar();
  }
});

$('[data-send-quote]')?.addEventListener('click', () => {
  const items = [...quoteList.keys()].map((name, i) => `${i + 1}. ${name} — Qty:`).join('\n');
  window.open(wa(`Hello SOLA Medical Supply, please quote the following products:\n\n${items}\n\nDestination country:`), '_blank');
});

function setupProductSections() {
  const fastProducts = fastProductNames
    .map(name => allProducts.find(p => p.name === name))
    .filter(Boolean);
  $$('[data-products-grid]').forEach(grid => {
    const mode = grid.dataset.mode;
    const list = mode === 'featured'
      ? allProducts.filter(p => p.featured)
      : mode === 'fast'
        ? fastProducts
        : allProducts;
    renderGrid(grid, list);
  });
}

function renderHomeCategories() {
  const el = $('[data-category-hub]');
  if (!el) return;
  el.innerHTML = homeCategories.map((cat, index) => {
    const count = allProducts.filter(p => p.category === cat.name).length;
    const href = `products.html?category=${encodeURIComponent(cat.name)}`;
    return `<a class="category-hub-card" href="${href}">
      <span>${cat.icon}</span>
      <small>0${index + 1}</small>
      <h3>${cat.label}</h3>
      <p>${cat.note}</p>
      <b>${count} products &rarr;</b>
    </a>`;
  }).join('');
}

function renderPartnerBrands() {
  const el = $('[data-partner-brands]');
  if (!el) return;
  el.innerHTML = partnerBrands.map((brand, index) => {
    const count = allProducts.filter(p => p.brand === brand).length;
    const href = `products.html?brand=${encodeURIComponent(brand)}`;
    const logo = partnerBrandLogos[brand];
    const logoHTML = logo ? `<img class="partner-logo" src="${logo}" alt="${escapeHTML(brand)} logo" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.partner-brand-card').classList.remove('has-logo');this.remove()">` : '';
    return `<a class="partner-brand-card ${logo ? 'has-logo' : ''}" href="${href}" aria-label="View ${escapeHTML(brand)} products">
      <span class="partner-plus">+</span>
      <small>${String(index + 1).padStart(2, '0')}</small>
      ${logoHTML}
      <strong>${escapeHTML(brand)}</strong>
      <em>${count || 'On request'} ${count === 1 ? 'item' : count ? 'items' : ''}</em>
    </a>`;
  }).join('');
}

function setupFilters() {
  const cat = $('[data-category-filter]'), brand = $('[data-brand-filter]'), origin = $('[data-origin-filter]'), search = $('[data-search]');
  const grid = $('[data-products-grid][data-mode="all"]');
  if (!grid) return;
  const options = list => ['All', ...[...new Set(list)].sort((a, b) => a.localeCompare(b))].map(v => `<option value="${v}">${v}</option>`).join('');
  cat.innerHTML = options(allProducts.map(p => p.category));
  brand.innerHTML = options(allProducts.map(p => p.brand));
  if (origin) origin.innerHTML = options(allProducts.map(p => p.origin || 'International'));
  const params = new URLSearchParams(location.search);
  const setSelectValue = (select, value) => {
    if (!select) return;
    select.value = [...select.options].some(option => option.value === value) ? value : 'All';
  };
  setSelectValue(cat, params.get('category') || 'All');
  setSelectValue(brand, params.get('brand') || 'All');
  setSelectValue(origin, params.get('origin') || 'All');
  search.value = params.get('q') || '';
  const activeFilters = $('[data-active-filters]');
  const quickButtons = $$('[data-quick-filter]');
  const setQuickState = () => quickButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.quickFilter === cat.value || (btn.dataset.quickFilter === 'All' && cat.value === 'All')));
  const renderActiveFilters = () => {
    if (!activeFilters) return;
    const chips = [];
    if (search.value.trim()) chips.push(`Search: ${search.value.trim()}`);
    if (cat.value !== 'All') chips.push(`Category: ${cat.value}`);
    if (brand.value !== 'All') chips.push(`Brand: ${brand.value}`);
    if (origin?.value && origin.value !== 'All') chips.push(`Origin: ${origin.value}`);
    activeFilters.innerHTML = chips.length ? chips.map(chip => `<span>${escapeHTML(chip)}</span>`).join('') : '<span>All products</span>';
  };
  const apply = () => {
    const q = search.value.toLowerCase().trim(); visibleCount = 24;
    filteredProducts = allProducts.filter(p =>
      (cat.value === 'All' || p.category === cat.value) &&
      (brand.value === 'All' || p.brand === brand.value) &&
      (!origin || origin.value === 'All' || (p.origin || 'International') === origin.value) &&
      (!q || `${p.name} ${p.brand} ${p.category} ${p.origin || ''} ${p.tag || ''}`.toLowerCase().includes(q))
    );
    renderGrid(grid, filteredProducts);
    renderActiveFilters();
    setQuickState();
  };
  [cat, brand, origin, search].filter(Boolean).forEach(el => el.addEventListener('input', apply));
  quickButtons.forEach(btn => btn.addEventListener('click', () => { search.value = ''; cat.value = btn.dataset.quickFilter; brand.value = 'All'; if (origin) origin.value = 'All'; apply(); }));
  $('[data-clear-filters]')?.addEventListener('click', () => { search.value = ''; cat.value = 'All'; brand.value = 'All'; if (origin) origin.value = 'All'; apply(); });
  $('[data-load-more]')?.addEventListener('click', () => { visibleCount += 24; renderGrid(grid, filteredProducts); });
  apply();
}

function renderBrands() {
  const el = $('[data-brands-grid]'); if (!el) return;
  const brands = [...new Set(allProducts.map(p => p.brand))].sort();
  el.innerHTML = brands.map(b => `<div class="brand-card">${b}<br><small>${allProducts.filter(p => p.brand === b).length} items</small></div>`).join('');
}

function setupForm() {
  const f = $('[data-quote-form]'); if (!f) return;
  f.addEventListener('submit', e => { e.preventDefault(); const d = new FormData(f); window.open(wa(`Hello SOLA Medical Supply,\nName: ${d.get('name') || ''}\nCountry: ${d.get('country') || ''}\nProducts: ${d.get('products') || ''}\nQuantity: ${d.get('quantity') || ''}\nMessage: ${d.get('message') || ''}`), '_blank'); });
}

setupProductSections(); setupFilters(); renderBrands(); renderHomeCategories(); renderPartnerBrands(); setupForm();

function setupPremiumMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-enhanced');

  const revealTargets = [
    '.section-head',
    '.proof-photo',
    '.proof-copy',
    '.process-grid article',
    '.category-hub-card',
    '.market-pulse-grid article',
    '.partner-brand-card',
    '.fast-moving-grid .product',
    '.buyer-support-grid article',
    '.pricelist-teaser-inner',
    '.telegram-channel-card',
    '.cta-panel',
    '.contact-channel-grid .channel-card',
    '.article-cover'
  ].join(',');

  $$(revealTargets).forEach((el, index) => {
    el.dataset.reveal = '';
    el.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 45}ms`);
  });

  const reveal = entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      observer.unobserve(el);
    });
  };

  const observer = new IntersectionObserver(reveal, { threshold: .14, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => observer.observe(el));

  const statObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const item = entry.target;
      const number = item.querySelector('b');
      if (!number || number.dataset.counted) return;
      number.dataset.counted = 'true';
      const raw = number.textContent.trim();
      const value = parseFloat(raw);
      if (!Number.isFinite(value)) return;
      const suffix = raw.replace(String(value), '');
      const state = { value: 0 };
      const render = v => number.textContent = `${Math.round(v)}${suffix}`;
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / 900, 1);
        state.value = value * (1 - Math.pow(1 - p, 3));
        render(state.value);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      statObserver.unobserve(item);
    });
  }, { threshold: .4 });
  $$('.trust-stats>div').forEach(el => statObserver.observe(el));

  $$('.btn.primary, .cta-btn, .telegram-btn').forEach(btn => {
    btn.classList.add('magnetic-btn');
  });
}

setupPremiumMotion();
