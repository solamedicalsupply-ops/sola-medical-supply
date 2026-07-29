(() => {
  const CODE_PATTERN = /^SOLA-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;
  const $ = selector => document.querySelector(selector);
  const form = $('[data-tracking-search]');
  const input = $('#tracking-code');
  const help = $('[data-search-help]');
  const loading = $('[data-loading]');
  const error = $('[data-error]');
  const result = $('[data-result]');
  const normalize = value => String(value || '').trim().toUpperCase();
  const text = (selector, value) => { const node = $(selector); if (node) node.textContent = value || ''; };
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const formatDate = (value, dateOnly = false) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', dateOnly ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };
  const setState = state => {
    loading.hidden = state !== 'loading';
    error.hidden = state !== 'error';
    result.hidden = state !== 'result';
  };
  const showError = message => {
    text('[data-error-message]', message || 'Please check the code and try again.');
    setState('error');
  };
  const render = data => {
    text('[data-code]', data.trackingCode);
    text('[data-status]', data.statusLabel);
    text('[data-note]', data.publicNote || 'We will share another update as soon as it becomes available.');
    text('[data-updated]', formatDate(data.lastUpdatedAt));
    const destinationWrap = $('[data-destination-wrap]');
    destinationWrap.hidden = !data.destinationCountry;
    text('[data-destination]', data.destinationCountry);
    const from = data.estimatedDelivery?.from;
    const to = data.estimatedDelivery?.to;
    $('[data-estimate-wrap]').hidden = !from;
    text('[data-estimate]', from ? `${formatDate(from, true)}${to ? ` – ${formatDate(to, true)}` : ''}` : '');
    const carrier = $('[data-carrier]');
    carrier.hidden = !(data.localCarrier || data.localTrackingNumber);
    text('[data-carrier-name]', data.localCarrier || 'To be confirmed');
    text('[data-carrier-code]', data.localTrackingNumber || 'Not available yet');
    const carrierLink = $('[data-carrier-link]');
    if (data.localTrackingUrl && /^https:\/\//i.test(data.localTrackingUrl)) {
      carrierLink.href = data.localTrackingUrl;
      carrierLink.hidden = false;
    } else carrierLink.hidden = true;
    const events = Array.isArray(data.events) ? data.events : [];
    $('[data-events-empty]').hidden = events.length > 0;
    $('[data-events]').innerHTML = events.map((event, index) => `<li class="tracking-event">
      <span class="tracking-event-dot" aria-hidden="true">${index === 0 ? '●' : '✓'}</span>
      <article class="tracking-event-card"><div class="tracking-event-head"><h3>${escapeHtml(event.title || event.statusLabel)}</h3><time datetime="${escapeHtml(event.eventTime)}">${escapeHtml(formatDate(event.eventTime))}</time></div>
      ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}${event.location ? `<p class="tracking-event-location">Location: ${escapeHtml(event.location)}</p>` : ''}</article></li>`).join('');
    setState('result');
  };
  const load = async rawCode => {
    const code = normalize(rawCode);
    input.value = code;
    help.classList.remove('is-error');
    if (!CODE_PATTERN.test(code)) {
      help.textContent = 'Enter a valid code in the format SOLA-XXXXXXXX.';
      help.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    setState('loading');
    history.replaceState({}, '', `/track/${encodeURIComponent(code)}`);
    try {
      const response = await fetch(`/api/tracking?code=${encodeURIComponent(code)}`, { cache: 'no-store', headers: { accept: 'application/json' } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Tracking is temporarily unavailable.');
      render(payload);
    } catch (requestError) {
      showError(requestError.message);
    }
  };
  form.addEventListener('submit', event => { event.preventDefault(); void load(input.value); });
  input.addEventListener('input', () => { input.value = input.value.toUpperCase(); help.classList.remove('is-error'); input.removeAttribute('aria-invalid'); });
  $('[data-retry]').addEventListener('click', () => void load(input.value));
  $('[data-copy-code]').addEventListener('click', async event => {
    await navigator.clipboard.writeText($('[data-code]').textContent);
    event.currentTarget.textContent = 'Copied';
    window.setTimeout(() => { event.currentTarget.textContent = 'Copy code'; }, 1600);
  });
  const queryCode = new URLSearchParams(location.search).get('trackingCode');
  const pathMatch = location.pathname.match(/\/track\/([^/]+)\/?$/);
  const initialCode = pathMatch?.[1] || queryCode;
  if (initialCode) void load(decodeURIComponent(initialCode));
})();
