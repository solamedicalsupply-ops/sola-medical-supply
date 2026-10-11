const WHATSAPP_NUMBER = '84981778670';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const allProducts = window.SOLA_PRODUCTS || [];

$$('[data-product-count]').forEach(element => {
  element.textContent = String(allProducts.length);
});
const wa = (text = 'Hello SOLA Medical Supply, I would like to request a wholesale quotation.') => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escapeHTML = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const QUOTE_STORAGE_KEY = 'sola-quote-list';
function readQuoteList() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(QUOTE_STORAGE_KEY) || '[]');
    return new Map((Array.isArray(saved) ? saved : []).filter(name => typeof name === 'string' && name.trim() && name.length <= 200).slice(0, 300).map(name => [name, true]));
  } catch { return new Map(); }
}
const quoteList = readQuoteList();
const homeCategories = [
  { name: 'Dermal Fillers', label: 'Dermal fillers', note: 'Korean and international filler options', icon: 'DF', bg: 'cat-bg-fillers' },
  { name: 'Meso / Skin Boosters', label: 'Meso / skin boosters', note: 'PN, HA and hydration-focused products', icon: 'SB', bg: 'cat-bg-skin' },
  { name: 'Botulinum Toxin', label: 'Botulinum toxin', note: 'Popular professional toxin requests', icon: 'TX', bg: 'cat-bg-toxins' },
  { name: 'Collagen Stimulator / Biostimulator', label: 'Biostimulators', note: 'Collagen stimulator and biostimulator requests', icon: 'BI', bg: 'cat-bg-exosome' },
  { name: 'Fat Dissolving / Weight Loss', label: 'Fat dissolving / weight loss', note: 'Body contouring and weight management options', icon: 'FW', bg: 'cat-bg-body' },
  { name: 'Accessories & Consumables', label: 'Accessories & consumables', note: 'Professional supplies for order planning', icon: 'AC', bg: 'cat-bg-supplies' }
];
const fastProductNames = [
  'Ultrafill', 'Sardenya', 'Rejuran HB', 'Profhilo', 'Asce', 'Botulax 100 Unit', 'Lemon Bottle', 'Mounjaro 2.5mg'
];
const partnerBrands = [
  { name: 'Juvederm', logo: 'assets/images/brand-logos/juvederm.png', filter: 'Juvederm' },
  { name: 'Profhilo', logo: 'assets/images/brand-logos/profhilo.png', filter: 'Profhilo' },
  { name: 'Teoxane', logo: 'assets/images/brand-logos/teoxane.png', filter: 'Teoxane' },
  { name: 'Jalupro', logo: 'assets/images/brand-logos/jalupro.png', filter: 'Jalupro' },
  { name: 'Jetema', logo: 'assets/images/brand-logos/jetema.png', query: 'Jetema' },
  { name: 'Hugel', logo: 'assets/images/brand-logos/hugel.png', filter: 'Botulax' },
  { name: 'White Medience', logo: 'assets/images/brand-logos/white-medience.png', filter: 'White Fill Pro' },
  { name: 'Melsmon', logo: 'assets/images/brand-logos/melsmon.png', filter: 'Melsmon' },
  { name: 'Daewoong', logo: 'assets/images/brand-logos/daewoong.png', filter: 'Nabota' },
  { name: 'Humedix', logo: 'assets/images/brand-logos/humedix.png', query: 'Humedix' },
  { name: 'Medytox', logo: 'assets/images/brand-logos/medytox.png', filter: 'Meditoxin' },
  { name: 'ExoCoBio', logo: 'assets/images/brand-logos/exocobio.png', filter: 'ASCE' }
];

function renderLegacySiteChrome() {
  const path = location.pathname.replace(/\\/g, '/');
  const inBlog = path.includes('/blog/');
  const inProducts = path.includes('/products/');
  const base = inBlog || inProducts ? '../' : '';
  const page = location.pathname.split(/[\\/]/).pop() || 'index.html';
  const section = inBlog ? 'journal' : inProducts ? 'products' : page.replace('.html', '');
  const active = key => section === key ? ' class="active"' : '';
  const header = `<div class="topbar"><div class="wrap"><span>Professional aesthetic wholesale · Worldwide shipping support</span><a data-wa>Talk to a specialist →</a></div></div>
    <nav class="nav"><div class="wrap nav-inner"><a class="brand" href="${base}index.html"><img src="${base}assets/icons/logoNgang.png" alt="SOLA Medical Supply"></a><button class="menu" type="button" aria-label="Open navigation" aria-expanded="false">Menu</button><div class="links">
    <a${active('index')} href="${base}index.html">Home</a><a${active('products')} href="${base}products.html">Products</a><a${active('shipping')} href="${base}shipping.html">Shipping</a><a href="${base}track">Tracking</a><a${active('about')} href="${base}about.html">About</a><a${active('faq')} href="${base}faq.html">FAQ</a><a${active('journal')} href="${base}blog/index.html">Journal</a><a${active('contact')} href="${base}contact.html">Contact</a><a class="btn primary" data-wa>Request a quote</a></div></div></nav>`;
  document.querySelector('.topbar')?.remove();
  document.querySelector('.nav')?.remove();
  document.body.insertAdjacentHTML('afterbegin', header);

  const footer = siteFooter(base);
  document.querySelector('.footer')?.remove();
  document.body.insertAdjacentHTML('beforeend', footer);
}

function navIcon(name, size = 20) {
  const icons = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    box: '<path d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7m-8 4v10"/>',
    bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    message: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3.6-.8L4 19l.9-4A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 4.2 4.2"/>',
    support: '<path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Zm16 0v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2ZM12 21h3"/>'
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.arrow}</svg>`;
}

function basePathForCurrentPage() {
  const path = location.pathname.replace(/\\/g, '/');
  return path.includes('/blog/') || path.includes('/products/') || /^\/track\/[^/]+/.test(path) ? '../' : '';
}

// Keep this menu independent of products.js: detail and journal pages do not load it.
function siteNavigation(base = '') {
  const catalogue = (key, value, extra = {}) => `${base}products.html?${new URLSearchParams({ [key]: value, ...extra })}`;
  const category = (label, value, note) => ({ label, href: catalogue('category', value), note });
  const brand = (label, extra) => ({ label, href: catalogue('brand', label, extra) });
  return [
    {
      id: 'products', label: 'Products', title: 'Find your next order.',
      description: 'Explore the SOLA catalogue by product category. Build a list, then ask our team for availability and a wholesale quote.',
      href: `${base}products.html`, allLabel: 'View all products',
      columns: [
        { title: 'Aesthetic injectables', links: [
          category('Dermal fillers', 'Dermal Fillers'),
          category('Skin boosters', 'Meso / Skin Boosters'),
          category('Botulinum toxin', 'Botulinum Toxin'),
          category('Biostimulators', 'Collagen Stimulator / Biostimulator')
        ] },
        { title: 'Body & wellness', links: [
          category('Fat dissolving & weight management', 'Fat Dissolving / Weight Loss'),
          category('Hair & scalp boosters', 'Hair Booster / Scalp Booster'),
          category('IV whitening', 'IV Whitening Drip'),
          category('IV vitamins', 'IV Infusion / Vitamins')
        ] },
        { title: 'Clinical supplies', links: [
          category('Topical anaesthetics', 'Topical Anaesthetic'),
          category('Injectable anaesthetics', 'Injectable Local Anaesthetic'),
          category('Accessories & consumables', 'Accessories & Consumables')
        ] }
      ]
    },
    {
      id: 'fillers', label: 'Dermal Fillers', title: 'Explore dermal fillers.',
      description: 'Go straight to the filler catalogue or browse familiar brands. Confirm product specifications and availability with our team.',
      href: catalogue('category', 'Dermal Fillers'), allLabel: 'View all dermal fillers',
      columns: [
        { title: 'Explore by brand', links: [brand('Juvéderm', { category: 'Dermal Fillers' }), brand('Restylane', { category: 'Dermal Fillers' })] },
        { title: 'Related categories', links: [category('Skin boosters', 'Meso / Skin Boosters', 'Browse skin booster products'), category('Biostimulators', 'Collagen Stimulator / Biostimulator', 'Explore a separate product category')] },
        { title: 'Plan your order', links: [{ label: 'Wholesale enquiries', href: `${base}contact.html`, note: 'Share your product list and quantities' }, { label: 'Shipping information', href: `${base}shipping.html`, note: 'Read about delivery and order handling' }] }
      ]
    },
    {
      id: 'brands', label: 'Brands', title: 'Your brands. One place.',
      description: 'Find a familiar name and explore its products in the SOLA catalogue.',
      href: `${base}brands.html`, allLabel: 'View all brands',
      columns: [
        { title: 'Fillers & skin quality', links: [brand('Juvéderm'), brand('Restylane'), brand('Profhilo')] },
        { title: 'Skin boosters', links: [brand('Rejuran'), brand('Jalupro'), brand('ASCE')] },
        { title: 'More brands', links: [brand('Hugel'), brand('Daewoong'), brand('Medytox')] }
      ]
    },
    {
      id: 'company', label: 'Company', title: 'Get to know SOLA.',
      description: 'Learn about our business, plan your order and find support at every step.',
      href: `${base}about.html`, allLabel: 'About SOLA',
      columns: [
        { title: 'Discover SOLA', links: [{ label: 'About us', href: `${base}about.html`, note: 'Our company and approach' }, { label: 'Journal', href: `${base}blog/index.html`, note: 'News and buyer insights' }] },
        { title: 'Order support', links: [{ label: 'Shipping', href: `${base}shipping.html`, note: 'Delivery and order handling' }, { label: 'Track an order', href: `${base}track`, note: 'Follow your shipment' }] },
        { title: 'Let’s talk', links: [{ label: 'Frequently asked questions', href: `${base}faq.html` }, { label: 'Contact us', href: `${base}contact.html`, note: 'Speak with the SOLA team' }] }
      ]
    }
  ];
}

function siteFooter(base = '') {
  return `<footer class="footer sola-footer" id="sola-footer">
    <div class="wrap sola-footer-inner">
      <div class="sola-footer-grid">
        <div class="sola-footer-company">
          <a class="sola-footer-logo" href="${base}index.html" aria-label="SOLA Medical Supply home"><img src="${base}assets/icons/logoNgang.png" alt="SOLA Medical Supply" width="168" loading="lazy"></a>
          <address class="sola-footer-address">
            <p>Keangnam Hanoi Landmark Tower, A-72 Story Building, Me Tri Ward, Nam Tu Liem District, Hanoi.</p>
            <p>VAT code: LT130009543714</p>
            <div class="sola-footer-contact"><span>E-mail:</span><a href="mailto:sales@solamedicalsupply.com">sales@solamedicalsupply.com</a></div>
            <div class="sola-footer-contact"><span>Contact no.:</span><a href="tel:+84981778670">+84981778670</a></div>
          </address>
          <a class="sola-footer-support" data-wa>WhatsApp Support <span aria-hidden="true">↗</span></a>
        </div>
        <nav class="sola-footer-links" aria-labelledby="sola-footer-products">
          <h2 id="sola-footer-products">Products</h2>
          <a href="${base}products.html">All products</a>
          <a href="${base}products.html?category=Dermal+Fillers">Dermal fillers</a>
          <a href="${base}products.html?category=Meso+%2F+Skin+Boosters">Skin boosters</a>
          <a href="${base}brands.html">Brands</a>
        </nav>
        <nav class="sola-footer-links" aria-labelledby="sola-footer-company">
          <h2 id="sola-footer-company">Company</h2>
          <a href="${base}about.html">About SOLA</a>
          <a href="${base}contact.html">Contact us</a>
        </nav>
        <nav class="sola-footer-links" aria-labelledby="sola-footer-resources">
          <h2 id="sola-footer-resources">Resources</h2>
          <a href="${base}shipping.html">Shipping</a>
          <a href="${base}track">Track an order</a>
          <a href="${base}blog/index.html">Journal</a>
          <a href="${base}faq.html">FAQ</a>
        </nav>
      </div>
      <div class="sola-footer-bottom"><span>© 2026 SOLA Medical Supply. All rights reserved.</span><span>Professional buyers only · Product availability varies by market</span></div>
    </div>
  </footer>`;
}

function renderSiteChrome() {
  const base = basePathForCurrentPage();
  const main = document.querySelector('main') || document.querySelector('.page-hero, body > section');
  if (main) {
    if (!main.id) main.id = 'sola-main-content';
    main.setAttribute('tabindex', '-1');
  }
  const path = location.pathname.replace(/\\/g, '/');
  const page = location.pathname.split(/[\\/]/).pop() || 'index.html';
  const section = path.includes('/blog/') ? 'journal' : path.includes('/products/') ? 'products' : path === '/track' || path.startsWith('/track/') ? 'track' : page.replace('.html', '');
  const activeSection = ['about', 'shipping', 'track', 'journal', 'faq', 'contact'].includes(section) ? 'company' : section;
  const groups = siteNavigation(base);
  const menuLink = link => `<a class="sola-mega-link${link.note ? ' sola-mega-card' : ''}" href="${escapeHTML(link.href)}"><span>${escapeHTML(link.label)}${link.note ? `<small>${escapeHTML(link.note)}</small>` : ''}</span>${navIcon('arrow', 16)}</a>`;
  const columns = group => group.columns.map(column => `<div class="sola-mega-column"><h3>${escapeHTML(column.title)}</h3>${column.links.map(menuLink).join('')}</div>`).join('');
  const dropdown = group => `<div class="sola-menu-item"><button class="sola-nav-link${activeSection === group.id ? ' active' : ''}" id="sola-${group.id}-trigger" type="button" data-sola-dropdown="${group.id}" aria-expanded="false" aria-controls="sola-${group.id}-menu">${group.label}${navIcon('chevron', 14)}</button><div class="sola-mega" id="sola-${group.id}-menu" role="region" aria-labelledby="sola-${group.id}-trigger" hidden><div class="sola-mega-layout"><div class="sola-mega-intro"><small class="sola-eyebrow">SOLA MEDICAL SUPPLY</small><strong class="sola-mega-title">${group.title}</strong><p>${group.description}</p><a class="sola-mega-all" href="${escapeHTML(group.href)}">${group.allLabel}${navIcon('arrow', 17)}</a></div><div class="sola-mega-columns">${columns(group)}</div></div><div class="sola-mega-footer"><small>For professional buyers · Availability varies by market</small><a href="${base}contact.html">Need help finding a product? ${navIcon('arrow', 15)}</a></div></div></div>`;
  const mobileGroup = group => `<div class="sola-mobile-group"><button class="sola-mobile-section" type="button" data-sola-accordion aria-expanded="false" aria-controls="sola-mobile-${group.id}">${group.label}${navIcon('chevron', 18)}</button><div id="sola-mobile-${group.id}" class="sola-drawer-submenu" hidden><a class="sola-mobile-all" href="${escapeHTML(group.href)}">${group.allLabel}${navIcon('arrow', 16)}</a>${columns(group)}</div></div>`;
  const header = `<header class="sola-site-header" data-sola-header>
    ${main ? `<a class="sola-skip-link" href="#${main.id}">Skip to content</a>` : ''}
    <div class="sola-topbar"><div class="wrap sola-topbar-inner"><span class="sola-topbar-primary">${navIcon('box', 15)} Professional B2B Aesthetic Supply</span><span class="sola-topbar-meta"><span>${navIcon('globe', 14)} Worldwide Shipping</span><span>${navIcon('support', 14)} Fast, Direct Support</span></span><a class="sola-topbar-wa" data-wa>${navIcon('message', 14)} WhatsApp Support</a></div></div>
    <div class="sola-nav-sticky"><nav class="sola-navbar wrap" aria-label="Primary navigation"><button class="sola-mobile-menu-button" type="button" data-sola-drawer-open aria-expanded="false" aria-controls="sola-mobile-drawer" aria-label="Open navigation">${navIcon('menu', 25)}</button><a class="sola-brand" href="${base}index.html" aria-label="SOLA Medical Supply home"><img src="${base}assets/icons/logoNgang.png" alt="SOLA Medical Supply"></a><div class="sola-desktop-nav">${groups.map(dropdown).join('')}</div><div class="sola-nav-actions"><button class="sola-icon-button" type="button" data-sola-search-toggle aria-expanded="false" aria-controls="sola-search-panel" aria-label="Search products">${navIcon('search')}</button><button class="sola-icon-button sola-quote-toggle" type="button" data-sola-quote-toggle aria-expanded="false" aria-controls="sola-quote-panel" aria-label="Quote list, ${quoteList.size} products">${navIcon('bag')}<span class="sola-quote-count" data-quote-count aria-hidden="true">${quoteList.size}</span></button><a class="sola-quote-cta" href="${base}contact.html"><span>Request quote</span>${navIcon('arrow', 17)}</a></div></nav><div class="sola-search-panel" id="sola-search-panel" hidden><form class="sola-search-form" data-sola-search-form role="search"><label for="sola-global-search">Search the catalogue</label><div><span>${navIcon('search', 18)}</span><input id="sola-global-search" name="q" type="search" autocomplete="off" placeholder="Search products or brands..."><button type="submit">Search</button><button class="sola-search-close" type="button" data-sola-search-close aria-label="Close search">${navIcon('close', 19)}</button></div></form><div class="sola-search-suggestions"><span>Explore:</span><a href="${base}products.html?brand=Profhilo">Profhilo</a><a href="${base}products.html?brand=Rejuran">Rejuran</a><a href="${base}products.html?category=Dermal+Fillers">Dermal fillers</a></div></div></div>
    <section class="sola-quote-panel" id="sola-quote-panel" aria-labelledby="sola-quote-title" hidden><div class="sola-panel-heading"><h2 id="sola-quote-title">Your quote list</h2><button class="sola-icon-button" type="button" data-sola-quote-close aria-label="Close quote list">${navIcon('close')}</button></div><div data-sola-quote-content></div><div class="sola-quote-footer"><button class="sola-quote-cta" type="button" data-send-quote>Request via WhatsApp ${navIcon('arrow', 17)}</button><a href="${base}products.html">Continue browsing</a><small>Confirm quantities and destination with our team.</small></div></section>
    <button class="sola-drawer-overlay" type="button" data-sola-drawer-close tabindex="-1" aria-label="Close navigation" hidden></button><aside class="sola-mobile-drawer" id="sola-mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile navigation" hidden><div class="sola-drawer-top"><a class="sola-brand" href="${base}index.html" aria-label="SOLA Medical Supply home"><img src="${base}assets/icons/logoNgang.png" alt="SOLA Medical Supply"></a><button class="sola-icon-button" type="button" data-sola-drawer-close aria-label="Close navigation">${navIcon('close')}</button></div><form class="sola-mobile-search" data-sola-search-form role="search"><label for="sola-mobile-search">Search products or brands</label><div><input id="sola-mobile-search" name="q" type="search" placeholder="Search products or brands"><button class="sola-icon-button" type="submit" aria-label="Search catalogue">${navIcon('search')}</button></div></form><nav class="sola-drawer-links" aria-label="Mobile primary navigation">${groups.map(mobileGroup).join('')}<a href="${base}shipping.html">Shipping</a><a href="${base}track">Track an order</a></nav><div class="sola-drawer-actions"><a class="sola-quote-cta" href="${base}contact.html"><span>Request quote</span>${navIcon('arrow', 17)}</a><a class="sola-drawer-wa" data-wa>${navIcon('message', 18)} WhatsApp Support</a></div></aside>
  </header>`;
  document.querySelector('.topbar')?.remove();
  document.querySelector('.nav')?.remove();
  document.body.insertAdjacentHTML('afterbegin', header);
  const footer = siteFooter(base);
  document.querySelector('.footer')?.remove();
  document.body.insertAdjacentHTML('beforeend', footer);
}

renderSiteChrome();

function setupSiteHeader() {
  const header = $('[data-sola-header]');
  if (!header) return;
  const drawer = $('#sola-mobile-drawer');
  const drawerToggle = $('[data-sola-drawer-open]', header);
  const overlay = $('.sola-drawer-overlay', header);
  const searchPanel = $('#sola-search-panel');
  const searchToggle = $('[data-sola-search-toggle]', header);
  const searchInput = $('#sola-global-search');
  const quotePanel = $('#sola-quote-panel');
  const quoteToggle = $('[data-sola-quote-toggle]', header);
  const dropdowns = $$('[data-sola-dropdown]', header);
  const desktop = window.matchMedia('(min-width: 1101px)');
  const inertStates = new Map();
  let hoverTimer;
  const setDropdown = (button, open) => {
    button.setAttribute('aria-expanded', String(open));
    button.closest('.sola-menu-item').classList.toggle('is-open', open);
    document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
  };
  const closeDropdowns = except => $$('[data-sola-dropdown]', header).forEach(button => {
    if (button !== except) setDropdown(button, false);
  });
  const closeSearch = (restore = false) => {
    searchPanel.hidden = true;
    searchToggle.setAttribute('aria-expanded', 'false');
    if (restore) searchToggle.focus();
  };
  const closeQuote = (restore = false) => {
    quotePanel.hidden = true;
    quoteToggle.setAttribute('aria-expanded', 'false');
    if (restore) quoteToggle.focus();
  };
  const closeDrawer = (restore = false) => {
    if (drawer.hidden) return;
    drawer.hidden = true;
    overlay.hidden = true;
    drawer.classList.remove('is-open');
    drawerToggle.setAttribute('aria-expanded', 'false');
    inertStates.forEach((inert, element) => { element.inert = inert; });
    inertStates.clear();
    document.body.classList.remove('sola-nav-locked');
    if (restore) drawerToggle.focus();
  };
  const openDrawer = () => {
    clearTimeout(hoverTimer);
    closeDropdowns();
    closeSearch();
    closeQuote();
    drawer.hidden = false;
    overlay.hidden = false;
    drawer.classList.add('is-open');
    drawerToggle.setAttribute('aria-expanded', 'true');
    [...document.body.children, ...header.children].filter(element => element !== header && element !== drawer && element !== overlay).forEach(element => {
      inertStates.set(element, element.inert);
      element.inert = true;
    });
    document.body.classList.add('sola-nav-locked');
    $('[data-sola-drawer-close]', drawer).focus();
  };
  const openDropdown = button => {
    closeSearch();
    closeQuote();
    closeDropdowns(button);
    setDropdown(button, true);
  };
  dropdowns.forEach((button, index) => {
    const item = button.closest('.sola-menu-item');
    button.addEventListener('click', () => {
      clearTimeout(hoverTimer);
      const open = button.getAttribute('aria-expanded') === 'true';
      if (open) setDropdown(button, false); else openDropdown(button);
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        clearTimeout(hoverTimer);
        openDropdown(button);
        const links = $$('.sola-mega a', item);
        (event.key === 'ArrowUp' ? links.at(-1) : links[0])?.focus();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        closeDropdowns();
        dropdowns[(index + (event.key === 'ArrowRight' ? 1 : -1) + dropdowns.length) % dropdowns.length].focus();
      }
    });
    item.addEventListener('pointerenter', event => {
      clearTimeout(hoverTimer);
      if (desktop.matches && event.pointerType === 'mouse') hoverTimer = setTimeout(() => openDropdown(button), 180);
    });
    item.addEventListener('pointerleave', event => {
      clearTimeout(hoverTimer);
      if (event.pointerType === 'mouse' && !item.contains(document.activeElement)) hoverTimer = setTimeout(() => setDropdown(button, false), 220);
    });
  });
  searchToggle.addEventListener('click', () => {
    clearTimeout(hoverTimer);
    const isOpen = !searchPanel.hidden;
    closeDropdowns();
    closeQuote();
    searchPanel.hidden = isOpen;
    searchToggle.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) searchInput.focus();
  });
  quoteToggle.addEventListener('click', () => {
    clearTimeout(hoverTimer);
    const isOpen = !quotePanel.hidden;
    closeDropdowns();
    closeSearch();
    quotePanel.hidden = isOpen;
    quoteToggle.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) $('[data-sola-quote-close]', quotePanel).focus();
  });
  $('[data-sola-search-close]', header).addEventListener('click', () => closeSearch(true));
  $('[data-sola-quote-close]', header).addEventListener('click', () => closeQuote(true));
  $$('[data-sola-search-form]', header).forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const query = new FormData(form).get('q')?.trim();
    location.href = `${basePathForCurrentPage()}products.html${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  }));
  drawerToggle.addEventListener('click', openDrawer);
  $$('[data-sola-drawer-close]', header).forEach(button => button.addEventListener('click', () => closeDrawer(true)));
  $$('a', drawer).forEach(link => link.addEventListener('click', () => closeDrawer()));
  $$('[data-sola-accordion]', drawer).forEach(button => button.addEventListener('click', () => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
  }));
  document.addEventListener('click', event => {
    if (!event.target.closest('.sola-menu-item')) {
      clearTimeout(hoverTimer);
      closeDropdowns();
    }
    if (!header.contains(event.target)) {
      closeSearch();
      closeQuote();
    }
  });
  document.addEventListener('focusin', event => {
    dropdowns.forEach(button => {
      if (!button.closest('.sola-menu-item').contains(event.target)) setDropdown(button, false);
    });
    if (!searchPanel.contains(event.target) && event.target !== searchToggle) closeSearch();
    if (!quotePanel.contains(event.target) && event.target !== quoteToggle) closeQuote();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      clearTimeout(hoverTimer);
      const openButton = dropdowns.find(button => button.getAttribute('aria-expanded') === 'true');
      if (!drawer.hidden) closeDrawer(true);
      else if (!searchPanel.hidden) closeSearch(true);
      else if (!quotePanel.hidden) closeQuote(true);
      else if (openButton) openButton.focus();
      closeDropdowns();
    }
    if (event.key === 'Tab' && !drawer.hidden) {
      const focusable = $$('a[href], button, input', drawer).filter(element => !element.disabled && element.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  desktop.addEventListener('change', () => {
    clearTimeout(hoverTimer);
    closeDrawer();
    closeDropdowns();
    closeSearch();
    closeQuote();
    if (!document.activeElement?.getClientRects().length) (desktop.matches ? dropdowns[0] : drawerToggle).focus();
  });
  let ticking = false;
  const setScrolled = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    header.style.setProperty('--sola-panel-top', `${Math.max(8, $('.sola-navbar', header).getBoundingClientRect().bottom + 8)}px`);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(setScrolled);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', setScrolled, { passive: true });
  setScrolled();
}

setupSiteHeader();
$$('[data-wa]').forEach(a => a.href = wa(a.dataset.wa || undefined));

let visibleCount = 24;
let filteredProducts = allProducts;

function productFlag(p) {
  if (['Botulinum Toxin', 'Meso / Skin Boosters', 'Fat Dissolving / Weight Loss', 'Hair Booster / Scalp Booster'].includes(p.category)) return 'Fast-moving SKU';
  if ((p.origin || '').toLowerCase() === 'korea') return 'Korean supply';
  if ((p.category || '').toLowerCase().includes('injection')) return 'Clinic essential';
  return 'Wholesale quote';
}

function productCard(p) {
  const selected = quoteList.has(p.name);
  const action = $('#sola-quote-panel')
    ? `<button class="add-quote ${selected ? 'selected' : ''}" data-add-quote="${escapeHTML(p.name)}" aria-pressed="${selected}">${selected ? 'Added ✓' : '+ Add to quote'}</button>`
    : `<a class="add-quote" href="${wa('Hello SOLA Medical Supply, please quote: ' + p.name)}" target="_blank">Request quotation →</a>`;
  const url = `products/${slugify(p.name)}.html`;
  const media = p.detail === false
    ? `<span><img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async"></span>`
    : `<a href="${url}"><img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async"></a>`;
  const title = p.detail === false ? p.name : `<a href="${url}">${p.name}</a>`;
  return `<article class="product">
    <figure>${media}</figure>
    <div class="product-body"><div class="product-flags"><span>${productFlag(p)}</span><span>${p.origin || 'Global'}</span></div><h3>${title}</h3><div class="meta"><span class="badge">${p.category}</span><span class="badge">${p.brand}</span></div>
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
  $$('[data-quote-count]').forEach(count => { count.textContent = quoteList.size; });
  $$('[data-sola-quote-toggle]').forEach(button => button.setAttribute('aria-label', `Quote list, ${quoteList.size} products`));
  drawer?.classList.toggle('open', quoteList.size > 0);
  $$('[data-send-quote]').forEach(send => { send.disabled = quoteList.size === 0; });
  $$('[data-add-quote]').forEach(button => {
    const selected = quoteList.has(button.dataset.addQuote);
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = selected ? 'Added ✓' : '+ Add to quote';
  });
  const content = $('[data-sola-quote-content]');
  if (content) content.innerHTML = quoteList.size
    ? `<ul class="sola-quote-items">${[...quoteList.keys()].map(name => `<li><span>${escapeHTML(name)}</span><button class="sola-icon-button" type="button" data-remove-quote="${escapeHTML(name)}" aria-label="Remove ${escapeHTML(name)}">${navIcon('close', 16)}</button></li>`).join('')}</ul>`
    : '<div class="sola-quote-empty"><p>Your quote list is empty.</p><p>Add products from the catalogue to request a combined quotation.</p></div>';
  try { sessionStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify([...quoteList.keys()])); } catch { /* Selection still works when storage is unavailable. */ }
}

document.addEventListener('click', e => {
  const add = e.target.closest('[data-add-quote]');
  if (add) {
    const name = add.dataset.addQuote;
    quoteList.has(name) ? quoteList.delete(name) : quoteList.set(name, true);
    updateQuoteBar();
  }
  const remove = e.target.closest('[data-remove-quote]');
  if (remove) {
    const buttons = $$('[data-remove-quote]');
    const index = buttons.indexOf(remove);
    quoteList.delete(remove.dataset.removeQuote);
    updateQuoteBar();
    const remaining = $$('[data-remove-quote]');
    (remaining[Math.min(index, remaining.length - 1)] || $('[data-sola-quote-close]'))?.focus();
  }
  if (e.target.closest('[data-send-quote]') && quoteList.size) {
    const items = [...quoteList.keys()].map((name, i) => `${i + 1}. ${name} — Qty:`).join('\n');
    window.open(wa(`Hello SOLA Medical Supply, please quote the following products:\n\n${items}\n\nDestination country:`), '_blank', 'noopener,noreferrer');
  }
});

updateQuoteBar();

// Back/forward navigation may restore an old page heap from the browser cache.
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  const restored = readQuoteList();
  quoteList.clear();
  restored.forEach((value, name) => quoteList.set(name, value));
  updateQuoteBar();
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
    return `<a class="category-hub-card ${cat.bg}" href="${href}">
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
  const card = (brand, hidden = false) => {
    const href = brand.filter ? `products.html?brand=${encodeURIComponent(brand.filter)}` : `products.html?q=${encodeURIComponent(brand.query || brand.name)}`;
    return `<a class="partner-brand-card has-logo" href="${href}" aria-label="View ${escapeHTML(brand.name)} products"${hidden ? ' aria-hidden="true" tabindex="-1"' : ''}>
      <img class="partner-logo" src="${brand.logo}" alt="${escapeHTML(brand.name)} logo" loading="lazy" onerror="this.closest('.partner-brand-card').classList.remove('has-logo');this.remove()">
      <strong>${escapeHTML(brand.name)}</strong>
    </a>`;
  };
  const primary = partnerBrands.map(brand => card(brand)).join('');
  const duplicate = partnerBrands.map(brand => card(brand, true)).join('');
  el.innerHTML = `<div class="partner-brand-track">${primary}${duplicate}</div>`;
}

function normalizeBlogLink(href = '') {
  if (!href) return 'blog/index.html';
  if (/^(https?:|mailto:|tel:|#)/i.test(href) || href.startsWith('/')) return href;
  if (href.startsWith('blog/')) return href;
  if (href.startsWith('../')) return href.replace(/^\.\.\//, '');
  return `blog/${href}`;
}

function normalizeBlogImage(src = '') {
  if (!src) return 'assets/images/productCatalogue.png';
  if (/^https?:/i.test(src) || src.startsWith('/')) return src;
  if (src.startsWith('../assets/')) return src.replace('../', '');
  if (src.startsWith('assets/')) return src;
  return `blog/${src}`;
}

async function renderLatestJournalPosts() {
  const grid = $('[data-home-journal]');
  if (!grid) return;
  try {
    const response = await fetch('blog/index.html', { cache: 'no-store' });
    if (!response.ok) return;
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const posts = [...doc.querySelectorAll('.posts-grid-new .story-card')].slice(0, 3);
    if (posts.length < 3) return;
    grid.innerHTML = posts.map(post => {
      const img = post.querySelector('img');
      const meta = post.querySelector('span')?.textContent.trim() || 'SOLA JOURNAL';
      const title = post.querySelector('h3')?.textContent.trim() || 'SOLA buyer insight';
      const cta = post.querySelector('b')?.textContent.trim() || 'Read article →';
      return `<a href="${escapeHTML(normalizeBlogLink(post.getAttribute('href') || ''))}">
        <figure><img src="${escapeHTML(normalizeBlogImage(img?.getAttribute('src') || ''))}" alt="${escapeHTML(img?.getAttribute('alt') || title)}" loading="lazy"></figure>
        <span>${escapeHTML(meta)}</span>
        <h3>${escapeHTML(title)}</h3>
        <b>${escapeHTML(cta)}</b>
      </a>`;
    }).join('');
  } catch (error) {
    /* Keep the static fallback posts when local file preview blocks fetch. */
  }
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

setupProductSections(); setupFilters(); renderBrands(); renderHomeCategories(); renderPartnerBrands(); renderLatestJournalPosts(); setupForm();

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
