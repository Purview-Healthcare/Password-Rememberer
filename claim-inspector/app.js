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

  /* ---------- routes ---------- */
  const ROUTES = [
    ['', 'Home', home], ['inspect', 'Inspect claim', inspectPage], ['batch', 'Batch review', batchPage], ['match', 'Match lab', matchPage], ['em', 'E/M leveler', emPage],
    ['modifiers', 'Modifiers', modPage], ['capture', 'Charge capture', capturePage], ['preventive', 'Preventive', prevPage],
    ['programs', 'Programs', programsPage], ['denials', 'Denials', denialsPage], ['codes', 'Code explorer', codesPage], ['reference', 'Reference', refPage]
  ];
  function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [name, qs] = hash.split('?');
    const params = new URLSearchParams(qs || '');
    const r = name === 'search' ? ['search', 'Search', searchPage] : ROUTES.find((x) => x[0] === name) || ROUTES[0];
    renderNav(r[0]);
    view.innerHTML = '';
    view.appendChild(r[2](params));
    document.title = (r[1] === 'Home' ? '' : r[1] + ' · ') + 'Claim Inspector';
    window.scrollTo(0, 0);
  }
  function renderNav(cur) {
    const nav = document.getElementById('nav');
    nav.innerHTML = '';
    ROUTES.forEach((r, i) => nav.appendChild(h('a', { href: '#/' + r[0], 'aria-current': r[0] === cur ? 'page' : null }, h('span', { class: 'n' }, String(i).padStart(2, '0')), r[1])));
  }
  window.addEventListener('hashchange', route);

  /* ---------- Home ---------- */
  function home() {
    const done = store.get('rcm', {});
    const root = h('div', null);
    root.appendChild(h('section', { class: 'hero grid' },
      h('div', { class: 'c7' },
        h('div', { class: 'mono' }, 'Family medicine · revenue cycle intelligence'),
        h('h1', { class: 'display', style: 'margin-top:16px' }, 'Every claim, ', h('span', { class: 'hl' }, 'inspected'), ' before it leaves the building.'),
        h('p', { class: 'lede', style: 'margin-top:24px' }, 'One workbench for the whole family-medicine revenue cycle: scrub the claim, pair CPT to diagnosis to taxonomy, level the visit, pick the modifier, catch missed charges, and fight the denial that still slips through.'),
        h('div', { class: 'row', style: 'margin-top:32px' },
          h('a', { class: 'btn primary lg', href: '#/inspect' }, 'Inspect a claim'),
          h('a', { class: 'btn ghost lg', href: '#/match' }, 'Run a match'))),
      h('div', { class: 'c5 hero-aside' }, h('div', { class: 'card dark' },
        h('div', { class: 'mono' }, 'Live scrubber · sample'),
        h('div', { class: 'scorebox', style: 'margin:16px 0 8px' }, h('div', { class: 'score good' }, '64'), h('div', { class: 'mono', style: 'padding-bottom:8px' }, 'clean-claim score')),
        h('ul', { class: 'mini-findings' },
          [['error', '99396 + 99214 on one date need modifier 25 on the problem E/M.'], ['error', 'Medicare flu shot: administration is G0008, not 90471.'], ['warn', 'E78.5 is non-specific. Document the lipid type.'], ['info', 'QW modifier for in-office A1c (83036).']].map((f) => h('li', null, h('span', { class: 'dot ' + f[0] }), h('span', null, f[1]))))))));
    root.appendChild(h('div', { class: 'statstrip' }, CI.KPI.slice(0, 5).map((k) => h('div', { class: 'stat' }, h('b', null, k[1]), h('div', { class: 'mono' }, k[0])))));

    // Tools
    root.appendChild(h('section', { class: 'block' },
      h('div', { class: 'sec-head' }, h('div', null, h('div', { class: 'mono' }, 'The workbench'), h('h2', { class: 'h2', style: 'margin-top:8px' }, 'Ten instruments, one purpose.'))),
      h('div', { class: 'tools' },
        tool('wide', '01 · Inspect', 'Claim scrubber', 'Build a CMS-1500-style claim. 90+ rules check modifiers, bundling, age and sex edits, POS, vaccines, Medicare quirks, dx pointers, medical necessity and provider taxonomy. One-click fixes.', '#/inspect'),
        tool('', '02 · Batch', 'Batch review', 'Paste 15-20 claims, get a ranked worklist, bulk-apply safe fixes, export results.', '#/batch'),
        tool('', '03 · Match', 'CPT ↔ Dx ↔ Taxonomy', 'Does the service fit the diagnosis, the patient and the provider’s taxonomy?', '#/match'),
        tool('', '04 · Level', 'E/M leveler', '2021+ MDM table, time thresholds, new vs. established, prolonged services, G2211.', '#/em'),
        tool('', '05 · Modify', 'Modifier advisor', 'Answer 2-3 questions and get 25 / 59 / XS / 33 / QW / 95 with the why.', '#/modifiers'),
        tool('', '06 · Capture', 'Missed-charge finder', 'Tick what happened in the room. See every billable code you might be leaving behind.', '#/capture'),
        tool('', '07 · Prevent', 'Preventive schedules', 'Pediatric through 65+: what to do, the code and the dx.', '#/preventive'),
        tool('wide', '08 · Programs', 'CCM, TCM, RPM, AWV, APCM, ACP, BHI', 'Eligibility, time rules, documentation checklists and the traps that cause clawbacks.', '#/programs'),
        tool('', '09 · Recover', 'Denials & appeals', '50+ CARC/RARC with the fix. Generates an appeal letter.', '#/denials'))));

    // Cycle
    root.appendChild(h('section', { class: 'block' },
      h('div', { class: 'sec-head' },
        h('div', null, h('div', { class: 'mono' }, 'End to end'), h('h2', { class: 'h2', style: 'margin-top:8px' }, 'The twelve-step revenue cycle'), h('p', null, 'From the moment a patient books to the moment the balance is zero. Tick tasks to track your own process; progress stays in this browser.')),
        h('button', { class: 'btn ghost sm', onclick: () => { store.set('rcm', {}); route(); } }, 'Reset checklist')),
      h('div', { class: 'cycle' }, CI.RCM.map((s) => cycleStep(s, done)))));
    return root;
  }
  function tool(cls, kicker, title, text, href) { return h('a', { class: 'tool ' + cls, href }, h('span', { class: 'mono' }, kicker), h('h3', { class: 'h3' }, title), h('p', null, text)); }
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
    return { age: c.age, sex: c.sex, payer: c.payer, status: c.status, pos: c.pos, taxonomy: c.taxonomy, dos: today(), dx: c.dx.slice(), lines: c.lines.map((l) => ({ cpt: l[0], mods: l[1], ptr: l[2], units: l[3] || 1, charge: '' })) };
  }
  function blankClaim() { return { age: '', sex: '', payer: 'commercial', status: 'est', pos: '11', taxonomy: '207Q00000X', dos: today(), dx: ['', ''], lines: [{ cpt: '', mods: '', ptr: 'A', units: 1, charge: '' }] }; }
  const toEngine = (c) => Object.assign({}, c, { lines: c.lines.map((l) => ({ cpt: l.cpt, mods: String(l.mods || '').split(/[\s,]+/).filter(Boolean), ptr: l.ptr, units: l.units, charge: l.charge })) });
  const fromEngine = (c) => Object.assign({}, c, { lines: c.lines.map((l) => ({ cpt: l.cpt, mods: (l.mods || []).join(' '), ptr: l.ptr, units: l.units, charge: l.charge })) });

  function inspectPage() {
    let claim = store.get('claim', null) || sampleClaim(SAMPLES[0]);
    const results = h('div', { class: 'card dark' });
    const formHost = h('div', { class: 'stack-lg' });
    let last = null;
    function save() { store.set('claim', claim); }
    function run() {
      save();
      last = E.inspect(toEngine(claim));
      renderResults();
    }
    function renderResults() {
      const r = last;
      results.innerHTML = '';
      const good = r.errs === 0;
      results.appendChild(h('div', { class: 'mono' }, 'Inspection result'));
      results.appendChild(h('div', { class: 'scorebox', style: 'margin:16px 0 16px' },
        h('div', { class: 'score ' + (good ? 'good' : 'bad') }, String(r.score)),
        h('div', { style: 'padding-bottom:8px' }, h('div', { class: 'mono' }, 'clean-claim score'),
          h('div', { class: 'row', style: 'margin-top:8px;gap:8px' }, h('span', { class: 'pill red' }, r.errs + ' errors'), h('span', { class: 'pill amber' }, r.warns + ' warnings'), h('span', { class: 'pill violet' }, r.infos + ' notes')))));
      results.appendChild(h('div', { class: 'row', style: 'margin-bottom:8px' },
        h('button', { class: 'btn lime sm', onclick: () => copy(report()) }, 'Copy report'),
        h('button', { class: 'btn ghost sm', style: 'color:#fff;border-color:#2B3445', onclick: () => window.print() }, 'Print')));
      if (!r.issues.length) results.appendChild(h('p', { class: 'small', style: 'color:#C7F36B' }, 'No issues found. Ready to submit.'));
      const order = { error: 0, warn: 1, info: 2 };
      r.issues.slice().sort((a, b) => order[a.sev] - order[b.sev]).forEach((it) => {
        const where = it.line != null ? 'line ' + (it.line + 1) : it.dx != null ? 'dx ' + 'ABCDEFGHIJKL'[it.dx] : 'claim';
        results.appendChild(h('div', { class: 'issue', style: 'border-color:#1F2937' }, h('span', { class: 'dot ' + it.sev }),
          h('div', null, h('p', { style: 'color:#E8EBF2' }, it.msg),
            h('div', { class: 'meta' }, h('span', { class: 'mono' }, SEV[it.sev] + ' · ' + it.rule + ' · ' + where),
              it.fix && it.fix.type !== 'note' && it.fix.type !== 'suggestDx' && h('button', { class: 'btn sm lime', onclick: () => { claim = fromEngine(E.applyFix(toEngine(claim), it)); renderForm(); run(); toast('Fix applied'); } }, 'Apply fix'),
              it.fix && it.fix.type === 'suggestDx' && h('a', { class: 'btn sm ghost', style: 'color:#fff;border-color:#2B3445', href: '#/match' }, 'See supporting dx')))));
      });
    }
    function report() {
      const c = claim;
      const head = 'CLAIM INSPECTOR REPORT - ' + c.dos + ' · ' + c.payer + ' · age ' + c.age + ' ' + c.sex + ' · POS ' + c.pos + ' · taxonomy ' + c.taxonomy + '\nDX: ' + c.dx.filter(Boolean).map((d, i) => 'ABCDEFGHIJKL'[i] + '=' + fmtDx(d)).join('  ') + '\nLINES: ' + c.lines.filter((l) => l.cpt).map((l) => l.cpt + (l.mods ? '-' + l.mods.trim().replace(/[\s,]+/g, '-') : '') + ' [' + l.ptr + '] x' + l.units).join(' | ');
      return head + '\nScore ' + last.score + ' · ' + last.errs + ' errors · ' + last.warns + ' warnings\n\n' + last.issues.map((i) => '[' + i.sev.toUpperCase() + '] ' + i.rule + ' ' + i.msg).join('\n');
    }
    function renderForm() {
      formHost.innerHTML = '';
      const upd = (k) => (v) => { claim[k] = v; run(); };
      formHost.appendChild(h('div', { class: 'card' },
        h('div', { class: 'row between', style: 'margin-bottom:16px;flex-wrap:nowrap' }, h('h3', { class: 'h3' }, 'Visit'),
          h('div', { class: 'row', style: 'flex-wrap:nowrap;min-width:0' }, sel([['', 'Load a sample…']].concat(SAMPLES.map((s, i) => [String(i), s.name])), '', (v) => { if (v === '') return; claim = sampleClaim(SAMPLES[+v]); renderForm(); run(); }), h('button', { class: 'btn ghost sm', onclick: () => { claim = blankClaim(); renderForm(); run(); } }, 'Clear'))),
        h('div', { class: 'fields' },
          field('Patient age', inp(claim.age, upd('age'), { type: 'number', min: 0, max: 120, placeholder: 'yrs' })),
          field('Sex', sel([['', '—'], ['F', 'Female'], ['M', 'Male']], claim.sex, upd('sex'))),
          field('Payer', sel([['commercial', 'Commercial'], ['medicare', 'Medicare'], ['medicaid', 'Medicaid'], ['tricare', 'TRICARE'], ['selfpay', 'Self-pay']], claim.payer, upd('payer'))),
          field('Patient status', sel([['est', 'Established'], ['new', 'New (3+ yrs)'], ['', 'Unknown']], claim.status, upd('status'))),
          field('Date of service', inp(claim.dos, upd('dos'), { type: 'date' })),
          field('Place of service', sel(CI.POS.map((p) => [p[0], p[0] + ' · ' + p[1]]), claim.pos, upd('pos')))),
        h('div', { style: 'margin-top:12px' }, field('Rendering provider taxonomy', sel([['', 'Not specified']].concat(Object.keys(CI.TAX).map((k) => [k, k + ' · ' + CI.TAX[k].name])), claim.taxonomy, upd('taxonomy'))))));

      // diagnoses
      const dxBox = h('div', { class: 'card' }, h('div', { class: 'row between', style: 'margin-bottom:16px' }, h('h3', { class: 'h3' }, 'Diagnoses ', h('span', { class: 'mono inline' }, '(box 21 · A-L)')),
        h('button', { class: 'btn ghost sm', onclick: () => { if (claim.dx.length < 12) { claim.dx.push(''); renderForm(); } } }, '+ Add dx')));
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
    const root = h('div', null, dl1, dl2,
      pageHead('01 · Scrubber', 'Inspect a claim before the payer does.', 'Enter the encounter the way it will go on the CMS-1500. Results update as you type; apply suggested fixes with one click.'),
      h('div', { class: 'grid' }, h('div', { class: 'c7' }, formHost), h('div', { class: 'c5' }, h('div', { class: 'sticky' }, results))));
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
      results = E.parseBatch(ta.value).map((p) => p.error ? p : Object.assign(p, { res: E.inspect(p.claim) }));
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
      summary.appendChild(h('div', { class: 'card dark' },
        h('div', { class: 'row between', style: 'align-items:flex-end' },
          h('div', { class: 'row', style: 'gap:40px;align-items:flex-end' },
            h('div', null, h('div', { class: 'score good' }, String(ok.length)), h('div', { class: 'mono' }, 'claims reviewed')),
            h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:var(--red)' }, String(bad.length)), h('div', { class: 'mono' }, 'blocked by errors')),
            h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:#E5A93C' }, String(warn.length)), h('div', { class: 'mono' }, 'need a look')),
            h('div', null, h('div', { class: 'score', style: 'font-size:48px;color:var(--lime)' }, String(clean.length)), h('div', { class: 'mono' }, 'ready to submit'))),
          h('div', { class: 'row' },
            h('button', { class: 'btn lime', disabled: fixable === 0, onclick: fixAll }, 'Apply ' + fixable + ' safe fixes'),
            h('button', { class: 'btn ghost', style: 'color:#fff;border-color:#2B3445', onclick: () => copy(csv()) }, 'Copy results CSV'),
            h('button', { class: 'btn ghost', style: 'color:#fff;border-color:#2B3445', onclick: () => window.print() }, 'Print')))));
      list.innerHTML = '';
      list.appendChild(h('div', { class: 'chips', style: 'margin:32px 0 16px' }, [['All', results.length], ['Errors', bad.length], ['Warnings', warn.length], ['Ready', clean.length]].map((f) => h('button', { class: 'chip', 'aria-pressed': filter === f[0], onclick: () => { filter = f[0]; render(); } }, f[0] + ' · ' + f[1]))));
      const rank = (p) => !p.res ? -1 : p.res.errs * 100 + p.res.warns * 10 + p.res.infos;
      const shown = results.filter((p) => filter === 'All' || (!p.res && filter === 'Errors') || (p.res && ((filter === 'Errors' && p.res.errs) || (filter === 'Warnings' && !p.res.errs && p.res.warns) || (filter === 'Ready' && !p.res.errs && !p.res.warns)))).sort((a, b) => rank(b) - rank(a));
      const card = h('div', { class: 'card', style: 'padding:0;overflow:hidden' });
      shown.forEach((p) => {
        if (!p.res) { card.appendChild(h('div', { class: 'issue', style: 'padding:16px 24px' }, h('span', { class: 'dot error' }), h('div', null, h('b', null, p.label), h('p', { class: 'small' }, p.error)))); return; }
        const r = p.res, top = r.issues.find((i) => i.sev === 'error') || r.issues.find((i) => i.sev === 'warn') || r.issues[0];
        const open = !!openIx[p.label];
        const row = h('div', { style: 'border-top:1px solid var(--border)' });
        row.appendChild(h('button', { style: 'all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:88px 64px 1fr auto;gap:16px;align-items:center;width:100%;padding:16px 24px', 'aria-expanded': String(open), onclick: () => { openIx[p.label] = !open; render(); } },
          h('span', { class: 'code' }, p.label),
          h('span', { class: 'h3', style: 'color:' + (r.errs ? 'var(--red)' : r.warns ? 'var(--amber)' : 'var(--violet)') }, String(r.score)),
          h('span', { class: 'small' }, p.claim.lines.map((l) => l.cpt + (l.mods ? '-' + l.mods.replace(/\s+/g, '-') : '')).join('  '), h('div', { class: 'muted xs' }, top ? top.msg.slice(0, 120) + (top.msg.length > 120 ? '…' : '') : 'No issues')),
          h('span', { class: 'row', style: 'gap:6px' }, r.errs ? h('span', { class: 'pill red' }, r.errs + ' err') : null, r.warns ? h('span', { class: 'pill amber' }, r.warns + ' warn') : null, !r.errs && !r.warns ? h('span', { class: 'pill lime' }, 'ready') : null)));
        if (open) {
          const body = h('div', { style: 'padding:0 24px 24px 24px;background:var(--soft)' });
          const order = { error: 0, warn: 1, info: 2 };
          r.issues.slice().sort((a, b) => order[a.sev] - order[b.sev]).forEach((it) => body.appendChild(h('div', { class: 'issue' }, h('span', { class: 'dot ' + it.sev }), h('div', null, h('p', null, it.msg), h('div', { class: 'meta' }, h('span', { class: 'mono' }, it.rule + (it.line != null ? ' · line ' + (it.line + 1) : '')),
            it.fix && SAFE.includes(it.fix.type) && h('button', { class: 'btn sm primary', onclick: () => { p.claim = E.applyFix(p.claim, it); ta.value = results.map((x) => x.claim ? serialize(x) : x.raw).join('\n'); analyze(); } }, 'Apply fix'))))));
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
      pageHead('02 · Batch', 'Fifteen claims. One pass.', 'Paste the day’s claims, one per line. You get a ranked worklist - blocked claims first - with a one-click bulk fix for the safe corrections (modifier 25, QW, units, new/established code, Medicare vaccine admin codes) and an export for your biller.'),
      h('div', { class: 'grid' },
        h('div', { class: 'c8' }, h('div', { class: 'card' },
          h('div', { class: 'row between', style: 'margin-bottom:12px' }, h('h3', { class: 'h3' }, 'Claims'), h('div', { class: 'row' },
            h('button', { class: 'btn ghost sm', onclick: () => { ta.value = BATCH_SAMPLE; analyze(); } }, 'Load sample day'), h('button', { class: 'btn ghost sm', onclick: () => file.click() }, 'Upload .txt/.csv'), h('button', { class: 'btn ghost sm', onclick: () => { ta.value = ''; analyze(); } }, 'Clear'), file)),
          ta)),
        h('div', { class: 'c4' }, h('div', { class: 'card flat' }, h('div', { class: 'mono' }, 'Line format'),
          h('p', { class: 'code', style: 'font-size:12px;margin:8px 0;word-break:break-word' }, 'label | 52 M | commercial | est | 11 | Z00.01 I10 Z23 | 99396 A, 99214-25 B, 90471 C x1'),
          h('ul', { class: 'plain dash' }, ['Fields: label, age + sex, payer (commercial / medicare / medicaid), new or est, POS, diagnoses, services', 'Service: CPT, optional -modifiers, dx pointers (letters = order of the diagnoses), xUnits', 'Short forms work: label | dx | services', 'Use account numbers or initials - never patient names'].map((x) => h('li', null, x)))))),
      h('div', { style: 'margin-top:32px' }, summary, list));
    analyze();
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
  route();
})();
