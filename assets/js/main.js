const WHATSAPP_NUMBER = '84981778670';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const allProducts = window.SOLA_PRODUCTS || [];
const wa = (text = 'Hello SOLA Medical Supply, I would like to request a wholesale quotation.') => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

function productCard(p) {
  const selected = quoteList.has(p.name);
  const action = $('[data-quote-drawer]')
    ? `<button class="add-quote ${selected ? 'selected' : ''}" data-add-quote="${p.name.replace(/"/g, '&quot;')}">${selected ? 'Added ✓' : '+ Add to quote'}</button>`
    : `<a class="add-quote" href="${wa('Hello SOLA Medical Supply, please quote: ' + p.name)}" target="_blank">Request quotation →</a>`;
  const url = `products/${slugify(p.name)}.html`;
  return `<article class="product">
    <figure><a href="${url}"><img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async"></a></figure>
    <div class="product-body"><h3><a href="${url}">${p.name}</a></h3><div class="meta"><span class="badge">${p.category}</span><span class="badge">${p.brand}</span></div>
    <p>${p.origin || 'International'} supply • ${p.tag || 'Available on request'}</p>
    ${action}</div>
  </article>`;
}

function renderGrid(grid, list) {
  const isFull = grid.dataset.mode === 'all';
  const shown = isFull ? list.slice(0, visibleCount) : list;
  grid.innerHTML = shown.map(productCard).join('') || '<p>No products found. Try another search.</p>';
  const count = $('[data-results-count]');
  if (count && isFull) count.textContent = `${list.length} products found`;
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
  $$('[data-products-grid]').forEach(grid => renderGrid(grid, grid.dataset.mode === 'featured' ? allProducts.filter(p => p.featured) : allProducts));
}

function setupFilters() {
  const cat = $('[data-category-filter]'), brand = $('[data-brand-filter]'), search = $('[data-search]');
  const grid = $('[data-products-grid][data-mode="all"]');
  if (!grid) return;
  const options = list => ['All', ...[...new Set(list)].sort((a, b) => a.localeCompare(b))].map(v => `<option value="${v}">${v}</option>`).join('');
  cat.innerHTML = options(allProducts.map(p => p.category));
  brand.innerHTML = options(allProducts.map(p => p.brand));
  cat.value = 'All';
  brand.value = 'All';
  const apply = () => {
    const q = search.value.toLowerCase().trim(); visibleCount = 24;
    filteredProducts = allProducts.filter(p => (cat.value === 'All' || p.category === cat.value) && (brand.value === 'All' || p.brand === brand.value) && (!q || `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q)));
    renderGrid(grid, filteredProducts);
  };
  [cat, brand, search].forEach(el => el.addEventListener('input', apply));
  $('[data-clear-filters]')?.addEventListener('click', () => { search.value = ''; cat.value = 'All'; brand.value = 'All'; apply(); });
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

setupProductSections(); setupFilters(); renderBrands(); setupForm();

function loadMotionLibrary() {
  if (window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve(window.gsap || null);
  }
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    script.defer = true;
    script.onload = () => resolve(window.gsap || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function setupPremiumMotion(gsap) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-enhanced');

  const revealTargets = [
    '.section-head',
    '.catalogue-feature .product',
    '.proof-photo',
    '.proof-copy',
    '.process-grid article',
    '.buyer-support-grid article',
    '.pricelist-teaser-inner',
    '.telegram-channel-card',
    '.home-journal-grid a',
    '.cta-panel',
    '.contact-channel-grid .channel-card',
    '.story-card',
    '.brand-card',
    '.article-cover',
    '.article-body h2',
    '.article-body p'
  ].join(',');

  $$(revealTargets).forEach((el, index) => {
    el.dataset.reveal = '';
    el.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
  });

  const reveal = entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      if (gsap) {
        gsap.fromTo(el,
          { y: 34, opacity: 0, filter: 'blur(8px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: .78, ease: 'power3.out', overwrite: true }
        );
      }
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
      if (gsap) {
        gsap.to(state, { value, duration: 1.35, ease: 'power2.out', onUpdate: () => render(state.value) });
      } else {
        const start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / 1200, 1);
          render(value * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      statObserver.unobserve(item);
    });
  }, { threshold: .4 });
  $$('.trust-stats>div').forEach(el => statObserver.observe(el));

  const hero = $('.lux-hero');
  if (hero) {
    let raf = 0;
    hero.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - .5) * 18;
        const y = ((e.clientY - rect.top) / rect.height - .5) * 18;
        hero.style.setProperty('--hero-x', `${x}px`);
        hero.style.setProperty('--hero-y', `${y}px`);
      });
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--hero-x', '0px');
      hero.style.setProperty('--hero-y', '0px');
    });
  }

  $$('.btn.primary, .cta-btn, .telegram-btn').forEach(btn => {
    btn.classList.add('magnetic-btn');
    btn.addEventListener('pointermove', e => {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${(e.clientX - rect.left - rect.width / 2) * .16}px`);
      btn.style.setProperty('--my', `${(e.clientY - rect.top - rect.height / 2) * .16}px`);
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--mx', '0px');
      btn.style.setProperty('--my', '0px');
    });
  });
}

loadMotionLibrary().then(setupPremiumMotion);
