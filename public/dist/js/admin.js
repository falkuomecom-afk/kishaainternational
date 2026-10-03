/* ================================================================
   KISHAA CMS — admin workspace behaviour
   Block builder, autosave, media picker, tabs, filters, confirmations.
   ================================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ------------------------------------------------------- mobile nav --- */
  $$('[data-nav-toggle]').forEach(btn => btn.addEventListener('click', () => document.body.classList.toggle('nav-open')));

  /* ------------------------------------------------------- confirmation -- */
  $$('form[data-confirm]').forEach(f => f.addEventListener('submit', (e) => {
    if (!window.confirm(f.getAttribute('data-confirm'))) e.preventDefault();
  }));

  /* ------------------------------------------------------------- tabs ---- */
  $$('[data-tabs]').forEach(group => {
    const links = $$('[data-tab]', group);
    const show = (name) => {
      links.forEach(a => a.classList.toggle('on', a.getAttribute('data-tab') === name));
      $$('[data-tab-panel]').forEach(p => { p.hidden = p.getAttribute('data-tab-panel') !== name; });
    };
    links.forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); show(a.getAttribute('data-tab')); }));
    if (links[0]) show(links[0].getAttribute('data-tab'));
  });

  /* ============================== BLOCK BUILDER ========================== */
  const list = $('#blockList');
  if (list) {
    const tpl = $('#blockTemplate');
    const picker = $('#blockPicker');
    const labels = {}; const helps = {};
    // Block labels and help text are read from the add-block gallery so they always match the server.
    document.querySelectorAll('[data-add-block]').forEach(b => {
      const t = b.getAttribute('data-add-block');
      if (!t) return;
      labels[t] = (b.querySelector('b') || {}).textContent || t;
      helps[t] = (b.querySelector('span') || {}).textContent || '';
    });
    window.__BLOCK_LABELS = labels; window.__BLOCK_HELP = helps;

    // Which controls each block type actually uses — keeps editors focused.
    const FIELDS = {
      hero: ['eyebrow', 'title', 'subtitle', 'actions', 'badges', 'stats', 'variant', 'compact'],
      answerFirst: ['question', 'answer', 'title'],
      pillars: ['heading', 'subheading', 'items'],
      programCards: ['heading', 'subheading', 'pillar', 'filter', 'limit'],
      destinations: ['heading', 'subheading', 'countries', 'limit'],
      plannerTeaser: ['heading', 'subheading', 'preselect'],
      trainer: ['heading', 'teamSlug'],
      process: ['heading', 'subheading', 'steps'],
      richtext: ['html'],
      imageText: ['heading', 'subheading', 'html', 'bullets', 'image', 'reverse'],
      stats: ['heading', 'stats'],
      reviews: ['heading', 'subheading', 'limit'],
      feeds: ['heading', 'subheading', 'limit'],
      table: ['heading', 'columns', 'rows', 'note'],
      fundsTable: ['heading', 'subheading'],
      checklist: ['heading', 'subheading', 'bullets'],
      comparison: ['heading', 'columns', 'rows', 'note'],
      notice: ['tone', 'heading', 'text'],
      faq: ['heading', 'category', 'limit'],
      enquiryForm: ['heading', 'subheading', 'preselect', 'variant'],
      contactCards: ['heading', 'subheading'],
      cta: ['heading', 'subheading', 'actions', 'variant'],
      sources: ['heading', 'items'],
      thankYou: ['heading', 'subheading'],
    };

    function updateFields(row) {
      const type = $('select[name="block_type[]"]', row).value;
      const allowed = FIELDS[type] || [];
      $$('[data-field]', row).forEach(f => {
        f.hidden = allowed.length ? !allowed.includes(f.getAttribute('data-field')) : false;
      });
      const lab = $('[data-type-label]', row); if (lab) lab.textContent = labels[type] || type;
      const help = $('[data-type-help]', row); if (help) help.textContent = helps[type] || '';
    }

    function wire(row) {
      $('select[name="block_type[]"]', row).addEventListener('change', () => updateFields(row));
      $$('[data-move]', row).forEach(b => b.addEventListener('click', () => {
        const dir = b.getAttribute('data-move');
        const sib = dir === 'up' ? row.previousElementSibling : row.nextElementSibling;
        if (!sib) return;
        if (dir === 'up') list.insertBefore(row, sib); else list.insertBefore(sib, row);
      }));
      $$('[data-remove]', row).forEach(b => b.addEventListener('click', () => {
        if (window.confirm('Remove this block from the page?')) row.remove();
      }));
      $$('[data-collapse]', row).forEach(b => b.addEventListener('click', () => row.classList.toggle('collapsed')));
      updateFields(row);
      return row;
    }

    function fill(row, data) {
      $$('[data-key]', row).forEach(control => {
        const key = control.getAttribute('data-key');
        const value = data ? data[key] : undefined;
        if (control.type === 'checkbox') { control.checked = !!value && value !== '0'; return; }
        if (value === undefined || value === null) { control.value = ''; return; }
        control.value = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      });
    }

    function createRow(data) {
      const wrap = document.createElement('div');
      wrap.innerHTML = tpl.innerHTML.trim();
      const row = wrap.firstElementChild;
      list.appendChild(row);
      fill(row, data || {});
      return wire(row);
    }

    // hydrate the blocks saved on this page (single source of truth passed from the server)
    const blob = $('#pageBlocks');
    let saved = [];
    try { saved = JSON.parse(blob ? blob.textContent : '[]') || []; } catch (e) { saved = []; }
    list.innerHTML = '';
    if (saved.length) saved.forEach(b => createRow(b));
    else { createRow({ type: 'richtext' }); }

    $$('[data-add-block]').forEach(btn => btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-add-block');
      if (type) { const r = createRow({ type }); r.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      if (picker) picker.hidden = !picker.hidden;
    }));
    $$('[data-close-picker]').forEach(b => b.addEventListener('click', () => { if (picker) picker.hidden = true; }));

    // media tiles fill the image input of the first visible image field
    $$('[data-pick-media]').forEach(b => b.addEventListener('click', () => {
      const field = $(b.getAttribute('data-pick-media'));
      const tile = b.closest('[data-media-tile]');
      if (field && tile) { field.value = tile.getAttribute('data-media-tile'); field.focus(); }
    }));
  }

  /* ================================ AUTOSAVE ============================= */
  const form = $('#contentForm');
  if (form) {
    const status = $('#autosaveStatus');
    const autosaveUrl = form.getAttribute('data-autosave');
    const idField = form.querySelector('[name=record_id]');
    const recordId = idField ? idField.value : null;
    let dirty = false;
    form.addEventListener('input', () => { dirty = true; if (status) status.textContent = 'Unsaved changes'; });
    form.addEventListener('submit', () => { if (status) status.textContent = 'Saving…'; });

    if (autosaveUrl && recordId) {
      setInterval(async () => {
        if (!dirty) return;
        try {
          const payload = {};
          new FormData(form).forEach((v, k) => { if (!k.startsWith('_csrf')) payload[k] = v; });
          const res = await fetch(autosaveUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-csrf-token': window.__CSRF__ },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            dirty = false;
            const data = await res.json();
            if (status) status.textContent = 'Working copy saved ' + new Date(data.saved_at).toLocaleTimeString();
          } else if (status) { status.textContent = 'Autosave unavailable — save manually'; }
        } catch (e) { if (status) status.textContent = 'Autosave offline — save manually'; }
      }, 45000);
    }
    window.addEventListener('beforeunload', (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  /* ============================ MEDIA LIBRARY ============================ */
  const mediaInput = $('#mediaFiles');
  if (mediaInput) {
    mediaInput.addEventListener('change', () => {
      const names = Array.from(mediaInput.files).map(f => f.name).join(', ');
      const out = $('#mediaChosen');
      if (out) out.textContent = names ? names : 'No files selected';
    });
  }
  $$('[data-copy-url]').forEach(btn => btn.addEventListener('click', async () => {
    const url = btn.getAttribute('data-copy-url');
    try { await navigator.clipboard.writeText(url); btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy URL'; }, 1400); }
    catch (e) { window.prompt('Copy this URL', url); }
  }));

  /* ============================== SEO METERS ============================= */
  $$('[data-count]').forEach(input => {
    const out = $(input.getAttribute('data-count'));
    const max = Number(input.getAttribute('data-max') || 160);
    const paint = () => {
      const n = input.value.length;
      if (out) out.textContent = n + ' / ' + max;
      if (out) out.className = 'tiny ' + (n === 0 ? 'muted' : n <= max ? 'ok-text' : 'bad-text');
    };
    input.addEventListener('input', paint); paint();
  });

  /* ============================ TABLE FILTERS ============================ */
  const filterInput = $('[data-filter-table]');
  if (filterInput) {
    const target = $(filterInput.getAttribute('data-filter-table'));
    filterInput.addEventListener('input', () => {
      const q = filterInput.value.toLowerCase().trim();
      let shown = 0;
      $$('tbody tr', target).forEach(tr => {
        const hit = !q || tr.textContent.toLowerCase().includes(q);
        tr.hidden = !hit; if (hit) shown++;
      });
      const empty = $('[data-filter-empty]', target);
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* --------------------------- slug suggestions ------------------------- */
  const titleInput = $('[data-slug-source]');
  const slugInput = $('[data-slug-target]');
  if (titleInput && slugInput) {
    titleInput.addEventListener('blur', () => {
      if (slugInput.value.trim()) return;
      slugInput.value = titleInput.value.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 70);
    });
  }
})();
