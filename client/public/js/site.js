/* Kishaa International — public site behaviour. No external dependencies. */
(function () {
  'use strict';

  /* ------------------------------------------------------------- helpers */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function track(name, props) {
    try {
      // Analytics events never carry personal information — the server enforces this too.
      const body = JSON.stringify({ name: name, path: location.pathname, props: props || {} });
      const meta = document.querySelector('meta[name=csrf-token]');
      const token = meta ? meta.getAttribute('content') : '';
      if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      else fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': token }, body: body, keepalive: true });
    } catch (e) { /* never break the page for analytics */ }
  }
  window.kiTrack = track;

  /* -------------------------------------------------------------- drawer */
  const drawer = $('#drawer');
  const burger = $('#burger');
  if (drawer && burger) {
    const open = () => { drawer.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; const f = drawer.querySelector('a,button'); if (f) f.focus(); };
    const close = () => { drawer.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; burger.focus(); };
    burger.addEventListener('click', open);
    $$('[data-close="drawer"]', drawer).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });
  }

  /* -------------------------------------------------------- cookie banner */
  const bar = $('#cookieBar');
  if (bar) {
    if (!localStorage.getItem('ki_cookie_choice')) { bar.hidden = false; }
    $$('[data-cookie]', bar).forEach(btn => btn.addEventListener('click', () => {
      const choice = btn.getAttribute('data-cookie');
      localStorage.setItem('ki_cookie_choice', choice);
      bar.hidden = true;
      track('cookie_choice', { choice: choice });
    }));
  }

  /* -------------------------------------------------------- reveal on scroll */
  const reveals = $$('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      reveals.forEach(el => io.observe(el));
    }
  }

  /* ------------------------------------------------- city options by country */
  const citySelect = $('#city');
  const countrySelect = $('#country');
  const citiesEl = $('#plannerCities');
  if (citySelect && countrySelect && citiesEl) {
    let map = {};
    try { map = JSON.parse(citiesEl.textContent); } catch (e) { map = {}; }
    const fill = () => {
      const list = map[countrySelect.value] || [];
      citySelect.innerHTML = list.map(c => '<option value="' + c + '">' + c + '</option>').join('');
      if (!list.length) citySelect.innerHTML = '<option value="">No published city profile</option>';
    };
    countrySelect.addEventListener('change', fill);
    fill();
  }

  /* ----------------------------------------------------- form improvements */
  $$('form[action="/contact"]').forEach(form => {
    form.addEventListener('submit', (e) => {
      const firstInvalid = form.querySelector('[required]:invalid');
      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
        firstInvalid.setAttribute('aria-invalid', 'true');
        return;
      }
      const btn = form.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      track('lead_form_submitted', { page: location.pathname });
      // Re-enable if the browser restores the page from cache after navigation
      setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = 'Send enquiry'; } }, 8000);
    });
  });

  /* -------------------------------------------------------- enquiry CTAs */
  $$('a[href^="/contact"]').forEach(a => a.addEventListener('click', () => {
    track('cta_click', { href: a.getAttribute('href').slice(0, 120), page: location.pathname });
  }));
  $$('a[href*="wa.me"]').forEach(a => a.addEventListener('click', () => track('whatsapp_click', { page: location.pathname })));

  /* --------------------------------------------------------- planner events */
  const plannerForm = $('form[action="/cost-planner"]');
  if (plannerForm) {
    plannerForm.addEventListener('submit', () => track('planner_submitted', { country: (countrySelect || {}).value || null }));
  }
  $$('a[href^="/destinations/"]').forEach(a => a.addEventListener('click', () => {
    track('destination_click', { href: a.getAttribute('href') });
  }));

  /* ------------------------------------------------------------ print-only */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    const text = btn.getAttribute('data-copy');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { btn.textContent = 'Copied'; });
  }));
})();
