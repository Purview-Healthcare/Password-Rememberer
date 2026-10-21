/* Claim Inspector UI. Vanilla JS, no build step. */
(function () {
  'use strict';
  const CI = window.CI, E = CI.engine;
  const view = document.getElementById('view');

  /* ---------- tiny helpers ---------- */
  function h(tag, props) {
    const e = document.createElement(tag);
    for (const k in props || {}) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    for (let i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach((x) => add(e, x)); else e.appendChild(c.nodeType ? c : document.createTextNode(String(c))); }
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ci.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ci.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  /* Providers: list + active id. Migrates the old single 'profile'. */
  const uid = () => Math.random().toString(36).slice(2, 8);
  const initials = (n) => String(n || '').replace(/^(dr\.?)\s+/i, '').split(/\s+/).map((w) => w[0] || '').join('').toUpperCase().slice(0, 3);
  function providers() {
    let list = store.get('providers', null);
    if (!list) { const old = store.get('profile', null); list = old ? [Object.assign(old, { id: uid(), code: old.code || initials(old.name) || 'P1' })] : []; if (old) store.set('providers', list); }
    return list;
  }
  const hasProfile = () => providers().length > 0;
  const PROF = (id) => { const l = providers(); const p = l.find((x) => x.id === (id || store.get('activeProvider', ''))) || l[0]; return Object.assign(CI.blankProfile(), { id: '', code: '' }, p || {}); };
  const PROF_BY_CODE = (code) => { const c = String(code || '').toUpperCase(); const p = providers().find((x) => String(x.code || '').toUpperCase() === c || String(x.npi || '') === c); return p ? PROF(p.id) : null; };
  const saveProfile = (p) => { const l = providers(); const i = l.findIndex((x) => x.id === p.id); if (i >= 0) l[i] = p; else l.push(p); store.set('providers', l); store.set('activeProvider', p.id); renderWho(); };
  const PRACTICE = () => Object.assign({ name: '', address1: '', city: '', state: '', zip: '', phone: '', taxId: '', groupNpi: '', submitterId: '', receiverId: '', receiverName: '', contact: '', payerIds: {} }, store.get('practice', {}));
  const PROVIDER_FOR = (claim) => (claim.providerId && PROF(claim.providerId)) || (hasProfile() ? PROF() : null);
  function renderWho() {
    const el = document.getElementById('who'); if (!el) return;
    const p = PROF(); el.innerHTML = '';
    el.appendChild(h('a', { class: 'btn ghost sm who', href: '#/setup', title: 'Provider setup' }, ico('user'), hasProfile() ? (p.name || 'Provider') + (providers().length > 1 ? ' +' + (providers().length - 1) : '') : 'Set up provider'));
  }
  /* Activity log: every claim inspected, batched or submitted - per provider, local only. */
  const ACT_MAX = 1500;
  function logActivity(e) {
    const list = store.get('activity', []);
    const i = list.findIndex((x) => x.id === e.id);
    if (i >= 0) list[i] = Object.assign({}, list[i], e, { ts: list[i].ts, updated: Date.now() }); else list.push(Object.assign({ ts: Date.now() }, e));
    while (list.length > ACT_MAX) list.shift();
    store.set('activity', list);
  }
  function actEntry(id, kind, claim, res) {
    const c = toEngine(claim), pv = PROVIDER_FOR(claim) || {};
    return { id, kind, providerId: pv.id || '', provider: pv.name || '', payer: c.payer, label: (claim.patient && claim.patient.account) || (claim.label) || c.lines.map((l) => l.cpt).filter(Boolean)[0] || 'claim', dos: c.dos, score: res.score, errs: res.errs, warns: res.warns, value: CI.claimValue(c), rules: res.issues.filter((i) => i.sev !== 'info').map((i) => i.rule), cpts: c.lines.map((l) => l.cpt).filter(Boolean), dx: (c.dx || []).map(E.normDx).filter(Boolean) };
  }
  function download(name, text) { const blob = new Blob([text], { type: 'text/plain' }); const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function printForm(items) {
    const prac = PRACTICE();
    const w = window.open('', '_blank');
    if (!w) { toast('Allow pop-ups to print'); return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>CMS-1500</title><style>body{margin:0;padding:16px;background:#eee}.cms{margin-bottom:24px;page-break-after:always}' + CI.CMS_CSS.replace(/body \*\{visibility:hidden\}\.cms,\.cms \*\{visibility:visible\}\.cms\{position:absolute;left:0;top:0;width:100%;border-color:#c33\}/, '.cms{page-break-after:always}') + '</style></head><body>' + items.map((it) => CI.forms.cms1500(it.claim, it.patient, it.provider, prac)).join('') + '<script>setTimeout(function(){window.print()},300)<\/script></body></html>');
    w.document.close();
  }
  function toast(msg) { const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
  function copy(text) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Copied'), () => toast('Copy not available')); }
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDx = E.fmtDx;
  function field(label, input, cls) { return h('label', { class: 'f ' + (cls || '') }, h('span', null, label), input); }
  function sel(opts, val, on, cls) {
    const s = h('select', { class: 'in ' + (cls || '') });
    opts.forEach((o) => { const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; const op = h('option', { value: v }, t); if (String(v) === String(val)) op.selected = true; s.appendChild(op); });
    s.addEventListener('change', () => on(s.value));
    return s;
  }
  function inp(val, on, props) { const i = h('input', Object.assign({ class: 'in', value: val == null ? '' : val }, props || {})); i.addEventListener('input', () => on(i.value, i)); return i; }
  function pageHead(kicker, title, sub) { return h('div', { class: 'page-head' }, h('div', { class: 'mono' }, kicker), h('h1', null, title), sub && h('p', null, sub)); }
  function hl(text, q) {
    if (!q) return text;
    const i = String(text).toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text;
    return h('span', null, text.slice(0, i), h('mark', null, text.slice(i, i + q.length)), text.slice(i + q.length));
  }
  const SEV = { error: 'Error', warn: 'Warning', info: 'Note' };
  const ico = (name, cls) => { const s = h('span', { class: 'ico ' + (cls || ''), html: CI.ICON[name] || '' }); return s; };
  const title = (it) => CI.RULE_TITLE[it.rule] || it.msg.split(/[.:]/)[0];
  const money = (n) => '$' + Math.round(n).toLocaleString();
  /* One finding: icon + short title + where; the full explanation folds open. */
  function issueRow(it, opts) {
    opts = opts || {};
    const where = it.line != null ? 'L' + (it.line + 1) : it.dx != null ? 'Dx ' + 'ABCDEFGHIJKL'[it.dx] : '';
    const why = h('p', { class: 'why', hidden: true }, it.msg);
    const row = h('div', { class: 'issue ' + (opts.dark ? 'ondark' : '') },
      ico(it.sev, 'sev ' + it.sev),
      h('div', null,
        h('button', { class: 'ititle', 'aria-expanded': 'false', onclick: (e) => { why.hidden = !why.hidden; e.currentTarget.setAttribute('aria-expanded', String(!why.hidden)); } }, h('b', null, title(it)), where && h('span', { class: 'pill where' }, where), h('span', { class: 'mono inline muted' }, 'why?')),
        why,
        opts.action && it.fix && opts.canFix(it) ? h('div', { class: 'meta' }, h('button', { class: 'btn sm lime', onclick: () => opts.action(it) }, ico('fix'), 'Fix it')) : null));
    return row;
  }
  function gauge(score, size) {
    size = size || 120; const r = (size - 12) / 2, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, score)) / 100;
    const col = score >= 85 ? 'var(--lime)' : score >= 60 ? '#E5A93C' : 'var(--red)';
    return h('div', { class: 'gauge', style: 'width:' + size + 'px;height:' + size + 'px', html: '<svg viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="rgba(139,147,161,.25)" stroke-width="10" fill="none"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + col + '" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="' + (c * pct) + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg><div class="gv">' + score + '</div>' });
  }

  /* ---------- routes ---------- */
  const ROUTES = [
    ['', 'My desk', dashboard, 'home', 1], ['inspect', 'Inspect', inspectPage, 'inspect', 1], ['batch', 'Batch', batchPage, 'batch', 1], ['submit', 'Submit', submitPage, 'denials', 1], ['setup', 'Setup', setupPage, 'setup', 1],
    ['guides', 'Guides', home, 'ref', 2], ['match', 'Match', matchPage, 'match', 2], ['em', 'E/M level', emPage, 'em', 2],
    ['modifiers', 'Modifiers', modPage, 'mod', 2], ['capture', 'Capture', capturePage, 'capture', 2], ['preventive', 'Preventive', prevPage, 'prev', 2],
    ['programs', 'Programs', programsPage, 'programs', 2], ['denials', 'Denials', denialsPage, 'denials', 2], ['codes', 'Codes', codesPage, 'codes', 2], ['reference', 'Reference', refPage, 'ref', 2]
  ];
  function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [name, qs] = hash.split('?');
    const params = new URLSearchParams(qs || '');
    const r = name === 'search' ? ['search', 'Search', searchPage] : ROUTES.find((x) => x[0] === name) || ROUTES[0];
    renderNav(r[0]);
    view.innerHTML = '';
    view.appendChild(r[2](params));
    document.title = (r[1] === 'My desk' ? '' : r[1] + ' · ') + 'Claim Inspector';
    window.scrollTo(0, 0);
  }
  function renderNav(cur) {
    const nav = document.getElementById('nav');
    nav.innerHTML = '';
    [1, 2].forEach((g) => { const grp = h('div', { class: 'navgrp g' + g }, h('span', { class: 'navlbl' }, g === 1 ? 'Work' : 'Guides')); ROUTES.filter((r) => r[4] === g).forEach((r) => grp.appendChild(h('a', { href: '#/' + r[0], 'aria-current': r[0] === cur ? 'page' : null }, ico(r[3]), r[1]))); nav.appendChild(grp); });
  }
  window.addEventListener('hashchange', route);


  /* ---------- Demo mode ---------- */
  const isDemo = () => !!store.get('demo', false);
  function loadDemo() {
    const bp = CI.blankProfile();
    const p1 = Object.assign({}, bp, { id: 'demo1', code: 'AM', name: 'Dr. Anita Mehra', credential: 'MD', npi: '1234567893', clia: '45D0123456', specialty: 'fm', favCpt: ['99213', '99214', '99396', 'G0439', '20610', '90471'], favDx: ['I10', 'E11.65', 'E78.5', 'Z00.00', 'M17.11'] });
    const p2 = Object.assign({}, bp, { id: 'demo2', code: 'JL', name: 'Jordan Lee', credential: 'NP', npi: '1234567893', clia: '45D0123456', specialty: 'np', taxonomy: '363LF0000X', services: CI.SPECIALTIES.np.services.slice() });
    store.set('providers', [p1, p2]); store.set('activeProvider', 'demo1');
    store.set('practice', { name: 'Riverbend Family Medicine', address1: '410 Riverbend Pkwy', city: 'Austin', state: 'TX', zip: '78704', phone: '512-555-0142', taxId: '74-1234567', groupNpi: '1234567893', submitterId: 'RBFM01', receiverId: 'CLRHOUSE', receiverName: 'Clearinghouse', contact: 'Billing office', payerIds: { medicare: '04412', medicaid: 'TXMCD', commercial: '84980' } });
    // submission file: three claims in different states
    const mk = (i, pt, cid) => { const c = sampleClaim(SAMPLES[i]); c.providerId = 'demo1'; c.cid = cid; c.patient = Object.assign(CI.forms.blankPatient(), pt); return { id: uid(), added: today(), claim: c }; };
    store.set('queue', [
      mk(3, { name: 'Alvarez, Maria', dob: '1968-03-14', address: '12 Pecan St', city: 'Austin', state: 'TX', zip: '78745', memberId: 'ZGP4471022', payerName: 'BCBS Texas', payerId: '84980', account: 'RB-2041' }, 'i:demo1'),
      mk(1, { name: 'Okafor, Daniel', dob: '1951-11-02', address: '88 Lamar Blvd', city: 'Austin', state: 'TX', zip: '78703', memberId: '1EG4TE5MK72', payerName: 'Medicare Part B', payerId: '04412', account: 'RB-2042' }, 'i:demo2'),
      mk(0, { name: 'Nguyen, Linh', dob: '1974-07-21', address: '', city: 'Austin', state: 'TX', zip: '78741', memberId: 'UHC55019', payerName: 'UnitedHealthcare', account: 'RB-2043' }, 'i:demo3')
    ]);
    store.set('batch', { text: BATCH_SAMPLE.replace(/A-10(0[1-9]|1[0-5])/g, (m) => m.replace('A-', 'RB-')).replace(/\| 71 F \| medicare/, '@JL | 71 F | medicare') });
    const c0 = sampleClaim(SAMPLES[0]); c0.providerId = 'demo1'; store.set('claim', c0);
    store.set('demo', true);
  }
  function exitDemo() { ['providers', 'activeProvider', 'practice', 'queue', 'batch', 'claim', 'activity', 'demo', 'dashRange', 'dashWho', 'rcm', 'match', 'em', 'capture'].forEach((k) => { try { localStorage.removeItem('ci.' + k); } catch (e) { /* ignore */ } }); }
  function demoBanner() { return isDemo() ? h('div', { class: 'banner demo' }, ico('info'), h('span', null, h('b', null, 'Demo mode. '), 'Riverbend Family Medicine is sample data - providers, patients, activity and claims are invented. Explore freely, then exit to start with your own practice.'), h('button', { class: 'btn lime sm', onclick: () => { if (confirm('Exit demo and clear all sample data?')) { exitDemo(); location.hash = '#/'; location.reload(); } } }, 'Exit demo')) : null; }

  /* ---------- Provider dashboard ("My desk") ---------- */
  function dashboard() {
    const root = h('div', null);
    if (!hasProfile()) {
      root.appendChild(h('section', { class: 'hero grid' },
        h('div', { class: 'c7' }, h('div', { class: 'mono' }, 'Welcome'), h('h1', { class: 'display', style: 'margin-top:16px' }, 'Your desk, once it knows ', h('span', { class: 'hl' }, 'who you are'), '.'),
          h('p', { class: 'lede', style: 'margin-top:24px' }, 'Set up the practice and your provider profile. From then on this page shows how your claims are doing, what keeps getting flagged and what is waiting to go out.'),
          h('div', { class: 'row', style: 'margin-top:32px' }, h('button', { class: 'btn primary lg', onclick: () => { loadDemo(); demoActivityFor(['demo1', 'demo2']); location.reload(); } }, ico('ok'), 'See it with sample data'), h('a', { class: 'btn ghost lg', href: '#/setup' }, ico('setup'), 'Set up my practice')),
          h('p', { class: 'small muted', style: 'margin-top:12px' }, 'The sample loads a two-provider practice, 30 days of checked claims, a batch and a submission file. One click removes it.')),
        h('div', { class: 'c5 hero-aside' }, h('div', { class: 'card dark' }, h('div', { class: 'mono' }, 'What you will see here'), h('ul', { class: 'mini-findings', style: 'margin-top:12px' }, [['ok', 'Claims checked, clean-claim score, revenue at risk'], ['ok', 'The rules you keep tripping - and the fix'], ['ok', 'Money left on the table (G2211, ACP, screenings)'], ['ok', 'Submission file status'], ['ok', 'Recent activity per provider']].map((f) => h('li', null, ico(f[0], 'sev ' + f[0]), h('b', { style: 'flex:1' }, f[1]))))))));
      return root;
    }
    const pv = PROF(), all = store.get('activity', []);
    let range = store.get('dashRange', 30), who = store.get('dashWho', 'me');
    const body = h('div', null);
    function render() {
      store.set('dashRange', range); store.set('dashWho', who);
      body.innerHTML = '';
      const since = Date.now() - range * 86400000;
      const mine = all.filter((e) => (who === 'all' || e.providerId === pv.id) && e.ts >= since && e.kind !== 'submit');
      const subs = all.filter((e) => (who === 'all' || e.providerId === pv.id) && e.ts >= since && e.kind === 'submit');
      const n = mine.length, blocked = mine.filter((e) => e.errs > 0), avg = n ? Math.round(mine.reduce((s, e) => s + e.score, 0) / n) : 0;
      const value = mine.reduce((s, e) => s + (e.value || 0), 0), atRisk = blocked.reduce((s, e) => s + (e.value || 0), 0);
      const queue = store.get('queue', []);
      const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      // header
      body.appendChild(h('div', { class: 'row between', style: 'align-items:flex-end;margin-bottom:32px;gap:24px' },
        h('div', null, h('div', { class: 'mono' }, new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + ' · ' + (CI.SPECIALTIES[pv.specialty] || {}).label),
          h('h1', { class: 'display', style: 'margin-top:8px;font-size:clamp(32px,4.5vw,48px)' }, greet + ', ' + (pv.name || 'Doctor').replace(/^Dr\.?\s*/i, 'Dr. ') + '.'),
          h('p', { class: 'lede', style: 'margin-top:8px;font-size:17px' }, n ? (blocked.length ? blocked.length + ' of your last ' + n + ' claims would have been denied. ' + (atRisk ? money(atRisk) + ' at risk.' : '') : 'All ' + n + ' claims in this window passed. Nice.') : 'Nothing checked in this window yet.')),
        h('div', { class: 'row' },
          h('div', { class: 'chips' }, [[7, '7d'], [30, '30d'], [90, '90d'], [365, '1y']].map((r) => h('button', { class: 'chip', 'aria-pressed': String(range === r[0]), onclick: () => { range = r[0]; render(); } }, r[1]))),
          providers().length > 1 ? h('div', { class: 'chips' }, [['me', '@' + pv.code], ['all', 'Practice']].map((r) => h('button', { class: 'chip', 'aria-pressed': String(who === r[0]), onclick: () => { who = r[0]; render(); } }, r[1]))) : null)));
      // KPI tiles
      body.appendChild(h('div', { class: 'statstrip', style: 'margin:0 0 32px' },
        stat(String(n), 'claims checked'), stat(n ? avg : '—', 'avg clean score', n ? (avg >= 85 ? 'good' : avg >= 60 ? 'warn' : 'bad') : ''), stat(n ? Math.round(blocked.length / n * 100) + '%' : '—', 'would deny', n ? (blocked.length / n < 0.05 ? 'good' : 'bad') : ''),
        stat(money(value), 'est. value checked'), stat(String(queue.length), 'in submission file'), stat(String(subs.length), 'submitted')));
      // main grid: trend + issues | queue + money + actions
      const left = h('div', { class: 'c8 stack-lg' }), right = h('div', { class: 'c4 stack-lg' });
      left.appendChild(h('div', { class: 'card' }, h('div', { class: 'row between' }, h('div', null, h('div', { class: 'mono' }, 'Trend'), h('h3', { class: 'h3', style: 'margin-top:4px' }, 'Clean-claim score by day')), h('span', { class: 'pill' }, 'last ' + range + ' days')), trend(mine, range)));
      // top rules
      const counts = {}; mine.forEach((e) => (e.rules || []).forEach((r) => { counts[r] = (counts[r] || 0) + 1; }));
      const top = Object.keys(counts).sort((x, y) => counts[y] - counts[x]).slice(0, 6), max = top.length ? counts[top[0]] : 1;
      const GUIDE = { MOD: '#/modifiers', NCCI: '#/modifiers', LAT: '#/modifiers', LAB: '#/modifiers', DX: '#/codes?tab=icd', NEC: '#/match', VAC: '#/preventive', AWV: '#/programs', MCR: '#/programs', EM: '#/em', G22: '#/em', CNS: '#/capture', TAX: '#/setup', PRO: '#/setup', AGE: '#/match', SEX: '#/match', NEW: '#/em', POS: '#/reference', CCM: '#/programs', TCM: '#/programs', DRG: '#/capture' };
      left.appendChild(h('div', { class: 'card' }, h('div', { class: 'mono' }, 'Coaching'), h('h3', { class: 'h3', style: 'margin:4px 0 16px' }, top.length ? 'What keeps getting flagged' : 'No flags yet'),
        top.length ? h('div', { class: 'bars' }, top.map((r) => h('a', { class: 'bar', href: GUIDE[r.split('-')[0]] || '#/guides' }, h('span', { class: 'bl' }, h('b', null, CI.RULE_TITLE[r] || r), h('span', { class: 'mono inline muted' }, ' ' + r)), h('span', { class: 'bt' }, h('i', { style: 'width:' + (counts[r] / max * 100) + '%' })), h('span', { class: 'bn' }, counts[r] + '×'), ico('arrow')))) : h('p', { class: 'small muted' }, 'Flags from inspected and batched claims will rank here, each linked to the guide that fixes it.')));
      // recent activity
      const recent = all.filter((e) => who === 'all' || e.providerId === pv.id).slice(-8).reverse();
      left.appendChild(h('div', { class: 'card', style: 'padding:0;overflow:hidden' }, h('div', { style: 'padding:24px 24px 8px' }, h('div', { class: 'mono' }, 'Recent'), h('h3', { class: 'h3', style: 'margin-top:4px' }, 'Latest claims')),
        recent.length ? recent.map((e) => h('div', { class: 'act' }, ico(e.kind === 'submit' ? 'batch' : e.errs ? 'error' : e.warns ? 'warn' : 'ok', 'sev ' + (e.kind === 'submit' ? 'info' : e.errs ? 'error' : e.warns ? 'warn' : 'ok')),
          h('div', null, h('b', null, e.label), h('span', { class: 'mono inline muted' }, '  ' + (e.cpts || []).slice(0, 4).join(' ') + (e.cpts && e.cpts.length > 4 ? ' …' : '')), h('div', { class: 'xs muted' }, { inspect: 'Inspected', batch: 'Batch', submit: 'Submitted' }[e.kind] + ' · ' + new Date(e.updated || e.ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + (who === 'all' && e.provider ? ' · ' + e.provider : '') + ' · ' + e.payer)),
          h('span', { class: 'h4', style: 'color:' + (e.errs ? 'var(--red)' : e.warns ? 'var(--amber)' : 'var(--violet)') }, e.kind === 'submit' ? money(e.value || 0) : String(e.score)))) : h('p', { class: 'small muted', style: 'padding:0 24px 24px' }, 'Nothing yet.')));
      // right column
      const readyQ = queue.length;
      right.appendChild(h('div', { class: 'card dark' }, h('div', { class: 'mono' }, 'Submission file'), h('div', { class: 'score good', style: 'font-size:56px;margin:8px 0 4px' }, String(readyQ)), h('div', { class: 'small', style: 'color:#B6BCC8' }, readyQ ? 'claims waiting to be sent' : 'empty - add claims from the Inspector'),
        h('div', { class: 'row', style: 'margin-top:16px' }, h('a', { class: 'btn lime sm', href: '#/submit' }, 'Open file'), h('a', { class: 'btn ghost sm', style: 'color:#fff;border-color:#2B3445', href: '#/inspect' }, 'New claim'))));
      // money on the table
      const opp = opportunities(mine);
      right.appendChild(h('div', { class: 'card' }, h('div', { class: 'row', style: 'gap:8px' }, ico('dollar', 'big'), h('div', null, h('div', { class: 'mono' }, 'Left on the table'), h('h3', { class: 'h3' }, opp.total ? '≈ ' + money(opp.total) : 'Nothing obvious'))),
        opp.items.length ? h('ul', { class: 'plain', style: 'margin-top:12px' }, opp.items.map((o) => h('li', { class: 'opp' }, h('b', null, o.t), h('span', { class: 'small muted' }, o.d), h('span', { class: 'pill lime' }, money(o.v))))) : h('p', { class: 'small muted', style: 'margin:8px 0 0' }, 'Based on patterns in checked claims: G2211, ACP with AWV, depression screening, tobacco counseling.')));
      // quick actions
      right.appendChild(h('div', { class: 'card flat' }, h('div', { class: 'mono', style: 'margin-bottom:12px' }, 'Do now'), h('div', { class: 'stack-sm' },
        h('a', { class: 'btn primary', style: 'width:100%', href: '#/inspect' }, ico('inspect'), 'Inspect a claim'), h('a', { class: 'btn ghost', style: 'width:100%', href: '#/batch' }, ico('batch'), 'Review today\'s batch'), h('a', { class: 'btn ghost', style: 'width:100%', href: '#/denials' }, ico('denials'), 'Work a denial'), h('a', { class: 'btn ghost', style: 'width:100%', href: '#/guides' }, ico('ref'), 'Guides & references'))));
      if (!all.length) right.appendChild(h('div', { class: 'card flat' }, h('div', { class: 'mono' }, 'Empty desk?'), h('p', { class: 'small muted' }, 'Load 30 days of sample activity to see what this page looks like in use. It is clearly marked and one click removes it.'), h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', onclick: () => { demoActivity(); location.reload(); } }, 'Load demo activity'))));
      if (all.some((e) => e.demo)) right.appendChild(h('div', { class: 'row', style: 'justify-content:flex-end' }, h('button', { class: 'btn ghost sm', onclick: () => { store.set('activity', all.filter((e) => !e.demo)); location.reload(); } }, 'Remove demo activity')));
      body.appendChild(h('div', { class: 'grid' }, left, right));
      body.appendChild(h('p', { class: 'xs muted', style: 'margin-top:32px' }, 'Scores and values come from this app\'s own checks and approximate fee tables - not from payer remittances. Activity stays in this browser.'));
    }
    function stat(v, l, tone) { return h('div', { class: 'stat' }, h('b', { style: tone === 'good' ? 'color:var(--violet)' : tone === 'bad' ? 'color:var(--red)' : tone === 'warn' ? 'color:var(--amber)' : '' }, v), h('div', { class: 'mono' }, l)); }
    function trend(list, days) {
      const W = 720, H = 160, padL = 28, padR = 12, padT = 12, padB = 24;
      const byDay = {}; list.forEach((e) => { const d = new Date(e.ts).toISOString().slice(0, 10); (byDay[d] = byDay[d] || []).push(e.score); });
      const pts = []; for (let i = days - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); if (byDay[d]) pts.push({ d, v: Math.round(byDay[d].reduce((a, b) => a + b, 0) / byDay[d].length), n: byDay[d].length, x: i }); }
      if (pts.length < 2) return h('p', { class: 'small muted', style: 'margin:16px 0 0' }, 'The trend appears once there are claims on two or more days.');
      const x = (i) => padL + (W - padL - padR) * (1 - i / (days - 1)), y = (v) => padT + (H - padT - padB) * (1 - v / 100);
      const path = pts.map((p, i) => (i ? 'L' : 'M') + x(p.x).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
      const area = path + ' L' + x(pts[pts.length - 1].x).toFixed(1) + ' ' + y(0) + ' L' + x(pts[0].x).toFixed(1) + ' ' + y(0) + ' Z';
      const svg = h('div', { class: 'chart', html: '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-label="Clean-claim score by day">' +
        [0, 50, 100].map((g) => '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(g) + '" y2="' + y(g) + '" class="grid"/><text x="' + (padL - 6) + '" y="' + (y(g) + 4) + '" class="tick" text-anchor="end">' + g + '</text>').join('') +
        '<path d="' + area + '" class="area"/><path d="' + path + '" class="line"/>' +
        pts.map((p) => '<circle cx="' + x(p.x) + '" cy="' + y(p.v) + '" r="4" class="pt" data-d="' + p.d + '" data-v="' + p.v + '" data-n="' + p.n + '"/>').join('') +
        '<line class="xh" x1="0" x2="0" y1="' + padT + '" y2="' + (H - padB) + '" visibility="hidden"/></svg><div class="tip" hidden></div>' });
      const tip = svg.querySelector('.tip'), xh = svg.querySelector('.xh'), el = svg.querySelector('svg');
      el.addEventListener('mousemove', (ev) => { const r = el.getBoundingClientRect(); const mx = (ev.clientX - r.left) / r.width * W; let best = pts[0]; pts.forEach((p) => { if (Math.abs(x(p.x) - mx) < Math.abs(x(best.x) - mx)) best = p; }); xh.setAttribute('x1', x(best.x)); xh.setAttribute('x2', x(best.x)); xh.setAttribute('visibility', 'visible'); tip.hidden = false; tip.textContent = new Date(best.d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · score ' + best.v + ' · ' + best.n + ' claim' + (best.n > 1 ? 's' : ''); tip.style.left = Math.min(r.width - 170, Math.max(0, (ev.clientX - r.left) - 80)) + 'px'; });
      el.addEventListener('mouseleave', () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); });
      return svg;
    }
    function opportunities(list) {
      const items = [];
      const cnt = (f) => list.filter(f).length;
      const g2211 = cnt((e) => e.payer === 'medicare' && e.cpts.some((c) => CI.G.estEM.includes(c) || CI.G.newEM.includes(c)) && !e.cpts.includes('G2211') && !e.cpts.some((c) => CI.G.prevOrAwv.includes(c)));
      if (g2211) items.push({ t: 'G2211 not added', d: g2211 + ' Medicare office visits without the complexity add-on', v: g2211 * CI.FEE.G2211 });
      const acp = cnt((e) => e.cpts.some((c) => ['G0438', 'G0439'].includes(c)) && !e.cpts.includes('99497'));
      if (acp) items.push({ t: 'ACP with the AWV', d: acp + ' wellness visits without advance care planning (99497-33)', v: acp * CI.FEE['99497'] });
      const dep = cnt((e) => e.cpts.includes('G0439') && !e.cpts.includes('G0444'));
      if (dep) items.push({ t: 'Depression screen at AWV', d: dep + ' subsequent AWVs without G0444', v: dep * CI.FEE.G0444 });
      const tob = cnt((e) => e.dx.some((d) => d.startsWith('F17') || d === 'Z720') && !e.cpts.some((c) => ['99406', '99407'].includes(c)));
      if (tob) items.push({ t: 'Tobacco counseling', d: tob + ' visits with a tobacco dx but no 99406/99407', v: tob * CI.FEE['99406'] });
      const sdoh = cnt((e) => e.payer === 'medicare' && e.cpts.some((c) => ['G0438', 'G0439'].includes(c)) && !e.cpts.includes('G0136'));
      if (sdoh) items.push({ t: 'SDOH risk assessment', d: sdoh + ' Medicare AWVs without G0136', v: sdoh * CI.FEE.G0136 });
      return { items: items.sort((a, b) => b.v - a.v).slice(0, 5), total: items.reduce((s, i) => s + i.v, 0) };
    }
    function demoActivity() { demoActivityFor(providers().map((p) => p.id)); }
    render();
    root.appendChild(demoBanner());
    root.appendChild(body);
    return root;
  }
  function demoActivityFor(ids) {
    {
      const pvs = ids.map((id) => ({ id })), list = store.get('activity', []);
      const pool = SAMPLES.filter((s) => !/stress/i.test(s.name)).concat(CI.TEMPLATES.filter((t) => t.c && t.id !== 'blank').map((t) => ({ name: t.name, c: t.c })));
      const R = Math.random;
      for (let d = 29; d >= 0; d--) { const k = 2 + Math.floor(R() * 5); for (let j = 0; j < k; j++) { const s = pool[Math.floor(R() * pool.length)], c = sampleClaim(s); const pr = pvs[Math.floor(R() * pvs.length)]; c.providerId = pr.id;
          /* realistic slips: drop 25, forget QW, forget G2211, physical on Medicare, wrong new/est, an unspecified dx */
          c.lines.forEach((l) => { l.mods = String(l.mods || ''); if (R() < 0.3) l.mods = l.mods.replace(/\b25\b/, '').trim(); if (R() < 0.3) l.mods = l.mods.replace(/\bQW\b/, '').trim(); });
          if (R() < 0.35) c.lines = c.lines.filter((l) => l.cpt !== 'G2211');
          if (R() < 0.12 && c.lines[0] && CI.G.estEM.includes(c.lines[0].cpt)) c.lines[0].cpt = { '99212': '99202', '99213': '99203', '99214': '99204', '99215': '99205' }[c.lines[0].cpt];
          if (R() < 0.15 && c.payer === 'commercial' && c.age >= 65) c.payer = 'medicare';
          if (R() < 0.2) c.dx.push(['E78.5', 'N39.0', 'F32.9', 'J45.909', 'M54.50'][Math.floor(R() * 5)]);
          const res = E.inspect(toEngine(c)); const e = actEntry('d:' + uid(), Math.random() < 0.5 ? 'inspect' : 'batch', c, res); e.ts = Date.now() - d * 86400000 - Math.floor(Math.random() * 8 * 3600000); e.updated = e.ts; e.demo = true; e.label = 'DEMO-' + (1000 + list.length); list.push(e); if (res.errs === 0 && Math.random() < 0.5) list.push(Object.assign({}, e, { id: 'ds:' + uid(), kind: 'submit' })); } }
      list.sort((a, b) => a.ts - b.ts); store.set('activity', list);
    }
  }

  /* ---------- Home ---------- */
  function home() {
    const done = store.get('rcm', {});
    const root = h('div', null);
    root.appendChild(pageHead('Guides', 'The reference shelf.', 'Everything that is not a claim in front of you: the tools that explain, the schedules, the playbooks and the end-to-end cycle.'));
    if (false) root.appendChild(h('a', { class: 'banner', href: '#/setup' }, ico('setup'), h('span', null, h('b', null, 'Set up your provider first. '), 'NPI, taxonomy, CLIA, the services you do and your go-to codes - then every tab is tuned to you.'), ico('arrow')));
    if (false) root.appendChild(h('section', { class: 'hero grid' },
      h('div', { class: 'c7' },
        h('div', { class: 'mono' }, 'Family & internal medicine · revenue cycle intelligence'),
        h('h1', { class: 'display', style: 'margin-top:16px' }, 'Every claim, ', h('span', { class: 'hl' }, 'inspected'), ' before it leaves the building.'),
        h('p', { class: 'lede', style: 'margin-top:24px' }, 'Scrub it, match it, level it, fix it - then submit. Built for family and internal medicine.'),
        h('div', { class: 'row', style: 'margin-top:32px' },
          h('a', { class: 'btn primary lg', href: '#/inspect' }, ico('inspect'), 'Inspect a claim'),
          h('a', { class: 'btn ghost lg', href: '#/batch' }, ico('batch'), 'Review a batch'))),
      h('div', { class: 'c5 hero-aside' }, h('div', { class: 'card dark' },
        h('div', { class: 'mono' }, 'Live scrubber · sample'),
        h('div', { class: 'scorebox', style: 'margin:16px 0 8px' }, h('div', { class: 'score good' }, '64'), h('div', { class: 'mono', style: 'padding-bottom:8px' }, 'clean-claim score')),
        h('ul', { class: 'mini-findings' },
          [['error', 'Add modifier 25', 'L2'], ['error', 'Medicare flu admin is G0008', 'L4'], ['warn', 'Unspecified diagnosis', 'Dx C'], ['info', 'Add QW (waived test)', 'L3']].map((f) => h('li', null, ico(f[0], 'sev ' + f[0]), h('b', { style: 'flex:1' }, f[1]), h('span', { class: 'pill where' }, f[2]))))))));
    if (false) root.appendChild(h('div', { class: 'statstrip' }, CI.KPI.slice(0, 5).map((k) => h('div', { class: 'stat' }, h('b', null, k[1]), h('div', { class: 'mono' }, k[0])))));

    // Tools
    root.appendChild(h('section', { style: 'margin-top:0' },
      h('div', { class: 'sec-head' }, h('div', null, h('div', { class: 'mono' }, 'Tools & guides'), h('h2', { class: 'h2', style: 'margin-top:8px' }, 'Pick what you need.'))),
      h('div', { class: 'tools' },
        tool('wide', '01 · Inspect', 'Claim scrubber', 'Build a CMS-1500-style claim. 90+ rules check modifiers, bundling, age and sex edits, POS, vaccines, Medicare quirks, dx pointers, medical necessity and provider taxonomy. One-click fixes.', '#/inspect'),
        tool('', '02 · Batch', 'Batch review', 'Paste 15-20 claims, get a ranked worklist, bulk-apply safe fixes, export results.', '#/batch'),
        tool('', '03 · Match', 'CPT ↔ Dx ↔ Taxonomy', 'Does the service fit the diagnosis, the patient and the provider’s taxonomy?', '#/match'),
        tool('', '04 · Level', 'E/M leveler', '2021+ MDM table, time thresholds, new vs. established, prolonged services, G2211.', '#/em'),
        tool('', '05 · Modify', 'Modifier advisor', 'Answer 2-3 questions and get 25 / 59 / XS / 33 / QW / 95 with the why.', '#/modifiers'),
        tool('', '06 · Capture', 'Missed-charge finder', 'Tick what happened in the room. See every billable code you might be leaving behind.', '#/capture'),
        tool('', '07 · Prevent', 'Preventive schedules', 'Pediatric through 65+: what to do, the code and the dx.', '#/preventive'),
        tool('wide', '08 · Programs', 'CCM, TCM, RPM, AWV, APCM, ACP, BHI', 'Eligibility, time rules, documentation checklists and the traps that cause clawbacks.', '#/programs'),
        tool('', '09 · Recover', 'Denials & appeals', '50+ CARC/RARC with the fix. Generates an appeal letter.', '#/denials'),
        tool('', '10 · Submit', 'Claim forms & files', 'Printable CMS-1500, 837P upload file and CSV from the claims you inspected.', '#/submit'))));

    // Cycle
    root.appendChild(h('section', { class: 'block' },
      h('div', { class: 'sec-head' },
        h('div', null, h('div', { class: 'mono' }, 'End to end'), h('h2', { class: 'h2', style: 'margin-top:8px' }, 'The twelve-step revenue cycle'), h('p', null, 'From the moment a patient books to the moment the balance is zero. Tick tasks to track your own process; progress stays in this browser.')),
        h('button', { class: 'btn ghost sm', onclick: () => { store.set('rcm', {}); route(); } }, 'Reset checklist')),
      h('div', { class: 'cycle' }, CI.RCM.map((s) => cycleStep(s, done)))));
    return root;
  }
  const TOOL_ICON = { '#/submit': 'ref', '#/inspect': 'inspect', '#/batch': 'batch', '#/match': 'match', '#/em': 'em', '#/modifiers': 'mod', '#/capture': 'capture', '#/preventive': 'prev', '#/programs': 'programs', '#/denials': 'denials' };
  function tool(cls, kicker, title, text, href) { return h('a', { class: 'tool ' + cls, href }, h('div', { class: 'row between' }, ico(TOOL_ICON[href], 'big'), h('span', { class: 'mono' }, kicker)), h('h3', { class: 'h3' }, title), h('p', null, text), h('span', { class: 'go' }, ico('arrow'))); }
  function cycleStep(s, done) {
    const total = s.tasks.length;
    const count = () => s.tasks.filter((t, i) => done[s.id + i]).length;
    const prog = h('i', { style: 'width:' + (count() / total * 100) + '%' });
    const pill = h('span', { class: 'pill' }, count() + '/' + total);
    const box = h('div', { class: 'step' });
    const btn = h('button', { 'aria-expanded': 'false', onclick: () => { const o = box.classList.toggle('open'); btn.setAttribute('aria-expanded', o); } },
      h('span', { class: 'num' }, s.n), h('span', null, h('span', { class: 'h3' }, s.t), h('div', { class: 'small muted' }, s.goal)), pill);
    const upd = () => { prog.style.width = (count() / total * 100) + '%'; pill.textContent = count() + '/' + total; store.set('rcm', done); };
    box.appendChild(btn);
    box.appendChild(h('div', { class: 'body' },
      h('div', null, h('div', { class: 'mono' }, 'Do · ' + s.owner), s.tasks.map((t, i) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!done[s.id + i], onchange: (ev) => { done[s.id + i] = ev.target.checked; upd(); } }), h('span', null, t))), h('div', { class: 'progress', style: 'margin-top:12px' }, prog)),
      h('div', null, h('div', { class: 'mono' }, 'Watch for'), h('ul', { class: 'plain dash' }, s.pitfalls.map((p) => h('li', null, p))), h('div', { class: 'mono', style: 'margin-top:24px' }, 'Target'), h('div', { class: 'code', style: 'margin-top:4px' }, s.kpi))));
    return box;
  }

  /* ---------- Inspect ---------- */
  const SAMPLES = [
    { name: 'Physical + HTN follow-up + flu shot', c: { age: 52, sex: 'M', payer: 'commercial', status: 'est', pos: '11', taxonomy: '207Q00000X', dx: ['Z00.01', 'I10', 'Z23'], lines: [['99396', '', 'A'], ['99214', '', 'B'], ['90686', '', 'C'], ['90471', '', 'C']] } },
    { name: 'Medicare knee injection + visit', c: { age: 71, sex: 'F', payer: 'medicare', status: 'est', pos: '11', taxonomy: '207Q00000X', dx: ['M17.11'], lines: [['99213', '', 'A'], ['20610', '', 'A'], ['J3301', '', 'A', 4], ['G2211', '', 'A']] } },
    { name: 'Medicare “physical” + flu shot', c: { age: 68, sex: 'F', payer: 'medicare', status: 'est', pos: '11', taxonomy: '207Q00000X', dx: ['Z00.00', 'Z23'], lines: [['99397', '', 'A'], ['90662', '', 'B'], ['90471', '', 'B']] } },
    { name: 'Diabetes visit with POC A1c', c: { age: 58, sex: 'M', payer: 'commercial', status: 'est', pos: '11', taxonomy: '207Q00000X', dx: ['E11.65', 'I10', 'Z79.84'], lines: [['99214', '', 'AB'], ['83036', 'QW', 'A'], ['3052F', '', 'A']] } },
    { name: 'Telehealth anxiety visit', c: { age: 29, sex: 'F', payer: 'commercial', status: 'est', pos: '02', taxonomy: '363LF0000X', dx: ['F41.9'], lines: [['99214', '', 'A']] } },
    { name: 'Everything wrong (stress test)', c: { age: 8, sex: 'M', payer: 'medicaid', status: 'est', pos: '21', taxonomy: '207QG0300X', dx: ['N92.1', 'M54.5', 'E11'], lines: [['99203', '', 'A'], ['99385', '', 'B'], ['77067', '', 'C'], ['94760', '', 'C'], ['99396', '', '']] } }
  ];
  function sampleClaim(s) {
    const c = s.c;
    return { providerId: hasProfile() ? PROF().id : '', patient: CI.forms.blankPatient(), age: c.age, sex: c.sex, payer: c.payer, status: c.status, pos: c.pos, taxonomy: hasProfile() ? PROF().taxonomy : (c.taxonomy || '207Q00000X'), dos: today(), dx: c.dx.slice(), lines: c.lines.map((l) => ({ cpt: l[0], mods: l[1], ptr: l[2], units: l[3] || 1, charge: '' })) };
  }
  function blankClaim() { const p = PROF(); return { providerId: p.id, patient: CI.forms.blankPatient(), age: '', sex: '', payer: (p.payers && p.payers[0]) || 'commercial', status: 'est', pos: p.pos || '11', taxonomy: p.taxonomy || '207Q00000X', dos: today(), dx: ['', ''], lines: [{ cpt: '', mods: '', ptr: 'A', units: 1, charge: '' }] }; }
  const toEngine = (c) => Object.assign({}, c, { profile: PROVIDER_FOR(c), lines: c.lines.map((l) => ({ cpt: l.cpt, mods: String(l.mods || '').split(/[\s,]+/).filter(Boolean), ptr: l.ptr, units: l.units, charge: l.charge })) });
  const fromEngine = (c) => Object.assign({}, c, { lines: c.lines.map((l) => ({ cpt: l.cpt, mods: (l.mods || []).join(' '), ptr: l.ptr, units: l.units, charge: l.charge })) });

  function inspectPage() {
    let claim = store.get('claim', null) || sampleClaim(SAMPLES[0]);
    const results = h('div', { class: 'card dark' });
    const formHost = h('div', { class: 'stack-lg' });
    let last = null;
    function save() { store.set('claim', claim); }
    let logT;
    function run() {
      save();
      last = E.inspect(toEngine(claim));
      renderResults();
      clearTimeout(logT);
      if (claim.lines.some((l) => l.cpt)) logT = setTimeout(() => { if (!claim.cid) { claim.cid = 'i:' + uid(); save(); } logActivity(actEntry(claim.cid, 'inspect', claim, last)); }, 900);
    }
    function renderResults() {
      const r = last;
      results.innerHTML = '';
      const good = r.errs === 0;
      const val = CI.claimValue(claim);
      results.appendChild(h('div', { class: 'row between', style: 'align-items:center' },
        gauge(r.score, 112),
        h('div', { class: 'stack-sm', style: 'flex:1;min-width:160px' },
          h('div', { class: 'h3', style: 'color:#fff' }, good ? (r.warns ? 'Review, then submit' : 'Ready to submit') : 'Blocked - fix errors'),
          h('div', { class: 'row', style: 'gap:6px' }, r.errs ? h('span', { class: 'pill red' }, r.errs + ' errors') : null, r.warns ? h('span', { class: 'pill amber' }, r.warns + ' warnings') : null, r.infos ? h('span', { class: 'pill violet' }, r.infos + ' notes') : null, !r.issues.length ? h('span', { class: 'pill lime' }, 'clean') : null),
          val ? h('div', { class: 'mono' }, '≈ ' + money(val) + ' est. value') : null)));
      results.appendChild(h('hr', { class: 'rule', style: 'border-color:#1F2937' }));
      results.appendChild(h('div', { class: 'row', style: 'margin-bottom:8px' },
        h('button', { class: 'btn lime sm', onclick: () => copy(report()) }, 'Copy report'),
        h('button', { class: 'btn ghost sm', style: 'color:#fff;border-color:#2B3445', onclick: () => window.print() }, 'Print')));
      if (!r.issues.length) results.appendChild(h('p', { class: 'small', style: 'color:#C7F36B' }, 'No issues found. Ready to submit.'));
      const order = { error: 0, warn: 1, info: 2 };
      const fixable = r.issues.filter((i) => i.fix && i.fix.type !== 'note' && i.fix.type !== 'suggestDx');
      if (fixable.length > 1) results.appendChild(h('button', { class: 'btn lime', style: 'margin-bottom:8px', onclick: () => { let c = toEngine(claim); for (let k = 0; k < 3; k++) { const rr = E.inspect(c); const fx = rr.issues.filter((i) => i.fix && i.fix.type !== 'note' && i.fix.type !== 'suggestDx'); if (!fx.length) break; fx.forEach((i) => { c = E.applyFix(c, i); }); } claim = fromEngine(c); renderForm(); run(); toast('Fixes applied'); } }, ico('fix'), 'Fix all ' + fixable.length));
      r.issues.slice().sort((a, b) => order[a.sev] - order[b.sev]).forEach((it) => results.appendChild(issueRow(it, { dark: true, canFix: (i) => i.fix.type !== 'note' && i.fix.type !== 'suggestDx', action: (i) => { claim = fromEngine(E.applyFix(toEngine(claim), i)); renderForm(); run(); toast('Fix applied'); } })));
    }
    function report() {
      const c = claim;
      const head = 'CLAIM INSPECTOR REPORT - ' + c.dos + ' · ' + c.payer + ' · age ' + c.age + ' ' + c.sex + ' · POS ' + c.pos + ' · taxonomy ' + c.taxonomy + '\nDX: ' + c.dx.filter(Boolean).map((d, i) => 'ABCDEFGHIJKL'[i] + '=' + fmtDx(d)).join('  ') + '\nLINES: ' + c.lines.filter((l) => l.cpt).map((l) => l.cpt + (l.mods ? '-' + l.mods.trim().replace(/[\s,]+/g, '-') : '') + ' [' + l.ptr + '] x' + l.units).join(' | ');
      return head + '\nScore ' + last.score + ' · ' + last.errs + ' errors · ' + last.warns + ' warnings\n\n' + last.issues.map((i) => '[' + i.sev.toUpperCase() + '] ' + i.rule + ' ' + i.msg).join('\n');
    }
    function claimFormCard() {
      claim.patient = claim.patient || CI.forms.blankPatient();
      const pt = claim.patient, pv = PROVIDER_FOR(claim) || {}, prac = PRACTICE();
      const gaps = CI.forms.formGaps(toEngine(claim), pt, pv, prac);
      const f = (label, key, props) => field(label, inp(pt[key], (v) => { pt[key] = v; save(); refreshGaps(); }, props));
      const gapBox = h('div', { class: 'row', style: 'gap:6px' });
      function refreshGaps() { const g = CI.forms.formGaps(toEngine(claim), pt, PROVIDER_FOR(claim) || {}, PRACTICE()); gapBox.innerHTML = ''; gapBox.appendChild(g.length ? h('span', { class: 'pill amber' }, g.length + ' missing: ' + g.slice(0, 4).join(', ') + (g.length > 4 ? '…' : '')) : h('span', { class: 'pill lime' }, 'form complete')); }
      const body = h('div', { class: 'inner stack' },
        h('p', { class: 'xs muted', style: 'margin:0' }, 'Needed only to print a CMS-1500 or build an upload file. Saved in this browser with the claim; clear it when done.'),
        h('div', { class: 'fields' }, f('Patient name (Last, First)', 'name', { placeholder: 'Doe, Jane' }), f('Date of birth', 'dob', { type: 'date' }), f('Account #', 'account', { class: 'in mono-in' }), f('Phone', 'phone')),
        h('div', { class: 'fields' }, f('Street address', 'address'), f('City', 'city'), f('State', 'state', { maxlength: 2, class: 'in mono-in' }), f('ZIP', 'zip', { class: 'in mono-in' })),
        h('div', { class: 'fields' }, f('Payer name', 'payerName', { placeholder: 'as on card' }), f('Payer ID', 'payerId', { class: 'in mono-in', placeholder: prac.payerIds[claim.payer] || 'from Setup' }), f('Member ID', 'memberId', { class: 'in mono-in' }), f('Group #', 'groupNo', { class: 'in mono-in' })),
        h('div', { class: 'fields' }, field('Relationship to insured', sel([['self', 'Self'], ['spouse', 'Spouse'], ['child', 'Child'], ['other', 'Other']], pt.relationship, (v) => { pt.relationship = v; save(); })), f('Insured name (if not self)', 'insuredName'), f('Prior auth #', 'auth', { class: 'in mono-in' }), f('Onset date (box 14)', 'onset', { type: 'date' })),
        h('div', { class: 'fields' }, f('Referring provider', 'referring'), f('Referring NPI', 'referringNpi', { class: 'in mono-in' }), field('Resubmission', sel([['', 'Original'], ['7', '7 · Replacement'], ['8', '8 · Void']], pt.resub, (v) => { pt.resub = v; save(); })), f('Original claim #', 'origRef', { class: 'in mono-in' })),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', onclick: () => printForm([{ claim: toEngine(claim), patient: pt, provider: pv }]) }, ico('ref'), 'Print CMS-1500'),
          h('button', { class: 'btn ghost', onclick: () => download('claim-' + (pt.account || 'single') + '.837', CI.forms.x837([{ claim: toEngine(claim), patient: pt, provider: pv }], PRACTICE())) }, 'Download 837P'),
          h('button', { class: 'btn ghost', onclick: () => download('claim-' + (pt.account || 'single') + '.csv', CI.forms.csv([{ claim: toEngine(claim), patient: pt, provider: pv }])) }, 'CSV'),
          h('button', { class: 'btn lime', onclick: () => { const q = store.get('queue', []); q.push({ id: uid(), added: today(), claim: JSON.parse(JSON.stringify(claim)) }); store.set('queue', q); toast('Added to submission file (' + q.length + ')'); } }, ico('batch'), 'Add to submission file')));
      const d = h('details', { class: 'fold', open: gaps.length === 0 ? null : null }, h('summary', null, h('span', { class: 'row' }, ico('ref'), 'Claim form · patient & insurance'), gapBox), body);
      refreshGaps();
      return h('div', { class: 'card' }, d);
    }
    function renderForm() {
      formHost.innerHTML = '';
      const upd = (k) => (v) => { claim[k] = v; run(); };
      formHost.appendChild(h('div', { class: 'card' },
        h('div', { class: 'row between', style: 'margin-bottom:16px;flex-wrap:nowrap' }, h('h3', { class: 'h3' }, 'Visit'),
          h('div', { class: 'row', style: 'flex-wrap:nowrap;min-width:0' }, sel([['', 'Load a sample…']].concat(SAMPLES.map((s, i) => [String(i), s.name])), '', (v) => { if (v === '') return; claim = sampleClaim(SAMPLES[+v]); claim.cid = ''; renderForm(); run(); }), h('button', { class: 'btn ghost sm', onclick: () => { claim = blankClaim(); claim.cid = ''; renderForm(); run(); } }, 'Clear'))),
        h('div', { class: 'fields' },
          field('Patient age', inp(claim.age, upd('age'), { type: 'number', min: 0, max: 120, placeholder: 'yrs' })),
          field('Sex', sel([['', '—'], ['F', 'Female'], ['M', 'Male']], claim.sex, upd('sex'))),
          field('Payer', sel([['commercial', 'Commercial'], ['medicare', 'Medicare'], ['medicaid', 'Medicaid'], ['tricare', 'TRICARE'], ['selfpay', 'Self-pay']], claim.payer, upd('payer'))),
          field('Patient status', sel([['est', 'Established'], ['new', 'New (3+ yrs)'], ['', 'Unknown']], claim.status, upd('status'))),
          field('Date of service', inp(claim.dos, upd('dos'), { type: 'date' })),
          field('Place of service', sel(CI.POS.map((p) => [p[0], p[0] + ' · ' + p[1]]), claim.pos, upd('pos')))),
        h('div', { class: 'fields', style: 'margin-top:12px' }, hasProfile() ? field('Rendering provider', sel(providers().map((p) => [p.id, (p.code ? '@' + p.code + ' · ' : '') + (p.name || 'Provider') + (p.npi ? ' · ' + p.npi : '')]), claim.providerId || PROF().id, (v) => { claim.providerId = v; claim.taxonomy = PROF(v).taxonomy; renderForm(); run(); })) : null, field('Rendering provider taxonomy', sel([['', 'Not specified']].concat(Object.keys(CI.TAX).map((k) => [k, k + ' · ' + CI.TAX[k].name])), claim.taxonomy, upd('taxonomy'))))));
      formHost.appendChild(claimFormCard());

      // diagnoses
      const dxBox = h('div', { class: 'card' }, h('div', { class: 'row between', style: 'margin-bottom:16px' }, h('h3', { class: 'h3' }, 'Diagnoses ', h('span', { class: 'mono inline' }, '(box 21 · A-L)')),
        h('button', { class: 'btn ghost sm', onclick: () => { if (claim.dx.length < 12) { claim.dx.push(''); renderForm(); } } }, '+ Add dx')));
      if (prof.favDx && prof.favDx.length) dxBox.appendChild(h('div', { class: 'chips', style: 'margin-bottom:12px' }, h('span', { class: 'mono', style: 'align-self:center' }, 'My dx'), prof.favDx.map((c) => h('button', { class: 'chip', title: (CI.ICD[E.normDx(c)] || {}).desc || '', onclick: () => { if (claim.dx.map(E.normDx).includes(E.normDx(c))) return; const k = claim.dx.indexOf(''); if (k >= 0) claim.dx[k] = c; else if (claim.dx.length < 12) claim.dx.push(c); renderForm(); run(); } }, '+ ' + c))));
      const dxList = h('div', { class: 'lines' });
      claim.dx.forEach((d, i) => {
        const hint = h('div', { class: 'hint' });
        const setHint = (v) => { const n = E.normDx(v); const rec = CI.ICD[n]; hint.textContent = !n ? '' : CI.ICD_INVALID[n] ? '⚠ ' + CI.ICD_INVALID[n] : rec ? rec.desc : 'Not in local code set'; };
        setHint(d);
        const i1 = inp(d, (v) => { claim.dx[i] = v; setHint(v); run(); }, { class: 'in mono-in', placeholder: 'e.g. E11.9', list: 'icdlist', 'aria-label': 'Diagnosis ' + 'ABCDEFGHIJKL'[i] });
        dxList.appendChild(h('div', null, h('div', { class: 'drow' }, h('span', { class: 'ltr' }, 'ABCDEFGHIJKL'[i]), i1, h('span', { class: 'xs muted' }, ''), h('button', { class: 'x', 'aria-label': 'Remove diagnosis', onclick: () => { claim.dx.splice(i, 1); if (!claim.dx.length) claim.dx.push(''); renderForm(); run(); } }, '×')), hint));
      });
      dxBox.appendChild(dxList);
      formHost.appendChild(dxBox);

      // lines
      const lnBox = h('div', { class: 'card' }, h('div', { class: 'row between', style: 'margin-bottom:16px' }, h('h3', { class: 'h3' }, 'Service lines ', h('span', { class: 'mono inline' }, '(box 24)')),
        h('button', { class: 'btn ghost sm', onclick: () => { claim.lines.push({ cpt: '', mods: '', ptr: 'A', units: 1, charge: '' }); renderForm(); } }, '+ Add line')));
      if (prof.favCpt && prof.favCpt.length) lnBox.appendChild(h('div', { class: 'chips', style: 'margin-bottom:12px' }, h('span', { class: 'mono', style: 'align-self:center' }, 'My codes'), prof.favCpt.map((c) => h('button', { class: 'chip', title: (CI.CPT[c] || {}).desc || '', onclick: () => { const empty = claim.lines.find((l) => !l.cpt); const ln = { cpt: c, mods: (prof.favMods || []).includes('QW') && CI.G.qwCodes.includes(c) ? 'QW' : '', ptr: 'A', units: 1, charge: '' }; if (empty) Object.assign(empty, ln); else claim.lines.push(ln); renderForm(); run(); } }, '+ ' + c))));
      const lns = h('div', { class: 'lines' }, h('div', { class: 'lrow head' }, h('span'), h('span', null, 'CPT/HCPCS'), h('span', null, 'Modifiers'), h('span', null, 'Dx ptr'), h('span', null, 'Units'), h('span', null, 'Charge'), h('span')));
      claim.lines.forEach((l, i) => {
        const hint = h('div', { class: 'hint', style: 'grid-column:1/-1;padding-left:32px' });
        const setHint = (v) => { const c = CI.CPT[E.normCpt(v)]; hint.textContent = c ? c.desc + (c.note ? ' - ' + c.note : '') : (v ? 'Not in local code set' : ''); };
        setHint(l.cpt);
        lns.appendChild(h('div', null,
          h('div', { class: 'lrow' }, h('span', { class: 'ix' }, String(i + 1)),
            inp(l.cpt, (v) => { l.cpt = v; setHint(v); run(); }, { class: 'in mono-in', placeholder: '99214', list: 'cptlist', 'aria-label': 'CPT line ' + (i + 1) }),
            inp(l.mods, (v) => { l.mods = v; run(); }, { class: 'in mono-in', placeholder: '25 QW', 'aria-label': 'Modifiers' }),
            inp(l.ptr, (v) => { l.ptr = v; run(); }, { class: 'in mono-in', placeholder: 'AB', maxlength: 4, 'aria-label': 'Pointers' }),
            inp(l.units, (v) => { l.units = v; run(); }, { type: 'number', min: 1, 'aria-label': 'Units' }),
            inp(l.charge, (v) => { l.charge = v; save(); }, { type: 'number', min: 0, placeholder: '$', 'aria-label': 'Charge' }),
            h('button', { class: 'x', 'aria-label': 'Remove line', onclick: () => { claim.lines.splice(i, 1); if (!claim.lines.length) claim.lines.push({ cpt: '', mods: '', ptr: 'A', units: 1, charge: '' }); renderForm(); run(); } }, '×')), hint));
      });
      lnBox.appendChild(lns);
      formHost.appendChild(lnBox);
    }
    const dl1 = h('datalist', { id: 'icdlist' }, Object.keys(CI.ICD).map((k) => h('option', { value: CI.ICD[k].code }, CI.ICD[k].desc)));
    const dl2 = h('datalist', { id: 'cptlist' }, Object.keys(CI.CPT).map((k) => h('option', { value: k }, CI.CPT[k].desc)));
    const prof = PROF(), does = new Set(prof.services || []);
    const tplOk = (t) => !t.c || !hasProfile() || t.c.lines.every((l) => { const s = CI.serviceOf(l[0]); return !s.length || s.some((x) => does.has(x) || (CI.SERVICES.find((y) => y.id === x) || {}).core); });
    const tiles = h('div', { class: 'tiles' }, CI.TEMPLATES.filter(tplOk).map((t) => h('button', { class: 'tile', onclick: () => { claim = t.c ? sampleClaim({ c: t.c }) : blankClaim(); claim.cid = ''; renderForm(); run(); toast(t.name + ' loaded'); } }, ico(t.icon, 'big'), h('b', null, t.name), h('span', { class: 'xs muted' }, t.sub))));
    const root = h('div', null, dl1, dl2,
      pageHead('01 · Scrubber', 'Inspect a claim.', 'Start from a visit type, change what differs, read the verdict.'), demoBanner(),
      tiles,
      h('div', { class: 'grid', style: 'margin-top:32px' }, h('div', { class: 'c7' }, formHost), h('div', { class: 'c5' }, h('div', { class: 'sticky' }, results))));
    renderForm(); run();
    return root;
  }


  /* ---------- Batch review ---------- */
  const BATCH_SAMPLE = [
    '# label | age sex | payer | new/est | POS | diagnoses | CPT[-mod] [dx pointers] [xUnits], ...',
    '# use your own account # or initials as the label - no patient names',
    'A-1001 | 52 M | commercial | est | 11 | Z00.01 I10 Z23 | 99396 A, 99214 B, 90686 C, 90471 C',
    'A-1002 | 71 F | medicare | est | 11 | M17.11 | 99213 A, 20610 A, J3301 A x4, G2211 A',
    'A-1003 | 68 F | medicare | est | 11 | Z00.00 Z23 | 99397 A, 90662 B, 90471 B',
    'A-1004 | 58 M | commercial | est | 11 | E11.65 I10 Z79.84 | 99214 AB, 83036-QW A, 3052F A',
    'A-1005 | 29 F | commercial | est | 02 | F41.9 | 99214 A',
    'A-1006 | 45 F | commercial | est | 11 | J02.0 | 99213 A, 87880-QW A',
    'A-1007 | 63 M | commercial | est | 11 | M54.5 | 99213 A',
    'A-1008 | 34 F | commercial | est | 11 | Z30.430 | 99213-25 A, 58300 A, J7298 A',
    'A-1009 | 8 M | medicaid | est | 11 | Z00.129 Z23 | 99393 A, 90460 B, 90715 B',
    'A-1010 | 77 M | medicare | est | 11 | E11.22 N18.32 I12.9 | 99215 ABC, 99417 A',
    'A-1011 | 40 F | commercial | new | 11 | N92.1 | 99213 A, 77067 A',
    'A-1012 | 62 M | commercial | est | 11 | H61.23 | 99212-25 A, 69210 A',
    'A-1013 | 55 F | commercial | est | 11 | E78.5 | 99214 A, 80061 A, 36415 A',
    'A-1014 | 66 M | medicare | est | 11 | Z00.00 | G0439 A, 99214 A',
    'A-1015 | 33 M | commercial | est | 11 | S61.411A | 12001 A, 99213-25 A, 90715 A'
  ].join('\n');
  function batchPage() {
    const st = store.get('batch', { text: BATCH_SAMPLE });
    let filter = 'All', results = [], openIx = {};
    const ta = h('textarea', { class: 'in mono-in', rows: 12, spellcheck: 'false', style: 'font-size:13px;text-transform:none;line-height:1.55;white-space:pre;overflow:auto', 'aria-label': 'Claims, one per line' });
    ta.value = st.text;
    const summary = h('div', null), list = h('div', null);
    const SAFE = ['addMod', 'removeMod', 'units', 'ptr', 'toEst', 'toNew', 'swapAdmin'];
    function analyze() {
      st.text = ta.value; store.set('batch', st);
      results = E.parseBatch(ta.value).map((p) => { if (p.error) return p; const m = /@([A-Za-z0-9]+)/.exec(p.label); const pv = (m && PROF_BY_CODE(m[1])) || (hasProfile() ? PROF() : null); if (m && !PROF_BY_CODE(m[1])) p.unknownProvider = m[1]; if (pv) { p.claim.taxonomy = pv.taxonomy; p.claim.profile = pv; p.claim.providerId = pv.id; } return Object.assign(p, { res: E.inspect(p.claim) }); });
      results.forEach((p) => { if (p.res) logActivity(actEntry('b:' + p.label.replace(/\s+/g, ''), 'batch', Object.assign({ label: p.label }, p.claim), p.res)); });
      render();
    }
    function fixAll() {
      let n = 0;
      results.forEach((p) => {
        if (!p.claim) return;
        for (let pass = 0; pass < 3; pass++) {
          const r = E.inspect(p.claim);
          const fx = r.issues.filter((i) => i.fix && SAFE.includes(i.fix.type));
          if (!fx.length) break;
          fx.forEach((i) => { p.claim = E.applyFix(p.claim, i); n++; });
        }
      });
      // write fixed claims back into the text
      ta.value = results.map((p) => p.claim ? serialize(p) : p.raw).join('\n');
      analyze(); toast(n + ' safe fixes applied');
    }
    function serialize(p) {
      const c = p.claim;
      return [p.label, (c.age + ' ' + c.sex).trim(), c.payer, c.status, c.pos, c.dx.join(' '),
        c.lines.map((l) => (l.cpt + (l.mods ? '-' + String(l.mods).trim().replace(/\s+/g, '-') : '') + ' ' + l.ptr + (+l.units > 1 ? ' x' + l.units : ''))).join(', ')].join(' | ');
    }
    function csv() {
      const rows = [['claim', 'score', 'errors', 'warnings', 'notes', 'top_issue']].concat(results.map((p) => p.res ? [p.label, p.res.score, p.res.errs, p.res.warns, p.res.infos, (p.res.issues.find((i) => i.sev === 'error') || p.res.issues.find((i) => i.sev === 'warn') || { msg: '' }).msg] : [p.label, '', '', '', '', p.error]));
      return rows.map((r) => r.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    }
    function render() {
      const ok = results.filter((p) => p.res);
      const bad = ok.filter((p) => p.res.errs), warn = ok.filter((p) => !p.res.errs && p.res.warns), clean = ok.filter((p) => !p.res.errs && !p.res.warns);
      const fixable = ok.reduce((n, p) => n + p.res.issues.filter((i) => i.fix && SAFE.includes(i.fix.type)).length, 0);
      summary.innerHTML = '';
      const atRisk = bad.reduce((s, p) => s + CI.claimValue(p.claim), 0), total = ok.reduce((s, p) => s + CI.claimValue(p.claim), 0);
      summary.appendChild(h('div', { class: 'card dark' },
        h('div', { class: 'row between', style: 'align-items:flex-end' },
          h('div', { class: 'row', style: 'gap:40px;align-items:flex-end' },
            h('div', null, h('div', { class: 'score good' }, String(ok.length)), h('div', { class: 'mono' }, 'claims reviewed')),
            total ? h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:#fff' }, money(atRisk)), h('div', { class: 'mono' }, 'at risk of ≈ ' + money(total))) : null,
            h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:var(--red)' }, String(bad.length)), h('div', { class: 'mono' }, 'blocked by errors')),
            h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:#E5A93C' }, String(warn.length)), h('div', { class: 'mono' }, 'need a look')),
            h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:var(--lime)' }, String(clean.length)), h('div', { class: 'mono' }, 'ready to submit'))),
          h('div', { class: 'row' },
            h('button', { class: 'btn lime', disabled: fixable === 0, onclick: fixAll }, ico('fix'), 'Fix ' + fixable + ' safely'),
            h('button', { class: 'btn ghost', style: 'color:#fff;border-color:#2B3445', onclick: () => copy(csv()) }, 'Copy results CSV'),
            h('button', { class: 'btn ghost', style: 'color:#fff;border-color:#2B3445', onclick: () => window.print() }, 'Print')))));
      list.innerHTML = '';
      list.appendChild(h('div', { class: 'chips', style: 'margin:32px 0 16px' }, [['All', results.length], ['Errors', bad.length], ['Warnings', warn.length], ['Ready', clean.length]].map((f) => h('button', { class: 'chip', 'aria-pressed': filter === f[0], onclick: () => { filter = f[0]; render(); } }, f[0] + ' · ' + f[1]))));
      const rank = (p) => !p.res ? -1 : p.res.errs * 100 + p.res.warns * 10 + p.res.infos;
      const shown = results.filter((p) => filter === 'All' || (!p.res && filter === 'Errors') || (p.res && ((filter === 'Errors' && p.res.errs) || (filter === 'Warnings' && !p.res.errs && p.res.warns) || (filter === 'Ready' && !p.res.errs && !p.res.warns)))).sort((a, b) => rank(b) - rank(a));
      const card = h('div', { class: 'card', style: 'padding:0;overflow:hidden' });
      shown.forEach((p) => {
        if (!p.res) { card.appendChild(h('div', { class: 'issue', style: 'padding:16px 24px' }, h('span', { class: 'dot error' }), h('div', null, h('b', null, p.label), h('p', { class: 'small' }, p.error)))); return; }
        if (p.unknownProvider) p.res.issues.unshift({ sev: 'warn', rule: 'PRO-007', msg: 'No provider with code @' + p.unknownProvider + ' in Setup; checked against the active provider instead.' });
        const r = p.res, top = r.issues.find((i) => i.sev === 'error') || r.issues.find((i) => i.sev === 'warn') || r.issues[0];
        const open = !!openIx[p.label];
        const row = h('div', { style: 'border-top:1px solid var(--border)' });
        row.appendChild(h('button', { style: 'all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:88px 64px 1fr auto;gap:16px;align-items:center;width:100%;padding:16px 24px', 'aria-expanded': String(open), onclick: () => { openIx[p.label] = !open; render(); } },
          h('span', { class: 'code' }, p.label),
          h('span', { class: 'h3', style: 'color:' + (r.errs ? 'var(--red)' : r.warns ? 'var(--amber)' : 'var(--violet)') }, String(r.score)),
          h('span', { class: 'small' }, p.claim.lines.map((l) => l.cpt + (l.mods ? '-' + l.mods.replace(/\s+/g, '-') : '')).join('  '), h('div', { class: 'muted xs' }, top ? title(top) : 'No issues')),
          h('span', { class: 'row', style: 'gap:6px' }, r.errs ? h('span', { class: 'pill red' }, r.errs + ' err') : null, r.warns ? h('span', { class: 'pill amber' }, r.warns + ' warn') : null, !r.errs && !r.warns ? h('span', { class: 'pill lime' }, 'ready') : null)));
        if (open) {
          const body = h('div', { style: 'padding:0 24px 24px 24px;background:var(--soft)' });
          const order = { error: 0, warn: 1, info: 2 };
          r.issues.slice().sort((a, b) => order[a.sev] - order[b.sev]).forEach((it) => body.appendChild(issueRow(it, { canFix: (i) => SAFE.includes(i.fix.type), action: (i) => { p.claim = E.applyFix(p.claim, i); ta.value = results.map((x) => x.claim ? serialize(x) : x.raw).join('\n'); analyze(); } })));
          body.appendChild(h('div', { class: 'row', style: 'margin-top:16px' }, h('button', { class: 'btn ghost sm', onclick: () => { store.set('claim', p.claim); location.hash = '#/inspect'; } }, 'Open in full Inspector →')));
          row.appendChild(body);
        }
        card.appendChild(row);
      });
      if (!shown.length) card.appendChild(h('p', { class: 'small muted', style: 'padding:24px' }, 'Nothing in this filter.'));
      list.appendChild(card);
    }
    ta.addEventListener('input', () => { clearTimeout(ta._t); ta._t = setTimeout(analyze, 250); });
    const file = h('input', { type: 'file', accept: '.txt,.csv,.tsv', style: 'display:none', onchange: (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((t) => { ta.value = t; analyze(); }); } });
    const root = h('div', null,
      pageHead('02 · Batch', 'Fifteen claims. One pass.', 'Paste the day, one claim per line. Worst first, safe fixes in one click, CSV out.'), demoBanner(),
      h('div', { class: 'grid' },
        h('div', { class: 'c8' }, h('div', { class: 'card' },
          h('div', { class: 'row between', style: 'margin-bottom:12px' }, h('h3', { class: 'h3' }, 'Claims'), h('div', { class: 'row' },
            h('button', { class: 'btn ghost sm', onclick: () => { ta.value = BATCH_SAMPLE; analyze(); } }, 'Load sample day'), h('button', { class: 'btn ghost sm', onclick: () => file.click() }, 'Upload .txt/.csv'), h('button', { class: 'btn ghost sm', onclick: () => { ta.value = ''; analyze(); } }, 'Clear'), file)),
          ta)),
        h('div', { class: 'c4' }, h('div', { class: 'card flat' }, h('div', { class: 'mono' }, 'Line format'),
          h('p', { class: 'code', style: 'font-size:12px;margin:8px 0;word-break:break-word' }, 'label | 52 M | commercial | est | 11 | Z00.01 I10 Z23 | 99396 A, 99214-25 B, 90471 C x1'),
          h('ul', { class: 'plain dash' }, ['Fields: label (add @CODE to pick a provider, e.g. A-1001 @RM), age + sex, payer (commercial / medicare / medicaid), new or est, POS, diagnoses, services', 'Service: CPT, optional -modifiers, dx pointers (letters = order of the diagnoses), xUnits', 'Short forms work: label | dx | services', 'Use account numbers or initials - never patient names'].map((x) => h('li', null, x)))))),
      h('div', { style: 'margin-top:32px' }, summary, list));
    analyze();
    return root;
  }



  /* ---------- Submission file (queue) ---------- */
  function submitPage() {
    const host = h('div', null);
    function render() {
      host.innerHTML = '';
      const q = store.get('queue', []);
      const items = q.map((x) => ({ q: x, claim: toEngine(x.claim), patient: x.claim.patient || {}, provider: PROVIDER_FOR(x.claim) || {}, res: E.inspect(toEngine(x.claim)) }));
      items.forEach((it) => { it.gaps = CI.forms.formGaps(it.claim, it.patient, it.provider, PRACTICE()); it.ready = it.res.errs === 0 && it.gaps.length === 0; });
      const ready = items.filter((i) => i.ready), tot = items.reduce((s, i) => s + CI.forms.total(i.claim), 0);
      host.appendChild(h('div', { class: 'card dark' }, h('div', { class: 'row between', style: 'align-items:flex-end' },
        h('div', { class: 'row', style: 'gap:40px;align-items:flex-end' },
          h('div', null, h('div', { class: 'score good' }, String(items.length)), h('div', { class: 'mono' }, 'claims in file')),
          h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:' + (ready.length === items.length ? 'var(--lime)' : '#E5A93C') }, String(ready.length)), h('div', { class: 'mono' }, 'ready to send')),
          h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:#fff' }, money(tot)), h('div', { class: 'mono' }, 'total charges'))),
        h('div', { class: 'row' },
          h('button', { class: 'btn lime', disabled: !ready.length, onclick: () => { download('claims-' + today() + '.837', CI.forms.x837(ready, PRACTICE())); ready.forEach((it) => logActivity(actEntry('s:' + it.q.id, 'submit', it.q.claim, it.res))); toast(ready.length + ' claims logged as submitted'); } }, ico('batch'), 'Download 837P (' + ready.length + ')'),
          h('button', { class: 'btn ghost', style: 'color:#fff;border-color:#2B3445', disabled: !ready.length, onclick: () => download('claims-' + today() + '.csv', CI.forms.csv(ready)) }, 'CSV'),
          h('button', { class: 'btn ghost', style: 'color:#fff;border-color:#2B3445', disabled: !items.length, onclick: () => printForm(items) }, 'Print all CMS-1500'),
          h('button', { class: 'btn ghost', style: 'color:#fff;border-color:#2B3445', disabled: !items.length, onclick: () => { if (confirm('Clear the submission file? (Download first.)')) { store.set('queue', []); render(); } } }, 'Clear')))));
      const list = h('div', { class: 'card', style: 'padding:0;overflow:hidden;margin-top:24px' });
      if (!items.length) list.appendChild(h('p', { class: 'small muted', style: 'padding:24px' }, 'Empty. On the Inspector, open “Claim form”, fill the patient block and press “Add to submission file”.'));
      items.forEach((it) => list.appendChild(h('div', { style: 'display:grid;grid-template-columns:24px 1fr auto;gap:16px;align-items:center;padding:16px 24px;border-top:1px solid var(--border)' },
        ico(it.ready ? 'ok' : it.res.errs ? 'error' : 'warn', 'sev ' + (it.ready ? 'ok' : it.res.errs ? 'error' : 'warn')),
        h('div', null, h('b', null, it.patient.name || 'Unnamed patient'), h('span', { class: 'mono inline muted' }, '  ' + (it.patient.account || '') + ' · ' + it.claim.dos + ' · ' + it.claim.payer + ' · ' + (it.provider.name || 'no provider')),
          h('div', { class: 'small muted' }, it.claim.lines.map((l) => l.cpt + (l.mods.length ? '-' + l.mods.join('-') : '')).join('  ') + ' · ' + money(CI.forms.total(it.claim))),
          !it.ready && h('div', { class: 'row', style: 'gap:6px;margin-top:6px' }, it.res.errs ? h('span', { class: 'pill red' }, it.res.errs + ' rule errors') : null, it.gaps.length ? h('span', { class: 'pill amber' }, 'missing: ' + it.gaps.join(', ')) : null)),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', onclick: () => printForm([it]) }, 'CMS-1500'), h('button', { class: 'btn ghost sm', onclick: () => { store.set('claim', it.q.claim); location.hash = '#/inspect'; } }, 'Edit'), h('button', { class: 'x', 'aria-label': 'Remove', onclick: () => { store.set('queue', store.get('queue', []).filter((x) => x.id !== it.q.id)); render(); } }, '×')))));
      host.appendChild(list);
      const prac = PRACTICE();
      if (!prac.groupNpi || !prac.taxId || !prac.submitterId) host.appendChild(h('a', { class: 'banner', href: '#/setup', style: 'margin-top:24px' }, ico('setup'), h('span', null, h('b', null, 'Practice details incomplete. '), 'Billing NPI, tax ID and clearinghouse submitter/receiver IDs go in Setup → Practice; the 837P needs them.'), ico('arrow')));
    }
    render();
    return h('div', null, pageHead('Submit', 'Build the file, print the forms.', 'Claims you added from the Inspector. The 837P is the standard electronic format clearinghouses accept; the CMS-1500 print is a review facsimile - paper claims must go on the official red-ink form.'), host);
  }

  /* ---------- Provider setup ---------- */
  function setupPage() {
    let p = PROF();
    const form = h('div', { class: 'stack-lg' });
    const side = h('div', { class: 'sticky stack-lg' });
    const provBar = h('div', null);
    function renderProvBar() {
      provBar.innerHTML = '';
      const list = providers();
      provBar.appendChild(h('div', { class: 'card flat' }, h('div', { class: 'row between' }, h('div', { class: 'row' }, ico('user', 'big'), h('h3', { class: 'h3' }, 'Providers'), h('span', { class: 'pill violet' }, list.length)),
        h('div', { class: 'row' }, h('button', { class: 'btn primary sm', onclick: () => { const n = Object.assign(CI.blankProfile(), { id: uid(), code: 'P' + (list.length + 1), name: '' }); saveProfile(n); p = PROF(n.id); renderProvBar(); renderForm(); renderSide(); } }, '+ Add provider'),
          list.length > 1 ? h('button', { class: 'btn danger sm', onclick: () => { if (confirm('Remove ' + (p.name || 'this provider') + '?')) { store.set('providers', list.filter((x) => x.id !== p.id)); store.set('activeProvider', providers()[0].id); p = PROF(); renderWho(); renderProvBar(); renderForm(); renderSide(); } } }, 'Remove') : null)),
        h('div', { class: 'chips', style: 'margin-top:12px' }, list.map((x) => h('button', { class: 'chip', 'aria-pressed': String(x.id === p.id), onclick: () => { store.set('activeProvider', x.id); p = PROF(x.id); renderWho(); renderProvBar(); renderForm(); renderSide(); } }, '@' + (x.code || '?') + ' ' + (x.name || 'Unnamed')))),
        h('p', { class: 'xs muted', style: 'margin:12px 0 0' }, 'The selected provider is the default for new claims. In Batch, put @CODE in the label to route a line to a provider.')));
    }
    const pr = PRACTICE();
    const practiceCard = (() => {
      const s = (k) => (v) => { pr[k] = v; store.set('practice', pr); };
      const pid = (k) => (v) => { pr.payerIds[k] = v; store.set('practice', pr); };
      return h('div', { class: 'card' }, h('div', { class: 'row', style: 'margin-bottom:16px' }, ico('home', 'big'), h('h3', { class: 'h3' }, 'Practice (billing provider · box 33)')),
        h('div', { class: 'fields' }, field('Practice name', inp(pr.name, s('name'))), field('Billing NPI (type 2)', inp(pr.groupNpi, s('groupNpi'), { class: 'in mono-in' })), field('Tax ID (EIN)', inp(pr.taxId, s('taxId'), { class: 'in mono-in' })), field('Phone', inp(pr.phone, s('phone')))),
        h('div', { class: 'fields', style: 'margin-top:12px' }, field('Street', inp(pr.address1, s('address1'))), field('City', inp(pr.city, s('city'))), field('State', inp(pr.state, s('state'), { maxlength: 2, class: 'in mono-in' })), field('ZIP', inp(pr.zip, s('zip'), { class: 'in mono-in' }))),
        h('div', { class: 'mono', style: 'margin:16px 0 8px' }, 'Clearinghouse (837P envelope)'),
        h('div', { class: 'fields' }, field('Submitter ID', inp(pr.submitterId, s('submitterId'), { class: 'in mono-in', placeholder: 'from clearinghouse' })), field('Receiver ID', inp(pr.receiverId, s('receiverId'), { class: 'in mono-in' })), field('Receiver name', inp(pr.receiverName, s('receiverName'))), field('Billing contact', inp(pr.contact, s('contact')))),
        h('div', { class: 'mono', style: 'margin:16px 0 8px' }, 'Default payer IDs'),
        h('div', { class: 'fields' }, field('Medicare', inp(pr.payerIds.medicare, pid('medicare'), { class: 'in mono-in', placeholder: 'MAC payer ID' })), field('Medicaid', inp(pr.payerIds.medicaid, pid('medicaid'), { class: 'in mono-in' })), field('Commercial', inp(pr.payerIds.commercial, pid('commercial'), { class: 'in mono-in', placeholder: 'override per claim' })), field('TRICARE', inp(pr.payerIds.tricare, pid('tricare'), { class: 'in mono-in' }))));
    })();
    const set = (k) => (v) => { p[k] = v; saveProfile(p); renderSide(); };
    function chipEditor(key, placeholder, lookup) {
      const box = h('div', { class: 'chips' });
      const draw = () => {
        box.innerHTML = '';
        (p[key] || []).forEach((c, i) => box.appendChild(h('button', { class: 'chip', 'aria-pressed': 'true', title: 'Remove ' + c + (lookup && lookup(c) ? ' · ' + lookup(c) : ''), onclick: () => { p[key].splice(i, 1); saveProfile(p); draw(); } }, c, ' ×')));
        const i = h('input', { class: 'in mono-in', placeholder, style: 'width:160px;height:32px', 'aria-label': 'Add to ' + key });
        i.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = i.value.trim().toUpperCase(); if (v && !(p[key] || []).includes(v)) { p[key] = (p[key] || []).concat(v); saveProfile(p); draw(); } } });
        box.appendChild(i);
      };
      draw(); return box;
    }
    function renderForm() {
      form.innerHTML = '';
      const npiIn = inp(p.npi, (v, el) => { p.npi = v.replace(/\D/g, '').slice(0, 10); el.value = p.npi; el.classList.toggle('bad', p.npi.length === 10 && !CI.validNPI(p.npi)); saveProfile(p); renderSide(); }, { class: 'in mono-in', placeholder: '10 digits', inputmode: 'numeric' });
      form.appendChild(h('div', { class: 'card' }, h('div', { class: 'row', style: 'margin-bottom:16px' }, ico('user', 'big'), h('h3', { class: 'h3' }, 'Who is billing')),
        h('div', { class: 'fields' },
          field('Provider name', inp(p.name, set('name'), { placeholder: 'Dr. A. Patel' })),
          field('Short code (@)', inp(p.code, (v, el) => { p.code = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4); el.value = p.code; saveProfile(p); renderProvBar(); }, { class: 'in mono-in', placeholder: 'RM' })),
          field('Credential', sel(['MD', 'DO', 'NP', 'PA', 'CNM', 'Other'], p.credential, set('credential'))),
          field('Rendering NPI (type 1)', npiIn),
          field('Group / billing NPI (type 2)', inp(p.groupNpi, (v, el) => { p.groupNpi = v.replace(/\D/g, '').slice(0, 10); el.value = p.groupNpi; saveProfile(p); renderSide(); }, { class: 'in mono-in', placeholder: 'optional' }))),
        h('div', { class: 'fields', style: 'margin-top:12px' },
          field('Specialty', sel(Object.keys(CI.SPECIALTIES).map((k) => [k, CI.SPECIALTIES[k].label]), p.specialty, (v) => { const s = CI.SPECIALTIES[v]; p.specialty = v; p.taxonomy = s.taxonomy; p.services = s.services.slice(); saveProfile(p); renderForm(); renderSide(); toast(s.label + ' preset applied'); })),
          field('Taxonomy', sel(Object.keys(CI.TAX).map((k) => [k, k + ' · ' + CI.TAX[k].name]), p.taxonomy, set('taxonomy'))),
          field('CLIA certificate #', inp(p.clia, set('clia'), { class: 'in mono-in', placeholder: '10D1234567 (blank = no in-office labs)' })),
          field('Default place of service', sel(CI.POS.map((x) => [x[0], x[0] + ' · ' + x[1]]), p.pos, set('pos')))),
        h('div', { style: 'margin-top:16px' }, h('div', { class: 'mono', style: 'margin-bottom:8px' }, 'Payers you bill'), h('div', { class: 'chips' }, [['commercial', 'Commercial'], ['medicare', 'Medicare'], ['medicaid', 'Medicaid'], ['tricare', 'TRICARE'], ['selfpay', 'Self-pay']].map((x) => h('button', { class: 'chip', 'aria-pressed': String((p.payers || []).includes(x[0])), onclick: () => { const s = new Set(p.payers || []); s.has(x[0]) ? s.delete(x[0]) : s.add(x[0]); p.payers = Array.from(s); saveProfile(p); renderForm(); renderSide(); } }, x[1])),
          h('button', { class: 'chip', 'aria-pressed': String(p.telehealth !== false), onclick: () => { p.telehealth = p.telehealth === false; saveProfile(p); renderForm(); } }, ico('tele'), ' Telehealth offered')))));
      const does = new Set(p.services || []);
      form.appendChild(h('div', { class: 'card' }, h('div', { class: 'row between', style: 'margin-bottom:4px' }, h('div', { class: 'row' }, ico('capture', 'big'), h('h3', { class: 'h3' }, 'Services you provide')), h('span', { class: 'pill violet' }, does.size + ' selected')),
        h('p', { class: 'small muted', style: 'margin:0 0 16px' }, 'Tap to toggle. Codes outside this list get flagged on claims; templates and charge-capture follow it.'),
        h('div', { class: 'svcgrid' }, CI.SERVICES.map((s) => h('button', { class: 'svc', 'aria-pressed': String(does.has(s.id) || !!s.core), disabled: !!s.core, onclick: () => { does.has(s.id) ? does.delete(s.id) : does.add(s.id); p.services = Array.from(does); saveProfile(p); renderForm(); renderSide(); } }, ico(s.icon), h('span', null, s.label))))));
      form.appendChild(h('div', { class: 'card stack' }, h('div', { class: 'row' }, ico('codes', 'big'), h('h3', { class: 'h3' }, 'Your go-to codes')),
        h('p', { class: 'small muted', style: 'margin:0' }, 'These become one-tap chips on the Inspector. Type a code and press Enter.'),
        field('Procedure codes', chipEditor('favCpt', '99214', (c) => (CI.CPT[c] || {}).desc)),
        field('Diagnoses', chipEditor('favDx', 'E11.9', (c) => (CI.ICD[E.normDx(c)] || {}).desc)),
        field('Modifiers', chipEditor('favMods', '25', (c) => (CI.MODMAP[c] || {}).name)),
        field('Notes (payer quirks, auth rules, anything the biller should remember)', (() => { const t = h('textarea', { class: 'in', rows: 3, placeholder: 'e.g. BCBS wants POS 11 + 95 for video visits; Medicaid needs EP on well visits' }); t.value = p.notes || ''; t.addEventListener('input', () => { p.notes = t.value; saveProfile(p); }); return t; })())));
    }
    function renderSide() {
      side.innerHTML = '';
      const npiOk = p.npi.length === 10 && CI.validNPI(p.npi);
      const checks = [
        [p.name ? 'ok' : 'warn', p.name ? 'Name set' : 'Add provider name'],
        [!p.npi ? 'warn' : npiOk ? 'ok' : 'error', !p.npi ? 'Add rendering NPI' : npiOk ? 'NPI check digit valid' : 'NPI fails check digit'],
        [p.taxonomy ? 'ok' : 'warn', 'Taxonomy ' + (CI.TAX[p.taxonomy] ? CI.TAX[p.taxonomy].name : 'not set')],
        [p.clia ? 'ok' : 'info', p.clia ? 'CLIA on file' : 'No CLIA - in-office labs will be flagged'],
        [(p.services || []).length > 2 ? 'ok' : 'warn', (p.services || []).length + ' services selected'],
        [(p.favCpt || []).length ? 'ok' : 'info', (p.favCpt || []).length + ' go-to codes']
      ];
      const ex = () => { const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'claim-inspector-profile.json' }); document.body.appendChild(a); a.click(); a.remove(); };
      const file = h('input', { type: 'file', accept: '.json', style: 'display:none', onchange: (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((t) => { try { p = Object.assign(CI.blankProfile(), JSON.parse(t), { id: p.id, code: JSON.parse(t).code || p.code }); saveProfile(p); renderProvBar(); renderForm(); renderSide(); toast('Profile imported'); } catch (err) { toast('Not a valid profile file'); } }); } });
      side.appendChild(h('div', { class: 'card dark' }, h('div', { class: 'mono' }, 'Profile'), h('div', { class: 'h2', style: 'margin:8px 0 4px;color:#fff' }, p.name || 'Unnamed provider'), h('div', { class: 'mono' }, [p.credential, p.npi && 'NPI ' + p.npi, CI.SPECIALTIES[p.specialty] && CI.SPECIALTIES[p.specialty].label].filter(Boolean).join(' · ')),
        h('ul', { class: 'mini-findings', style: 'margin-top:16px' }, checks.map((c) => h('li', null, ico(c[0], 'sev ' + c[0]), h('b', { style: 'flex:1' }, c[1])))),
        h('div', { class: 'row', style: 'margin-top:16px' }, h('button', { class: 'btn lime sm', onclick: ex }, 'Export'), h('button', { class: 'btn ghost sm', style: 'color:#fff;border-color:#2B3445', onclick: () => file.click() }, 'Import'), h('button', { class: 'btn ghost sm', style: 'color:#fff;border-color:#2B3445', onclick: () => { if (confirm('Clear the saved provider profile?')) { try { localStorage.removeItem('ci.profile'); localStorage.removeItem('ci.providers'); localStorage.removeItem('ci.activeProvider'); } catch (e) { /* ignore */ } p = PROF(); p.id = uid(); p.code = 'P1'; saveProfile(p); renderProvBar(); renderWho(); renderForm(); renderSide(); } } }, 'Reset'), file)));
      side.appendChild(h('div', { class: 'card flat' }, h('div', { class: 'mono' }, 'What this changes'), h('ul', { class: 'plain dash', style: 'margin-top:8px' }, ['Inspector and Batch default to your taxonomy, POS and payers', 'Templates hide services you don\'t do; go-to codes become one-tap chips', 'Claims get extra checks: NPI check digit, CLIA for in-office labs, services outside your list, specialty age range, payers you aren\'t enrolled with', 'Stays in this browser only - export to move it'].map((x) => h('li', null, x)))));
    }
    if (!hasProfile()) { p.id = uid(); p.code = 'P1'; saveProfile(p); }
    renderProvBar(); renderForm(); renderSide();
    const root = h('div', null, pageHead('00 · Setup', 'Tell it who you are.', 'Practice once, each provider once. Then every tab defaults to you and the scrubber knows what each clinician can bill.'),
      h('div', { class: 'grid' }, h('div', { class: 'c7 stack-lg' }, provBar, form, practiceCard), h('div', { class: 'c5' }, side)));
    return root;
  }

  /* ---------- Match lab ---------- */
  function matchPage() {
    const st = store.get('match', { cpt: '83036', dx: 'E11.9, I10', age: 58, sex: 'M', tax: '207Q00000X' });
    const out = h('div', { class: 'stack-lg' });
    const explore = h('div', { class: 'stack-lg' });
    function run() {
      store.set('match', st);
      out.innerHTML = '';
      const dxs = st.dx.split(/[,;\s]+/).filter(Boolean);
      const m = E.matchCptDx(st.cpt, dxs);
      const label = { ok: ['✓', 'ok', 'Supported'], partial: ['!', 'warn', 'Partly supported'], mismatch: ['✕', 'bad', 'Not supported'], missing: ['?', 'warn', 'Need a diagnosis'], unknown: ['?', 'warn', 'Unknown code'] }[m.verdict];
      const card = h('div', { class: 'card' }, h('div', { class: 'mono' }, 'Result'));
      card.appendChild(h('div', { class: 'verdict' }, h('div', { class: 'vmark ' + label[1] }, label[0]), h('div', null, h('div', { class: 'h4' }, 'CPT ↔ Diagnosis · ' + label[2]),
        h('div', { class: 'small muted' }, m.cpt ? st.cpt.toUpperCase() + ' · ' + m.cpt.desc : ''),
        m.reasons.map((r) => h('p', { class: 'small', style: 'margin:8px 0 0' }, r)),
        m.dx.length ? h('div', { class: 'chips', style: 'margin-top:12px' }, m.dx.map((d) => h('span', { class: 'pill ' + (d.ok ? 'lime' : 'red') }, d.code + (d.rec ? ' ' + d.rec.desc.slice(0, 28) : '')))) : null,
        m.suggestions.length ? h('div', { style: 'margin-top:16px' }, h('div', { class: 'mono' }, 'Diagnoses that would support it (examples)'), h('div', { class: 'chips', style: 'margin-top:8px' }, m.suggestions.map((d) => h('span', { class: 'pill violet', title: d.desc }, d.code + ' · ' + d.desc.slice(0, 30))))) : null)));
      // patient + taxonomy via engine
      const ln = { cpt: st.cpt, mods: [], ptr: 'A', units: 1 };
      const r = E.inspect({ age: st.age, sex: st.sex, payer: 'commercial', pos: '11', taxonomy: st.tax, status: '', dx: dxs, lines: [ln] });
      const pick = (f) => r.issues.filter(f);
      const patient = pick((i) => /^(AGE|SEX|DX-007|DX-008|DX-009|DX-010|DX-011)/.test(i.rule));
      const tax = pick((i) => /^TAX/.test(i.rule));
      const mk = (title, items, okmsg) => h('div', { class: 'verdict' }, h('div', { class: 'vmark ' + (items.some((x) => x.sev === 'error') ? 'bad' : items.some((x) => x.sev === 'warn') ? 'warn' : 'ok') }, items.some((x) => x.sev === 'error') ? '✕' : items.some((x) => x.sev === 'warn') ? '!' : '✓'),
        h('div', null, h('div', { class: 'h4' }, title), items.length ? items.map((i) => h('p', { class: 'small', style: 'margin:8px 0 0' }, i.msg)) : h('p', { class: 'small muted', style: 'margin:8px 0 0' }, okmsg)));
      card.appendChild(mk('Service / Dx ↔ Patient (age & sex)', patient, 'No age or sex conflict found.'));
      const t = CI.TAX[st.tax];
      card.appendChild(mk('Dx ↔ Provider taxonomy' + (t ? ' · ' + t.name : ''), tax, t ? t.note : 'No taxonomy selected.'));
      out.appendChild(card);
    }
    function exploreRender() {
      explore.innerHTML = '';
      const q = st.q || '';
      const box = h('div', { class: 'card' }, h('div', { class: 'mono' }, 'Reverse lookup'), h('h3', { class: 'h3', style: 'margin:8px 0 16px' }, 'What does a diagnosis typically support?'));
      box.appendChild(inp(q, (v) => { st.q = v; store.set('match', st); fill(); }, { placeholder: 'ICD-10 e.g. E11.9, I10, J45.909', class: 'in mono-in' }));
      const res = h('div', { style: 'margin-top:16px' });
      box.appendChild(res);
      function fill() {
        res.innerHTML = '';
        const n = E.normDx(st.q || '');
        if (!n) return;
        const rec = CI.ICD[n];
        const c = E.cptsForDx(n);
        res.appendChild(h('div', { class: 'small' }, rec ? [h('b', null, rec.code), ' ' + rec.desc] : 'Not in local set (matching prefix families only).'));
        if (rec && rec.tip) res.appendChild(h('p', { class: 'small muted' }, rec.tip));
        if (rec && rec.hcc) res.appendChild(h('span', { class: 'pill violet' }, 'risk-adjusting'));
        res.appendChild(h('div', { class: 'chips', style: 'margin-top:12px' }, c.length ? c.map((x) => h('span', { class: 'pill', title: x.desc }, x.code + ' · ' + x.desc.slice(0, 32))) : h('span', { class: 'small muted' }, 'No service-specific pairings; any E/M can use this dx.')));
      }
      fill();
      explore.appendChild(box);
    }
    const root = h('div', null,
      pageHead('03 · Match lab', 'Does the code fit the diagnosis, the patient and the provider?', 'Three-way check: CPT ↔ ICD-10 medical necessity, service/dx ↔ patient age & sex, and diagnosis ↔ taxonomy scope. Based on typical coverage logic, not a specific LCD - always confirm payer policy.'),
      h('div', { class: 'grid' },
        h('div', { class: 'c5' }, h('div', { class: 'card sticky' }, h('h3', { class: 'h3', style: 'margin-bottom:16px' }, 'Inputs'),
          h('div', { class: 'stack' },
            field('CPT / HCPCS', inp(st.cpt, (v) => { st.cpt = v; run(); }, { class: 'in mono-in', list: 'cptl2', placeholder: '83036' })),
            field('Diagnoses (comma-separated)', inp(st.dx, (v) => { st.dx = v; run(); }, { class: 'in mono-in', placeholder: 'E11.9, I10' })),
            h('div', { class: 'fields' }, field('Age', inp(st.age, (v) => { st.age = v; run(); }, { type: 'number' })), field('Sex', sel([['', '—'], ['F', 'Female'], ['M', 'Male']], st.sex, (v) => { st.sex = v; run(); }))),
            field('Rendering taxonomy', sel([['', 'None']].concat(Object.keys(CI.TAX).map((k) => [k, k + ' · ' + CI.TAX[k].name])), st.tax, (v) => { st.tax = v; run(); })),
            h('datalist', { id: 'cptl2' }, Object.keys(CI.CPT).map((k) => h('option', { value: k }, CI.CPT[k].desc)))))),
        h('div', { class: 'c7' }, out, explore)));
    run(); exploreRender();
    return root;
  }

  /* ---------- E/M ---------- */
  const MDM = {
    p: ['Straightforward · 1 self-limited or minor problem', 'Low · 2+ self-limited/minor; OR 1 stable chronic illness; OR 1 acute uncomplicated illness/injury', 'Moderate · 1+ chronic illness with exacerbation/progression/side effects; OR 2+ stable chronic; OR 1 undiagnosed new problem with uncertain prognosis; OR 1 acute illness with systemic symptoms; OR 1 acute complicated injury', 'High · 1+ chronic illness with severe exacerbation; OR 1 acute/chronic illness or injury that poses a threat to life or bodily function'],
    d: ['Minimal or none', 'Limited · Cat 1: any 2 of (external notes each unique source / each unique test result / each unique test ordered) OR Cat 2: independent historian', 'Moderate · 1 of 3 categories: (1) any 3 from notes, results, orders, independent historian; (2) independent interpretation of a test by another physician; (3) discussion of management with external physician/QHP/appropriate source', 'Extensive · 2 of the 3 categories above'],
    r: ['Minimal · e.g., rest, gargles, elastic bandage', 'Low · OTC drugs, minor surgery without risk factors, PT/OT', 'Moderate · prescription drug management; minor surgery with risk factors; elective major surgery without risk factors; diagnosis/treatment limited by social determinants of health', 'High · drug therapy requiring intensive monitoring for toxicity; elective major surgery with risk factors; decision for hospitalization; DNR / de-escalation due to poor prognosis; parenteral controlled substances']
  };
  function emPage() {
    const st = store.get('em', { status: 'est', p: 2, d: 1, r: 2, min: '', months: '' });
    const out = h('div', { class: 'card dark' });
    function run() {
      store.set('em', st);
      out.innerHTML = '';
      let status = st.status;
      if (st.months !== '' && !isNaN(+st.months)) status = +st.months >= 36 ? 'new' : 'est';
      const lvl = E.mdmLevel(+st.p, +st.d, +st.r);
      const mdmCode = E.EM_BY_LEVEL[status][lvl];
      const tm = st.min !== '' ? E.timeEM(status, +st.min) : null;
      const names = ['Straightforward', 'Low', 'Moderate', 'High'];
      out.appendChild(h('div', { class: 'mono' }, 'Result · ' + (status === 'new' ? 'new patient' : 'established patient') + (st.months !== '' ? ' (' + st.months + ' months since last visit)' : '')));
      out.appendChild(h('div', { class: 'row', style: 'margin:16px 0;gap:32px;align-items:flex-end' },
        h('div', null, h('div', { class: 'score good' }, mdmCode), h('div', { class: 'mono' }, 'by MDM · ' + names[lvl])),
        tm && tm.code ? h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:#fff' }, tm.code), h('div', { class: 'mono' }, 'by time · ' + st.min + ' min')) : null));
      const best = tm && tm.code && tm.code > mdmCode ? tm.code : mdmCode;
      out.appendChild(h('p', { class: 'small' }, h('b', null, 'Bill ' + best), ' - choose whichever method supports the higher level, and document it. ', tm && tm.code && tm.code > mdmCode ? 'Time supports a higher level than MDM here.' : tm && tm.code && tm.code < mdmCode ? 'MDM supports a higher level than time.' : ''));
      const sec = (title, lines) => h('div', { style: 'margin-top:24px' }, h('div', { class: 'mono' }, title), lines.map((l) => h('p', { class: 'small', style: 'margin:8px 0 0' }, l)));
      if (tm && tm.prolongedCPT > 0) out.appendChild(sec('Prolonged service', ['CPT: 99417 × ' + tm.prolongedCPT + ' with ' + (status === 'new' ? '99205' : '99215') + ' (commercial / CPT rules; thresholds 75 / 55 min).', tm.prolongedMedicare > 0 ? 'Medicare: G2212 × ' + tm.prolongedMedicare + ' (starts at ' + (status === 'new' ? '89' : '69') + ' min).' : 'Medicare G2212 starts at ' + (status === 'new' ? '89' : '69') + ' min.']));
      out.appendChild(sec('Add-ons to consider', ['G2211 (Medicare) when you are the continuing focal point for all needed care or ongoing care for a serious/complex condition. Not with modifier 25 except vaccine/AWV/preventive same day.', 'Same-day procedure? Add modifier 25 to the E/M only if separately identifiable.']));
    }
    const levelSel = (key, arr) => h('div', { class: 'stack-sm' }, arr.map((t, i) => h('label', { class: 'check' }, h('input', { type: 'radio', name: 'm' + key, checked: +st[key] === i, onchange: () => { st[key] = i; run(); } }), h('span', null, t))));
    const root = h('div', null,
      pageHead('04 · Level', 'Level the visit by MDM or by time.', 'The 2021+ office E/M rules. Choose the level supported in each MDM element - two of three set the level. Or enter total provider time on the date of the encounter.'),
      h('div', { class: 'grid' },
        h('div', { class: 'c7 stack-lg' },
          h('div', { class: 'card' }, h('h3', { class: 'h3' }, 'Patient'),
            h('div', { class: 'fields', style: 'margin-top:16px' }, field('Status', sel([['est', 'Established'], ['new', 'New']], st.status, (v) => { st.status = v; run(); })),
              field('Months since last visit (same specialty/group)', inp(st.months, (v) => { st.months = v; run(); }, { type: 'number', placeholder: '≥36 ⇒ new' })),
              field('Total time on date of encounter (min)', inp(st.min, (v) => { st.min = v; run(); }, { type: 'number', placeholder: 'optional' })))),
          h('div', { class: 'card' }, h('div', { class: 'mono' }, 'Element 1'), h('h3', { class: 'h3', style: 'margin:4px 0 12px' }, 'Number & complexity of problems'), levelSel('p', MDM.p)),
          h('div', { class: 'card' }, h('div', { class: 'mono' }, 'Element 2'), h('h3', { class: 'h3', style: 'margin:4px 0 12px' }, 'Amount & complexity of data'), levelSel('d', MDM.d)),
          h('div', { class: 'card' }, h('div', { class: 'mono' }, 'Element 3'), h('h3', { class: 'h3', style: 'margin:4px 0 12px' }, 'Risk of management'), levelSel('r', MDM.r))),
        h('div', { class: 'c5' }, h('div', { class: 'sticky stack-lg' }, out,
          h('div', { class: 'card flat' }, h('div', { class: 'mono' }, 'Time thresholds (min)'),
            h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Code', 'Min', 'Code', 'Min'].map((x) => h('th', null, x)))),
              h('tbody', null, [['99202', '15', '99212', '10'], ['99203', '30', '99213', '20'], ['99204', '45', '99214', '30'], ['99205', '60', '99215', '40']].map((r) => h('tr', null, r.map((c, i) => h('td', { class: i % 2 ? 'muted' : 'code' }, c)))))),
            h('p', { class: 'xs muted' }, 'Time counts the physician/QHP’s own time that day (not clinical staff). Do not count time for separately billed services or travel/teaching.'))))));
    run();
    return root;
  }

  /* ---------- Modifiers ---------- */
  function modPage() {
    const wiz = h('div', null);
    const path = [];
    function show(key) {
      wiz.innerHTML = '';
      const n = CI.TREE[key];
      path.length === 0 || wiz.appendChild(h('button', { class: 'btn ghost sm', style: 'margin-bottom:16px', onclick: () => { path.pop(); show(path.length ? path[path.length - 1] : 'start'); } }, '← Back'));
      wiz.appendChild(h('div', { class: 'mono' }, 'Question ' + (path.length + 1)));
      wiz.appendChild(h('h3', { class: 'h3', style: 'margin-top:8px' }, n.q));
      n.a.forEach((a) => wiz.appendChild(h('button', { class: 'opt', onclick: () => {
        if (a.next) { path.push(a.next); show(a.next); } else {
          wiz.innerHTML = '';
          wiz.appendChild(h('div', { class: 'result' }, h('div', { class: 'mono', style: 'color:#C7F36B' }, 'Recommendation'),
            h('div', { class: 'modbig', style: 'margin:12px 0' }, a.result.mod === 'none' ? 'No modifier' : a.result.mod),
            a.result.on && h('div', { class: 'mono' }, 'Append to · ' + a.result.on), h('p', { style: 'margin:16px 0 0;color:#E8EBF2' }, a.result.why)));
          wiz.appendChild(h('button', { class: 'btn ghost', style: 'margin-top:16px', onclick: () => { path.length = 0; show('start'); } }, 'Start over'));
        }
      } }, a.t)));
    }
    const list = h('div', null);
    let q = '';
    function fill() {
      list.innerHTML = '';
      CI.MODS.filter((m) => !q || (m.code + ' ' + m.name + ' ' + m.applies + ' ' + m.meaning).toLowerCase().includes(q.toLowerCase())).forEach((m) =>
        list.appendChild(h('div', { class: 'modcard' }, h('div', { class: 'mc' }, m.code), h('div', null, h('div', { class: 'h4' }, hl(m.name, q)), h('div', { class: 'small muted' }, m.applies), m.meaning && h('p', { class: 'small', style: 'margin:8px 0 0' }, m.meaning),
          m.doc && h('p', { class: 'small', style: 'margin:4px 0 0' }, h('span', { class: 'mono inline' }, 'Document · '), m.doc), m.payer && h('p', { class: 'small', style: 'margin:4px 0 0' }, h('span', { class: 'mono inline' }, 'Payer · '), m.payer)))));
    }
    const root = h('div', null,
      pageHead('05 · Modify', 'Which modifier, and why.', 'Walk the decision tree for the common family-medicine situations, then browse the full reference. Modifier use is payer-specific - the reasoning here is the conservative default.'),
      h('div', { class: 'grid' },
        h('div', { class: 'c5' }, h('div', { class: 'card sticky' }, wiz)),
        h('div', { class: 'c7' }, h('div', { class: 'row between', style: 'margin-bottom:16px' }, h('h3', { class: 'h3' }, 'Reference'), h('div', { style: 'width:260px' }, inp('', (v) => { q = v; fill(); }, { placeholder: 'Filter modifiers…', type: 'search' }))), list)));
    show('start'); fill();
    return root;
  }

  /* ---------- Charge capture ---------- */
  function capturePage() {
    const sel_ = store.get('capture', {});
    const out = h('div', { class: 'card dark' });
    function run() {
      store.set('capture', sel_);
      out.innerHTML = '';
      const picked = CI.CAPTURE.filter((c) => sel_[c.id]);
      out.appendChild(h('div', { class: 'mono' }, 'Candidate charges'));
      if (!picked.length) { out.appendChild(h('p', { class: 'small', style: 'margin-top:16px' }, 'Tick what happened during the visit.')); return; }
      out.appendChild(h('div', { class: 'score good', style: 'margin:12px 0 4px;font-size:64px' }, String(picked.reduce((n, c) => n + c.codes.length, 0))));
      out.appendChild(h('div', { class: 'mono' }, 'codes to consider'));
      picked.forEach((c) => out.appendChild(h('div', { class: 'issue', style: 'border-color:#1F2937;grid-template-columns:1fr' }, h('div', null, h('div', { class: 'h4', style: 'color:#fff' }, c.label),
        c.codes.map((x) => h('div', { class: 'row', style: 'gap:12px;margin-top:8px;align-items:baseline' }, h('span', { class: 'code', style: 'color:#C7F36B;min-width:96px' }, x[0]), h('span', { class: 'small' }, x[1]), x[2] && h('span', { class: 'pill dark', style: 'border:1px solid #2B3445' }, x[2]))),
        h('div', { class: 'mono', style: 'margin-top:8px' }, 'Dx · ' + c.dx)))));
      out.appendChild(h('p', { class: 'xs muted', style: 'margin-top:16px' }, 'Only bill what is documented, medically necessary and separately identifiable. Time counted toward E/M cannot be counted again toward counseling codes.'));
    }
    const boxes = CI.CAPTURE.map((c) => h('label', { class: 'check', style: 'padding:12px 16px;border:1px solid var(--border);border-radius:10px;background:var(--surface)' }, h('input', { type: 'checkbox', checked: !!sel_[c.id], onchange: (e) => { sel_[c.id] = e.target.checked; run(); } }), h('span', null, c.label)));
    const root = h('div', null,
      pageHead('06 · Capture', 'What did you do that nobody billed?', 'Tick the things that happened in the room. The finder lists every code worth considering, with the modifier and dx that usually goes with it.'),
      h('div', { class: 'grid' }, h('div', { class: 'c7' }, h('div', { style: 'display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))' }, boxes)), h('div', { class: 'c5' }, h('div', { class: 'sticky' }, out))));
    run();
    return root;
  }

  /* ---------- Preventive ---------- */
  function prevPage() {
    const groups = Object.keys(CI.PREVENTIVE);
    let cur = store.get('prevTab', groups[0]);
    const host = h('div', null);
    function fill() {
      store.set('prevTab', cur);
      host.innerHTML = '';
      host.appendChild(h('div', { class: 'chips', style: 'margin-bottom:24px' }, groups.map((g) => h('button', { class: 'chip', 'aria-pressed': g === cur, onclick: () => { cur = g; fill(); } }, g))));
      host.appendChild(h('div', { class: 'card scroll-x' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Service', 'Who / how often', 'CPT / HCPCS', 'Typical ICD-10'].map((x) => h('th', null, x)))),
        h('tbody', null, CI.PREVENTIVE[cur].map((r) => h('tr', null, h('td', null, h('b', null, r[0])), h('td', null, r[1]), h('td', { class: 'code' }, r[2]), h('td', { class: 'code' }, r[3])))))));
      host.appendChild(h('div', { class: 'grid', style: 'margin-top:32px' },
        h('div', { class: 'c6' }, h('div', { class: 'card flat' }, h('div', { class: 'mono' }, 'Preventive + problem visit'), h('p', { class: 'small' }, 'Bill the age-matched preventive code with Z00.00/Z00.01 and the problem-oriented E/M with modifier 25 and the problem dx. Document the problem work separately. Expect the patient to owe cost-sharing on the E/M.'))),
        h('div', { class: 'c6' }, h('div', { class: 'card flat' }, h('div', { class: 'mono' }, 'Modifier 33 & zero cost-share'), h('p', { class: 'small' }, 'For commercial ACA preventive services whose code is not obviously preventive (e.g., 96127, 99401-99404, 81528), modifier 33 or the preventive Z-dx on the line signals no cost-share. Payers differ - confirm with each plan.')))));
    }
    const root = h('div', null, pageHead('07 · Preventive', 'Preventive care, by age.', 'Common US guideline-based services (USPSTF / Bright Futures / ACIP) with the codes that carry them. Guidelines update; confirm with the current source.'), host);
    fill();
    return root;
  }

  /* ---------- Programs ---------- */
  function programsPage() {
    const root = h('div', null, pageHead('08 · Programs', 'Care management and the revenue that hides in it.', 'Eligibility, time and documentation rules for the programs family practices most often under-bill, plus procedure documentation checklists.'));
    const grid = h('div', { class: 'grid' });
    CI.PROGRAMS.forEach((p, i) => grid.appendChild(h('div', { class: i % 5 === 0 ? 'c8' : 'c4' }, h('div', { class: 'card' + (i % 5 === 0 ? ' dark' : '') , style: 'height:100%' },
      h('div', { class: 'mono' }, p.codes), h('h3', { class: 'h3', style: 'margin:8px 0 4px' }, p.t), h('div', { class: 'small muted' }, p.who),
      h('div', { class: 'mono', style: 'margin-top:16px' }, 'Requirements'), h('ul', { class: 'plain dash' }, p.req.map((r) => h('li', null, r))),
      p.pitfalls.length ? [h('div', { class: 'mono', style: 'margin-top:16px' }, 'Traps'), h('ul', { class: 'plain dash' }, p.pitfalls.map((r) => h('li', null, r)))] : null,
      p.value && h('p', { class: 'small', style: 'margin-top:16px' }, h('span', { class: 'pill lime' }, p.value))))));
    root.appendChild(grid);
    root.appendChild(h('section', { class: 'block' }, h('div', { class: 'sec-head' }, h('div', null, h('div', { class: 'mono' }, 'Documentation coach'), h('h2', { class: 'h2', style: 'margin-top:8px' }, 'What the note must say'))),
      h('div', { class: 'card' }, CI.DOC.map((d) => h('details', { class: 'fold' }, h('summary', null, d.t), h('div', { class: 'inner' }, h('ul', { class: 'plain dash' }, d.items.map((x) => h('li', null, x)))))))));
    return root;
  }

  /* ---------- Denials ---------- */
  function denialsPage() {
    let q = '', grp = 'All';
    const groups = ['All'].concat(Array.from(new Set(CI.DENIALS.map((d) => d[1]))));
    const tbl = h('div', { class: 'card scroll-x' });
    const chips = h('div', { class: 'chips', style: 'margin-bottom:16px' });
    function fill() {
      chips.innerHTML = '';
      groups.forEach((g) => chips.appendChild(h('button', { class: 'chip', 'aria-pressed': g === grp, onclick: () => { grp = g; fill(); } }, g)));
      const rows = CI.DENIALS.filter((d) => (grp === 'All' || d[1] === grp) && (!q || d.join(' ').toLowerCase().includes(q.toLowerCase())));
      tbl.innerHTML = '';
      tbl.appendChild(h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Code', 'Meaning', 'Typical cause', 'Fix', 'Prevent'].map((x) => h('th', null, x)))),
        h('tbody', null, rows.map((d) => h('tr', null, h('td', null, h('span', { class: 'code' }, hl(d[0], q)), h('div', null, h('span', { class: 'pill' }, d[1]))), h('td', null, h('b', null, hl(d[2], q))), h('td', null, d[3]), h('td', null, d[4]), h('td', null, d[5]))))));
      if (!rows.length) tbl.appendChild(h('p', { class: 'small muted' }, 'No matches.'));
    }
    // appeal generator
    const ap = store.get('appeal', { carc: 'CO-50', payer: '', patient: '', claim: '', dos: '', amount: '', dx: '', cpt: '', provider: '', practice: '', npi: '', phone: '', attach: 'visit note, lab results, payer policy excerpt' });
    const letter = h('textarea', { class: 'in', rows: 18, readonly: true, style: 'font-family:var(--f-mono);font-size:13px' });
    function gen() {
      store.set('appeal', ap);
      const d = CI.DENIALS.find((x) => x[0] === ap.carc);
      const rsn = (CI.APPEAL.reasons[ap.carc] || '[Explain why the denial is incorrect, cite the policy and attach the note.]');
      const v = { claim: ap.claim || '[claim #]', patient: ap.patient || '[patient ID]', dos: ap.dos || '[DOS]', payer: ap.payer || '[payer]', carc: ap.carc, carc_desc: d ? d[2] : '', amount: ap.amount || '[$]', reason: rsn, attachments: ap.attach, provider: ap.provider || '[provider]', practice: ap.practice || '[practice]', npi: ap.npi || '[NPI]', phone: ap.phone || '[phone]', dx: ap.dx || '[dx]', cpt: ap.cpt || '[CPT]', policy: '[policy name/number]', other: '[other code]', mod: '[modifier]', submitted: '[date]', missing: '[field]', taxonomy: '[taxonomy]', effective: '[date]', auth: '[auth #]', authdate: '[date]' };
      letter.value = CI.APPEAL.generic.replace(/\{\{(\w+)\}\}/g, (m, k) => (k === 'reason' ? v.reason.replace(/\{\{(\w+)\}\}/g, (mm, kk) => v[kk] || mm) : v[k] != null ? v[k] : m));
    }
    const f = (label, key, props) => field(label, inp(ap[key], (v) => { ap[key] = v; gen(); }, props));
    const root = h('div', null,
      pageHead('09 · Recover', 'Denials, decoded.', 'CARC/RARC meanings with the fix and the prevention. Filter, search, and generate an appeal letter from the denial code.'),
      h('div', { class: 'row between', style: 'margin-bottom:16px' }, chips, h('div', { style: 'width:280px' }, inp('', (v) => { q = v; fill(); }, { type: 'search', placeholder: 'Search code or keyword…' }))), tbl,
      h('section', { class: 'block grid' },
        h('div', { class: 'c5' }, h('div', { class: 'mono' }, 'Appeal letter'), h('h2', { class: 'h2', style: 'margin:8px 0 24px' }, 'Draft the appeal'),
          h('div', { class: 'card stack' }, field('Denial code', sel(CI.DENIALS.filter((d) => /^(CO|PR|OA)-/.test(d[0])).map((d) => [d[0], d[0] + ' · ' + d[2].slice(0, 40)]), ap.carc, (v) => { ap.carc = v; gen(); })),
            h('div', { class: 'fields' }, f('Payer', 'payer'), f('Claim #', 'claim'), f('DOS', 'dos', { placeholder: 'MM/DD/YYYY' }), f('Amount', 'amount')),
            h('div', { class: 'fields' }, f('CPT', 'cpt', { class: 'in mono-in' }), f('Diagnosis', 'dx', { class: 'in mono-in' }), f('Patient ID', 'patient')),
            h('div', { class: 'fields' }, f('Provider', 'provider'), f('NPI', 'npi'), f('Practice', 'practice'), f('Phone', 'phone')),
            f('Attachments', 'attach'))),
        h('div', { class: 'c7' }, h('div', { class: 'card sticky' }, h('div', { class: 'row between', style: 'margin-bottom:12px' }, h('div', { class: 'mono' }, 'Letter'), h('button', { class: 'btn primary sm', onclick: () => copy(letter.value) }, 'Copy')), letter, h('p', { class: 'xs muted' }, 'Edit bracketed fields. Always attach the signed note and cite the payer policy. Never include more PHI than needed.')))),
      h('section', { class: 'block' }, h('div', { class: 'sec-head' }, h('div', null, h('div', { class: 'mono' }, 'Clocks'), h('h2', { class: 'h2', style: 'margin-top:8px' }, 'Timely filing & appeal windows'), h('p', null, 'Typical values - the contract or plan document always controls.'))),
        h('div', { class: 'card scroll-x' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Payer', 'Filing limit', 'Appeal window', 'Notes'].map((x) => h('th', null, x)))), h('tbody', null, CI.TIMELY.map((r) => h('tr', null, h('td', null, h('b', null, r[0])), h('td', null, r[1]), h('td', null, r[2]), h('td', null, r[3]))))))));
    fill(); gen();
    return root;
  }

  /* ---------- Code explorer ---------- */
  function codesPage(params) {
    let tab = params && params.get('tab') || 'cpt', q = params && params.get('q') || '', cat = 'All';
    const host = h('div', null), chipsBox = h('div', { class: 'chips', style: 'margin-bottom:16px' }), table = h('div', { class: 'card scroll-x' });
    const tabs = [['cpt', 'CPT / HCPCS'], ['icd', 'ICD-10-CM'], ['tax', 'Taxonomy'], ['fam', 'Dx families']];
    const input = inp(q, (v) => { q = v; fill(); }, { type: 'search', placeholder: 'Filter by code or text…' });
    function fill() {
      host.innerHTML = '';
      host.appendChild(h('div', { class: 'chips', style: 'margin-bottom:16px' }, tabs.map((t) => h('button', { class: 'chip', 'aria-pressed': tab === t[0], onclick: () => { tab = t[0]; cat = 'All'; fill(); } }, t[1]))));
      const qq = q.trim().toLowerCase();
      table.innerHTML = '';
      if (tab === 'cpt') {
        const cats = ['All'].concat(Array.from(new Set(Object.keys(CI.CPT).map((k) => CI.CPT[k].cat))));
        host.appendChild(h('div', { class: 'chips', style: 'margin-bottom:16px' }, cats.map((c) => h('button', { class: 'chip', 'aria-pressed': cat === c, onclick: () => { cat = c; fill(); } }, c))));
        const rows = Object.keys(CI.CPT).filter((k) => { const c = CI.CPT[k]; return (cat === 'All' || c.cat === cat) && (!qq || (k + ' ' + c.desc + ' ' + c.note).toLowerCase().includes(qq)); });
        table.appendChild(h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Code', 'Description', 'Category', 'Global', 'Supporting dx families / notes'].map((x) => h('th', null, x)))),
          h('tbody', null, rows.slice(0, 250).map((k) => { const c = CI.CPT[k]; return h('tr', null, h('td', { class: 'code' }, hl(k, qq)), h('td', null, hl(c.desc, qq), c.age ? h('div', { class: 'mono inline' }, 'ages ' + c.age[0] + '–' + (c.age[1] >= 120 ? '+' : c.age[1]) + (c.sex ? ' · ' + c.sex : '')) : null), h('td', null, h('span', { class: 'pill' }, c.cat)), h('td', { class: 'code muted' }, c.global === 'X' ? '—' : c.global + 'd'),
            h('td', { class: 'small' }, c.fam.length ? h('div', { class: 'chips' }, c.fam.map((f) => h('span', { class: 'pill violet' }, CI.FAM[f] ? CI.FAM[f].label : f))) : null, c.note && h('div', { class: 'muted', style: 'margin-top:4px' }, c.note))); }))));
        if (rows.length > 250) table.appendChild(h('p', { class: 'small muted' }, 'Showing 250 of ' + rows.length + ' - refine the filter.'));
      } else if (tab === 'icd') {
        const rows = Object.keys(CI.ICD).filter((k) => { const c = CI.ICD[k]; return !qq || (c.code + ' ' + c.desc + ' ' + c.tip + ' ' + c.chapter).toLowerCase().includes(qq); });
        table.appendChild(h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Code', 'Description', 'Chapter', 'Flags', 'Documentation tip'].map((x) => h('th', null, x)))),
          h('tbody', null, rows.slice(0, 300).map((k) => { const c = CI.ICD[k]; return h('tr', null, h('td', { class: 'code' }, hl(c.code, qq)), h('td', null, hl(c.desc, qq)), h('td', null, h('span', { class: 'pill' }, c.chapter)), h('td', null, c.hcc && h('span', { class: 'pill violet' }, 'risk-adj'), ' ', c.unspecified && h('span', { class: 'pill amber' }, 'non-specific'), ' ', c.noPrimary && h('span', { class: 'pill' }, 'secondary only')), h('td', { class: 'small' }, c.tip)); }))));
      } else if (tab === 'tax') {
        const rows = Object.keys(CI.TAX).filter((k) => !qq || (k + ' ' + CI.TAX[k].name + ' ' + CI.TAX[k].note).toLowerCase().includes(qq));
        table.appendChild(h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Taxonomy', 'Name', 'Type', 'Medicare specialty', 'Typical ages', 'Scope notes'].map((x) => h('th', null, x)))),
          h('tbody', null, rows.map((k) => { const t = CI.TAX[k]; return h('tr', null, h('td', { class: 'code' }, hl(k, qq)), h('td', null, h('b', null, hl(t.name, qq))), h('td', null, h('span', { class: 'pill' }, { phys: 'MD/DO', npp: 'NP/PA', fac: 'Facility', grp: 'Group' }[t.kind])), h('td', null, t.medicare), h('td', { class: 'code' }, t.ageMin + '–' + (t.ageMax >= 120 ? '+' : t.ageMax)), h('td', { class: 'small' }, t.note)); }))));
      } else {
        const rows = Object.keys(CI.FAM).filter((k) => !qq || (k + CI.FAM[k].label).toLowerCase().includes(qq) );
        table.appendChild(h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Family', 'Label', 'ICD-10-CM prefixes counted as supporting'].map((x) => h('th', null, x)))),
          h('tbody', null, rows.map((k) => h('tr', null, h('td', { class: 'code' }, k), h('td', null, h('b', null, CI.FAM[k].label)), h('td', { class: 'code small' }, CI.FAM[k].p.join(' · ') || '(any)'))))));
      }
      host.appendChild(table);
    }
    const root = h('div', null, pageHead('10 · Explorer', 'Every code, with context.', 'Browse the built-in family-medicine code set: ' + Object.keys(CI.CPT).length + ' procedure codes, ' + Object.keys(CI.ICD).length + ' diagnoses with specificity tips, taxonomies, and the dx families used for medical-necessity matching.'),
      h('div', { style: 'max-width:420px;margin-bottom:24px' }, input), host);
    fill();
    return root;
  }

  /* ---------- Reference ---------- */
  function refPage() {
    return h('div', null, pageHead('11 · Reference', 'The desk reference.', 'Benchmarks, form fields, place-of-service codes and quality measures.'),
      h('section', null, h('div', { class: 'sec-head' }, h('h2', { class: 'h2' }, 'Family-medicine RCM benchmarks')),
        h('div', { class: 'card scroll-x' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Metric', 'Target', 'Definition'].map((x) => h('th', null, x)))), h('tbody', null, CI.KPI.map((r) => h('tr', null, h('td', null, h('b', null, r[0])), h('td', { class: 'code' }, r[1]), h('td', null, r[2]))))))),
      h('section', { class: 'block' }, h('div', { class: 'sec-head' }, h('h2', { class: 'h2' }, 'Quality measures & CPT II')),
        h('div', { class: 'card scroll-x' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, ['Measure', 'Population', 'Numerator', 'Codes', 'Tip'].map((x) => h('th', null, x)))), h('tbody', null, CI.QUALITY.map((r) => h('tr', null, h('td', null, h('b', null, r[0])), h('td', null, r[1]), h('td', null, r[2]), h('td', { class: 'code' }, r[3]), h('td', { class: 'small' }, r[4]))))))),
      h('section', { class: 'block grid' },
        h('div', { class: 'c7' }, h('div', { class: 'sec-head' }, h('h2', { class: 'h2' }, 'CMS-1500 field map')),
          h('div', { class: 'card scroll-x' }, h('table', { class: 'table' }, h('tbody', null, CI.CMS1500.map((r) => h('tr', null, h('td', { class: 'code' }, r[0]), h('td', null, h('b', null, r[1])), h('td', { class: 'small' }, r[2]))))))),
        h('div', { class: 'c5' }, h('div', { class: 'sec-head' }, h('h2', { class: 'h2' }, 'Place of service')),
          h('div', { class: 'card scroll-x' }, h('table', { class: 'table' }, h('tbody', null, CI.POS.map((r) => h('tr', null, h('td', { class: 'code' }, r[0]), h('td', null, r[1]), h('td', { class: 'small muted' }, r[2])))))))));
  }

  /* ---------- Search ---------- */
  function searchPage(params) {
    const q = (params.get('q') || '').trim(), ql = q.toLowerCase();
    const root = h('div', null, pageHead('Search', q ? 'Results for “' + q + '”' : 'Search', 'CPT/HCPCS, ICD-10, modifiers, denial codes, programs and taxonomies.'));
    if (!q) return root;
    const sec = (title, items, render) => items.length && root.appendChild(h('section', { class: 'block', style: 'margin-top:32px' }, h('div', { class: 'mono' }, title + ' · ' + items.length), h('div', { class: 'card', style: 'margin-top:12px' }, items.slice(0, 12).map(render))));
    sec('Procedure codes', Object.keys(CI.CPT).filter((k) => (k + ' ' + CI.CPT[k].desc + ' ' + CI.CPT[k].note).toLowerCase().includes(ql)), (k) => h('div', { class: 'modcard' }, h('div', { class: 'code' }, hl(k, q)), h('div', null, hl(CI.CPT[k].desc, q), h('div', { class: 'xs muted' }, CI.CPT[k].note))));
    sec('Diagnoses', Object.keys(CI.ICD).filter((k) => (CI.ICD[k].code + ' ' + CI.ICD[k].desc + ' ' + CI.ICD[k].tip).toLowerCase().includes(ql)), (k) => h('div', { class: 'modcard' }, h('div', { class: 'code' }, hl(CI.ICD[k].code, q)), h('div', null, hl(CI.ICD[k].desc, q), h('div', { class: 'xs muted' }, CI.ICD[k].tip))));
    sec('Modifiers', CI.MODS.filter((m) => (m.code + ' ' + m.name + ' ' + m.meaning).toLowerCase().includes(ql)), (m) => h('div', { class: 'modcard' }, h('div', { class: 'mc' }, m.code), h('div', null, h('b', null, hl(m.name, q)), h('div', { class: 'small' }, m.meaning))));
    sec('Denials', CI.DENIALS.filter((d) => d.join(' ').toLowerCase().includes(ql)), (d) => h('div', { class: 'modcard' }, h('div', { class: 'code' }, hl(d[0], q)), h('div', null, h('b', null, hl(d[2], q)), h('div', { class: 'small' }, d[4]))));
    sec('Programs', CI.PROGRAMS.filter((p) => (p.t + p.codes + p.req.join(' ')).toLowerCase().includes(ql)), (p) => h('div', { class: 'modcard' }, h('div', { class: 'code' }, p.codes.split(' · ')[0]), h('div', null, h('a', { href: '#/programs' }, p.t), h('div', { class: 'xs muted' }, p.codes))));
    sec('Taxonomies', Object.keys(CI.TAX).filter((k) => (k + CI.TAX[k].name).toLowerCase().includes(ql)), (k) => h('div', { class: 'modcard' }, h('div', { class: 'code' }, k), h('div', null, CI.TAX[k].name)));
    if (root.querySelectorAll('section').length === 0) root.appendChild(h('p', { class: 'muted' }, 'Nothing matched. Try a code like 99214, a dx like E11, or a word like “bundled”.'));
    return root;
  }

  /* ---------- global wiring ---------- */
  document.getElementById('gsearch').addEventListener('submit', (e) => { e.preventDefault(); const v = document.getElementById('gq').value.trim(); if (v) location.hash = '#/search?q=' + encodeURIComponent(v); });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); document.getElementById('gq').focus(); } });
  document.getElementById('theme').addEventListener('click', () => {
    const r = document.documentElement; const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.dataset.theme = dark ? 'light' : 'dark'; store.set('theme', r.dataset.theme);
  });
  const th = store.get('theme', null); if (th) document.documentElement.dataset.theme = th;
  document.getElementById('theme').innerHTML = CI.ICON.sun;
  renderWho();
  route();
})();
