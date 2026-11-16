/*!
 * Florarium Combinator — Phase 2
 * Готовые рецепты · тёмная тема · мобильный визард · скелетоны · подсказка новичку.
 * Требует window.__fc (геттеры state/D/DB/t) из app.js. Ничего в app.js менять не нужно.
 */
(function () {
  'use strict';
  if (window.__fcPhase2) return; window.__fcPhase2 = true;

  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fc = () => window.__fc || null;
  const L = (ru, en) => (document.documentElement.lang === 'en' ? en : ru);
  const nm = o => !o ? '' : (document.documentElement.lang === 'en' ? (o.name_en || o.name_ru) : o.name_ru) || o.name_latin || '';
  let PRESETS = [], ready = false;

  /* ═══ theme ═══ */
  const THEME_KEY = 'flor.theme';
  const applyTheme = v => { document.documentElement.setAttribute('data-theme', v); const b = $('#themeBtn'); if (b) { b.innerHTML = v === 'dark' ? ICON.sun : ICON.moon; b.title = v === 'dark' ? L('Светлая тема', 'Light theme') : L('Тёмная тема', 'Dark theme'); b.setAttribute('aria-label', b.title); } };
  const ICON = {
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>',
    dice: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M14.5 5 8 12l6.5 7"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9.5 5 16 12l-6.5 7"/></svg>',
    leaf: '<svg viewBox="0 0 24 24"><path d="M12 21c5-3 8-7 8-12-5 0-9 3-12 8"/><path d="M12 21C7 18 4 14 4 9c5 0 9 3 12 8"/></svg>'
  };
  function mountTheme() {
    const right = $('.nav-right'); if (!right || $('#themeBtn')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'themeBtn'; b.className = 'theme-btn';
    right.insertBefore(b, right.firstChild);
    b.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next);
    });
    let saved = 'light'; try { saved = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
    applyTheme(saved);
  }

  /* ═══ jar silhouettes ═══ */
  function jarSVG(shape) {
    const p = {
      bowl: 'M4 14 L4 30 Q4 44 21 44 Q38 44 38 30 L38 14',
      sphere: 'M21 6 A15 15 0 1 1 20.9 6 Z',
      cube: 'M5 10 H37 V44 H5 Z',
      bottle: 'M15 4 L15 14 L6 22 L6 44 L36 44 L36 22 L27 14 L27 4',
      geo_house: 'M21 4 L38 18 L38 44 L4 44 L4 18 Z',
      tank: 'M3 12 H39 V44 H3 Z',
      jar: 'M8 8 Q8 4 12 4 H30 Q34 4 34 8 L34 40 Q34 44 30 44 H12 Q8 44 8 40 Z'
    }[shape] || 'M8 8 Q8 4 12 4 H30 Q34 4 34 8 L34 40 Q34 44 30 44 H12 Q8 44 8 40 Z';
    return '<svg viewBox="0 0 42 48" aria-hidden="true"><path d="' + p + '"/><path d="M6 38 H36" opacity=".45"/><path d="M6 33 H36" opacity=".25"/></svg>';
  }

  /* ═══ state sync (через существующие обработчики app.js) ═══ */
  function setSel(id, val) { const el = document.getElementById(id); if (el) el.value = val == null ? '' : val; }
  function fire(id) { const el = document.getElementById(id); if (el) el.dispatchEvent(new Event('change', { bubbles: true })); }
  function snapshot() {
    const st = fc().state;
    return JSON.parse(JSON.stringify({ items: st.items, stones: st.stones, decor: st.decor, substrate: st.substrate, vessel: st.vessel, system: st.system, placement: st.placement, water: st.water, experience: st.experience, style: st.style, flags: st.flags }));
  }
  function pushState(s) {
    const st = fc().state;
    st.items = JSON.parse(JSON.stringify(s.items)); st.stones = s.stones.slice(); st.decor = s.decor.slice();
    st.substrate = s.substrate; st.placement = s.placement; st.water = s.water; st.experience = s.experience; st.style = s.style;
    st.flags = Object.assign({ grow: false, winter: false, water: false }, s.flags);
    Object.assign(st.vessel, s.vessel);
    setSel('vesselSelect', st.vessel.preset); fire('vesselSelect');
    const sb = document.querySelector('#sysSeg [data-sys="' + s.system + '"]'); if (sb) sb.click();
    setSel('placeSelect', st.placement); setSel('waterSelect', st.water); setSel('styleSelect', st.style);
    $$('#configPanel [data-flag]').forEach(cb => { cb.checked = !!st.flags[cb.dataset.flag]; });
    fire('styleSelect');
  }
  function toast(msg, undo) {
    const box = $('#toasts'); if (!box) return;
    const el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button type="button">' + L('Вернуть', 'Undo') + '</button>' : '');
    box.append(el);
    if (undo) el.querySelector('button').onclick = () => { undo(); el.remove(); };
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; setTimeout(() => el.remove(), 250); }, undo ? 7000 : 3200);
  }
  function applyPreset(p) {
    const b = fc(); if (!b || !b.state || !b.DB) return;
    const prev = snapshot(), all = b.DB.plants.concat(b.DB.fauna);
    const s = {
      items: (p.items || []).map(sl => { const o = all.find(x => x.slug === sl); return o ? { kind: o.id.indexOf('plant_') === 0 ? 'plant' : 'fauna', id: o.id } : null; }).filter(Boolean),
      stones: (p.stones || []).slice(), decor: (p.decor || []).slice(), substrate: p.substrate || null,
      vessel: Object.assign({}, b.state.vessel), system: p.system, placement: p.placement, water: p.water,
      experience: p.experience, style: p.style || '', flags: Object.assign({ grow: false, winter: false, water: false }, p.flags)
    };
    const preset = (b.DB.vessels.presets || []).find(v => v.id === p.vessel);
    if (preset) { const d = preset.dims_cm || {}; s.vessel.preset = preset.id; s.vessel.shape = preset.shape; if (d.diameter_cm != null) s.vessel.diameter = d.diameter_cm; if (d.height_cm != null) s.vessel.height = d.height_cm; if (d.width_cm != null) s.vessel.width = d.width_cm; if (d.depth_cm != null) s.vessel.depth = d.depth_cm; }
    pushState(s);
    if (window.__fcNav) window.__fcNav('builder');
    toast(L('Рецепт «' + p.name_ru + '» собран', 'Recipe “' + (p.name_en || p.name_ru) + '” applied'), () => pushState(prev));
  }

  /* ═══ recipes strip ═══ */
  function avatars(p) {
    const b = fc(); if (!b || !b.DB) return '';
    const all = b.DB.plants.concat(b.DB.fauna), objs = (p.items || []).map(sl => all.find(x => x.slug === sl)).filter(Boolean);
    const show = objs.slice(0, 4);
    let h = '<div class="avatars">';
    show.forEach(o => {
      const im = o.image || {}, src = im.file || im.source_url || '';
      h += src ? '<img src="' + esc(src) + '" alt="' + esc(nm(o)) + '" title="' + esc(nm(o)) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=window.__ph?window.__ph():\'\'">' : '<span class="av-ph" title="' + esc(nm(o)) + '">' + ICON.leaf + '</span>';
    });
    if (objs.length > 4) h += '<span class="more">+' + (objs.length - 4) + '</span>';
    return h + '</div>';
  }
  function renderRecipes() {
    const cat = $('.catalog'); if (!cat || $('#recipes') || !PRESETS.length) return;
    const b = fc(), lang = document.documentElement.lang;
    const wrap = document.createElement('section');
    wrap.className = 'recipes'; wrap.id = 'recipes';
    const sysLabel = s => (b && b.t ? b.t('enum.system_type.' + s) : s);
    wrap.innerHTML =
      '<div class="recipes-head"><span class="recipes-title">' + L('Готовые рецепты', 'Ready-made recipes') + '</span>' +
      '<span class="recipes-sub">' + L('Проверенные сборки в один клик — можно менять под себя', 'Vetted builds in one click — tweak them freely') + '</span>' +
      '<span class="recipes-actions"><button class="mini-btn" id="randRecipe" type="button">' + ICON.dice + L('Случайный', 'Surprise me') + '</button>' +
      '<button class="mini-btn" id="toggleRecipes" type="button">' + L('Свернуть', 'Hide') + '</button></span></div>' +
      '<div class="recipes-row" id="recipesRow">' + PRESETS.map(p => {
        const v = (b && b.DB.vessels.presets || []).find(x => x.id === p.vessel) || {};
        const tags = ['closed', 'semi', 'open'].includes(p.system) ? [p.system] : [];
        if (p.experience === 'experienced') tags.push('expert');
        return '<article class="recipe">' +
          '<div class="recipe-top"><span class="recipe-jar">' + jarSVG(v.shape) + '</span><span><span class="recipe-name">' + esc(lang === 'en' ? (p.name_en || p.name_ru) : p.name_ru) + '</span><span class="recipe-vol">' + (v.volume_liters_approx || '?') + ' ' + L('л', 'L') + ' · ' + esc(sysLabel(p.system)) + '</span></span></div>' +
          '<p class="recipe-desc">' + esc(lang === 'en' ? (p.desc_en || p.desc_ru) : p.desc_ru) + '</p>' +
          '<div class="recipe-tags">' + tags.map(t => '<span class="rtag ' + t + '">' + esc(t === 'expert' ? L('опытным', 'expert') : sysLabel(t)) + '</span>').join('') + '</div>' +
          '<div class="recipe-foot">' + avatars(p) + '<button class="recipe-go" data-recipe="' + esc(p.id) + '" type="button">' + L('Собрать', 'Build') + '</button></div>' +
          '</article>';
      }).join('') + '</div>';
    cat.insertBefore(wrap, cat.firstChild);
  }
  function refreshRecipesLang() { const w = $('#recipes'); if (w) { w.remove(); renderRecipes(); } }

  /* ═══ onboarding ═══ */
  function renderOnboard() {
    const cat = $('.catalog'); if (!cat || $('#onboard')) return;
    let done = false; try { done = localStorage.getItem('flor.onboarded') === '1'; } catch (e) {}
    if (done) return;
    const el = document.createElement('div'); el.className = 'onboard'; el.id = 'onboard';
    el.innerHTML = '<span class="onboard-ic">i</span><div class="onboard-body">' +
      L('<b>Слева</b> — тара, система и место. <b>В центре</b> — каталог: несовместимые виды скрыты. <b>Справа</b> — превью банки и проверка. Начните с готового рецепта сверху.',
        '<b>Left</b> — vessel, system and placement. <b>Centre</b> — the catalog; incompatible species are hidden. <b>Right</b> — jar preview and the check. Start from a recipe above.') +
      '</div><button class="onboard-close" id="onboardClose" type="button">' + L('Понятно', 'Got it') + '</button>';
    const anchor = $('#recipes') || cat.firstChild;
    cat.insertBefore(el, anchor.nextSibling);
  }

  /* ═══ skeletons ═══ */
  function skeletons() {
    const grid = $('#catalogCards'); if (!grid || ready) return;
    grid.innerHTML = Array.from({ length: 8 }).map(() =>
      '<div class="sk-card"><div class="sk-photo"></div><div class="sk-body"><div class="sk-line w80"></div><div class="sk-line w40"></div><div class="sk-btn"></div></div></div>').join('');
  }

  /* ═══ mobile wizard ═══ */
  const WIZ = { i: 0, all: false, busy: false, obs: null };
  const STEP_LABELS = () => [L('Тара', 'Vessel'), L('Система', 'System'), L('Объём', 'Volume'), L('Высота', 'Height'), L('Место', 'Placement'), L('Вода', 'Water'), L('Стиль', 'Style'), L('Опыт', 'Experience'), L('Условия', 'Conditions'), L('Камни', 'Hardscape')];
  function wizBuild() {
    const panel = $('#configPanel'); if (!panel) return;
    const blocks = [...panel.querySelectorAll(':scope > .cfg-block')];
    if (!blocks.length) return;
    WIZ.busy = true;
    panel.classList.add('wiz');
    panel.classList.toggle('wiz-all-mode', WIZ.all);
    if (WIZ.i >= blocks.length) WIZ.i = blocks.length - 1;
    blocks.forEach((b, i) => { b.dataset.wiz = i; b.classList.toggle('wiz-on', i === WIZ.i); });
    let nav = panel.querySelector('.wiz-nav');
    if (!nav) {
      nav = document.createElement('div'); nav.className = 'wiz-nav';
      const title = panel.querySelector('.cfg-title');
      panel.insertBefore(nav, title ? title.nextSibling : panel.firstChild);
    }
    const labels = STEP_LABELS();
    nav.innerHTML = '<div class="wiz-dots">' + blocks.map((b, i) => '<span class="wiz-dot' + (i === WIZ.i ? ' on' : i < WIZ.i ? ' done' : '') + '"></span>').join('') + '</div>' +
      '<div class="wiz-row"><button class="wiz-btn" id="wizPrev" type="button"' + (WIZ.i === 0 ? ' disabled' : '') + ' aria-label="' + L('Назад', 'Back') + '">' + ICON.left + '</button>' +
      '<span class="wiz-step">' + esc(labels[WIZ.i] || (WIZ.i + 1)) + ' <span>' + (WIZ.i + 1) + '/' + blocks.length + '</span></span>' +
      '<button class="wiz-all' + (WIZ.all ? ' on' : '') + '" id="wizAll" type="button">' + L('Все', 'All') + '</button>' +
      '<button class="wiz-btn" id="wizNext" type="button"' + (WIZ.i >= blocks.length - 1 ? ' disabled' : '') + ' aria-label="' + L('Дальше', 'Next') + '">' + ICON.right + '</button></div>';
    WIZ.busy = false;
  }
  function wizWatch() {
    const panel = $('#configPanel'); if (!panel || WIZ.obs) return;
    WIZ.obs = new MutationObserver(() => { if (!WIZ.busy) wizBuild(); });
    WIZ.obs.observe(panel, { childList: true });
    wizBuild();
  }

  /* ═══ events ═══ */
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-recipe]');
    if (go) { const p = PRESETS.find(x => x.id === go.dataset.recipe); if (p) applyPreset(p); return; }
    if (e.target.closest('#randRecipe')) { if (PRESETS.length) applyPreset(PRESETS[Math.floor(Math.random() * PRESETS.length)]); return; }
    if (e.target.closest('#toggleRecipes')) {
      const row = $('#recipesRow'), btn = $('#toggleRecipes'); if (!row) return;
      const hidden = row.style.display === 'none';
      row.style.display = hidden ? '' : 'none';
      btn.textContent = hidden ? L('Свернуть', 'Hide') : L('Показать', 'Show');
      return;
    }
    if (e.target.closest('#onboardClose')) { try { localStorage.setItem('flor.onboarded', '1'); } catch (x) {} const el = $('#onboard'); if (el) el.remove(); return; }
    if (e.target.closest('#wizPrev')) { WIZ.i = Math.max(0, WIZ.i - 1); wizBuild(); return; }
    if (e.target.closest('#wizNext')) { WIZ.i++; wizBuild(); return; }
    if (e.target.closest('#wizAll')) { WIZ.all = !WIZ.all; wizBuild(); return; }
    if (e.target.closest('#langBtn')) { setTimeout(() => { refreshRecipesLang(); wizBuild(); const ob = $('#onboard'); if (ob) ob.remove(); renderOnboard(); }, 60); }
  });

  /* ═══ boot ═══ */
  skeletons();
  let tries = 0;
  const wait = setInterval(async () => {
    tries++;
    const b = fc();
    if (b && b.state && b.DB && b.DB.plants && b.DB.plants.length && window.__florReady) {
      clearInterval(wait); ready = true;
      mountTheme();
      try {
        const r = await fetch('data/presets.json', { cache: 'no-store' });
        if (r.ok) { const j = await r.json(); PRESETS = j.presets || []; }
      } catch (e) { console.warn('[phase2] presets unavailable', e); }
      renderRecipes(); renderOnboard(); wizWatch();
      const grid = $('#catalogCards');
      if (grid) new MutationObserver(() => { if (!grid.querySelector('.card') && !grid.querySelector('.empty') && ready) { /* каталог уже отрисован app.js */ } }).observe(grid, { childList: true });
    } else if (tries > 200) { clearInterval(wait); mountTheme(); }
  }, 120);
})();
