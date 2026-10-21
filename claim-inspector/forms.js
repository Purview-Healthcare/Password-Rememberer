/* Claim form generation: CMS-1500 (printable HTML), ANSI X12 837P 5010 (upload), CSV. Pure functions. */
(function (root) {
  'use strict';
  const CI = (root.CI = root.CI || {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const d8 = (iso) => String(iso || '').replace(/-/g, '').slice(0, 8);
  const dMDY = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[2] + ' ' + m[3] + ' ' + m[1] : ''; };
  const dxOf = (c) => (c.dx || []).map((x) => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(Boolean);
  const modsOf = (l) => (Array.isArray(l.mods) ? l.mods : String(l.mods || '').split(/[\s,-]+/)).map((m) => m.toUpperCase()).filter(Boolean);
  const ptrNums = (l) => String(l.ptr || 'A').toUpperCase().replace(/[^A-L]/g, '').split('').map((ch) => 'ABCDEFGHIJKL'.indexOf(ch) + 1);
  const lineCharge = (l) => +l.charge || ((CI.FEE && CI.FEE[String(l.cpt).toUpperCase()]) || 0) * (+l.units || 1);
  const total = (c) => (c.lines || []).filter((l) => l.cpt).reduce((s, l) => s + lineCharge(l), 0);
  const money = (n) => (Math.round(n * 100) / 100).toFixed(2);
  const PAYER_CODE = { medicare: 'MB', medicaid: 'MC', commercial: 'CI', tricare: 'CH', selfpay: 'CI' };
  const REL = { self: '18', spouse: '01', child: '19', other: 'G8' };
  const x12name = (s) => String(s || '').toUpperCase().replace(/[*~:^]/g, ' ').trim();
  const splitName = (full) => { const s = String(full || '').trim(); if (s.includes(',')) { const [l, f] = s.split(','); return { last: l.trim(), first: f.trim().split(' ')[0], mi: (f.trim().split(' ')[1] || '').slice(0, 1) }; } const p = s.replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '').split(/\s+/); return { first: p[0] || '', mi: p.length > 2 ? p[1].slice(0, 1) : '', last: p[p.length - 1] || '' }; };

  /* ---------- CMS-1500 printable ---------- */
  function cms1500(c, pt, prov, prac) {
    pt = pt || {}; prov = prov || {}; prac = prac || {};
    const dx = dxOf(c);
    const pn = splitName(prov.name);
    const box = (n, label, val, cls) => '<div class="bx ' + (cls || '') + '"><div class="bl">' + n + '. ' + esc(label) + '</div><div class="bv">' + (val || '&nbsp;') + '</div></div>';
    const chk = (opts, v) => opts.map((o) => '<span class="ck">' + (o[0] === v ? '&#9746;' : '&#9744;') + ' ' + esc(o[1]) + '</span>').join(' ');
    const ins = pt.relationship && pt.relationship !== 'self';
    const lines = (c.lines || []).filter((l) => l.cpt);
    const rows = []; for (let i = 0; i < 6; i++) { const l = lines[i]; rows.push(l ? '<tr><td>' + dMDY(c.dos) + '</td><td>' + dMDY(c.dos) + '</td><td>' + esc(c.pos || '11') + '</td><td></td><td class="mono">' + esc(String(l.cpt).toUpperCase()) + '</td><td class="mono">' + esc(modsOf(l).join(' ')) + '</td><td class="mono">' + esc(ptrNums(l).map((n) => 'ABCDEFGHIJKL'[n - 1]).join('')) + '</td><td class="r">' + money(lineCharge(l)) + '</td><td>' + esc(l.units || 1) + '</td><td></td><td>NPI</td><td class="mono">' + esc(prov.npi || '') + '</td></tr>' : '<tr><td colspan="12">&nbsp;</td></tr>'); }
    const dxGrid = []; for (let i = 0; i < 12; i++) dxGrid.push('<span class="dxc"><b>' + 'ABCDEFGHIJKL'[i] + '.</b> <span class="mono">' + (dx[i] ? esc(dx[i].slice(0, 3) + (dx[i].length > 3 ? '.' + dx[i].slice(3) : '')) : '') + '</span></span>');
    return '<div class="cms"><div class="cms-head"><div><b>HEALTH INSURANCE CLAIM FORM</b><br><span class="small">APPROVED BY NATIONAL UNIFORM CLAIM COMMITTEE (NUCC) 02/12 - facsimile for review; paper submissions must use the official red-ink CMS-1500</span></div><div class="carrier">' + esc(pt.payerName || '') + '<br>' + esc(pt.payerAddr || '') + '</div></div>' +
      '<div class="g2">' + box('1', 'Program', chk([['medicare', 'Medicare'], ['medicaid', 'Medicaid'], ['tricare', 'TRICARE'], ['champva', 'CHAMPVA'], ['group', 'Group Health Plan'], ['feca', 'FECA'], ['other', 'Other']], c.payer === 'commercial' ? 'group' : c.payer)) + box('1a', "Insured's ID number", esc(pt.memberId)) + '</div>' +
      '<div class="g3">' + box('2', "Patient's name (Last, First, MI)", esc(pt.name)) + box('3', "Patient's birth date / sex", esc(dMDY(pt.dob)) + ' &nbsp; ' + chk([['M', 'M'], ['F', 'F']], c.sex)) + box('4', "Insured's name", esc(ins ? pt.insuredName : pt.name)) + '</div>' +
      '<div class="g3">' + box('5', "Patient's address / phone", esc(pt.address) + '<br>' + esc(pt.phone)) + box('6', 'Patient relationship to insured', chk([['self', 'Self'], ['spouse', 'Spouse'], ['child', 'Child'], ['other', 'Other']], pt.relationship || 'self')) + box('7', "Insured's address", esc(ins ? pt.insuredAddress : pt.address)) + '</div>' +
      '<div class="g3">' + box('9', 'Other insured\'s name / 9a policy / 9d plan', esc(pt.secondary)) + box('10', 'Condition related to', 'a. Employment ' + chk([['y', 'Yes'], ['n', 'No']], pt.employment || 'n') + '<br>b. Auto accident ' + chk([['y', 'Yes'], ['n', 'No']], pt.auto || 'n') + '<br>c. Other accident ' + chk([['y', 'Yes'], ['n', 'No']], pt.accident || 'n')) + box('11', "Insured's policy / group number · 11c plan name", esc(pt.groupNo) + '<br>' + esc(pt.payerName) + '<br>11d. Another plan? ' + chk([['y', 'Yes'], ['n', 'No']], pt.secondary ? 'y' : 'n')) + '</div>' +
      '<div class="g3">' + box('12', "Patient's signature", 'SIGNATURE ON FILE &nbsp; Date ' + esc(dMDY(c.dos))) + box('13', "Insured's signature (assignment)", 'SIGNATURE ON FILE') + box('14', 'Date of current illness / injury (qual 431)', esc(dMDY(pt.onset))) + '</div>' +
      '<div class="g3">' + box('17', 'Referring provider / 17b NPI', esc(pt.referring) + (pt.referringNpi ? '<br>NPI ' + esc(pt.referringNpi) : '')) + box('19', 'Additional claim information', esc(pt.note)) + box('21', 'Diagnosis (ICD ind. 0)', '<div class="dxg">' + dxGrid.join('') + '</div>') + '</div>' +
      '<div class="g3">' + box('22', 'Resubmission code / original ref', esc(pt.resub) + (pt.origRef ? ' / ' + esc(pt.origRef) : '')) + box('23', 'Prior authorization / CLIA', esc(pt.auth) + (prov.clia ? '<br>CLIA ' + esc(prov.clia) : '')) + box('20', 'Outside lab?', chk([['n', 'No'], ['y', 'Yes']], 'n')) + '</div>' +
      '<table class="svctbl"><thead><tr><th colspan="2">24A. Dates of service (from / to)</th><th>B. POS</th><th>C. EMG</th><th colspan="2">D. CPT/HCPCS · modifier</th><th>E. Dx ptr</th><th>F. $ Charges</th><th>G. Units</th><th>H. EPSDT</th><th>I.</th><th>J. Rendering NPI</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' +
      '<div class="g4">' + box('25', 'Federal tax ID (EIN)', esc(prac.taxId)) + box('26', "Patient's account no.", esc(pt.account)) + box('27', 'Accept assignment', chk([['y', 'Yes'], ['n', 'No']], 'y')) + box('28', 'Total charge', '$ ' + money(total(c))) + '</div>' +
      '<div class="g4">' + box('29', 'Amount paid', '$ ' + money(+pt.paid || 0)) + box('31', 'Signature of physician', esc(prov.name) + (prov.credential ? ', ' + esc(prov.credential) : '') + '<br>Date ' + esc(dMDY(c.dos))) + box('32', 'Service facility · 32a NPI', esc(prac.name) + '<br>' + esc(prac.address) + (prac.groupNpi ? '<br>NPI ' + esc(prac.groupNpi) : '')) + box('33', 'Billing provider · 33a NPI · 33b taxonomy', esc(prac.name) + '<br>' + esc(prac.address) + '<br>' + esc(prac.phone) + (prac.groupNpi ? '<br>NPI ' + esc(prac.groupNpi) : '') + ' &nbsp; ZZ ' + esc(prov.taxonomy || '')) + '</div></div>';
  }
  CI.CMS_CSS = '.cms{font:11px/1.3 Arial,Helvetica,sans-serif;color:#111;background:#fff;border:1px solid #c33;padding:8px;max-width:8.5in;margin:0 auto}.cms .mono{font-family:"IBM Plex Mono",Menlo,monospace}.cms-head{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #c33;padding-bottom:6px;margin-bottom:6px}.cms-head .small{font-size:8px;color:#666}.cms .carrier{text-align:right;min-width:200px}.cms .g2,.cms .g3,.cms .g4{display:grid;gap:0}.cms .g2{grid-template-columns:2fr 1fr}.cms .g3{grid-template-columns:1fr 1fr 1fr}.cms .g4{grid-template-columns:1fr 1fr 1fr 1fr}.cms .bx{border:1px solid #c33;border-top:0;padding:3px 5px;min-height:34px}.cms .g2 .bx,.cms .g3 .bx:first-child,.cms .g4 .bx:first-child{border-left:1px solid #c33}.cms .bx+.bx{border-left:0}.cms .bl{font-size:7.5px;color:#a33;text-transform:uppercase;letter-spacing:.02em}.cms .bv{font-size:11px;min-height:14px}.cms .ck{white-space:nowrap;margin-right:6px}.cms .dxg{display:grid;grid-template-columns:repeat(4,1fr);gap:1px 8px}.cms table.svctbl{width:100%;border-collapse:collapse;margin-top:0}.cms table.svctbl th{font-size:7.5px;color:#a33;border:1px solid #c33;padding:2px;text-transform:uppercase;font-weight:normal}.cms table.svctbl td{border:1px solid #c33;padding:4px 3px;height:18px}.cms table.svctbl td.r{text-align:right}@media print{body *{visibility:hidden}.cms,.cms *{visibility:visible}.cms{position:absolute;left:0;top:0;width:100%;border-color:#c33}@page{size:letter;margin:.4in}}';

  /* ---------- 837P 5010 ---------- */
  function x837(claims, prac, opts) {
    /* claims: [{claim, patient, provider}] */
    opts = opts || {};
    const now = new Date(), pad = (n, w) => String(n).padStart(w, '0');
    const date8 = pad(now.getFullYear(), 4) + pad(now.getMonth() + 1, 2) + pad(now.getDate(), 2), date6 = date8.slice(2), time4 = pad(now.getHours(), 2) + pad(now.getMinutes(), 2);
    const ctrl = String(opts.control || Math.floor(Math.random() * 1e9)).padStart(9, '0');
    const sub = x12name(prac.submitterId || prac.taxId || 'SUBMITTER'), rec = x12name(prac.receiverId || 'RECEIVER');
    const seg = [];
    const S = (...f) => { seg.push(f.map((x) => x == null ? '' : String(x)).join('*').replace(/\*+$/, '') + '~'); };
    S('ISA', '00', ' '.repeat(10), '00', ' '.repeat(10), 'ZZ', sub.padEnd(15).slice(0, 15), 'ZZ', rec.padEnd(15).slice(0, 15), date6, time4, '^', '00501', ctrl, '0', opts.test ? 'T' : 'P', ':');
    S('GS', 'HC', sub, rec, date8, time4, '1', 'X', '005010X222A1');
    S('ST', '837', '0001', '005010X222A1');
    S('BHT', '0019', '00', ctrl.slice(-6), date8, time4, 'CH');
    S('NM1', '41', '2', x12name(prac.name || 'PRACTICE'), '', '', '', '', '46', sub);
    S('PER', 'IC', x12name(prac.contact || prac.name || 'BILLING'), 'TE', String(prac.phone || '').replace(/\D/g, ''));
    S('NM1', '40', '2', x12name(prac.receiverName || 'CLEARINGHOUSE'), '', '', '', '', '46', rec);
    let hl = 1;
    S('HL', hl, '', '20', '1');
    S('NM1', '85', '2', x12name(prac.name), '', '', '', '', 'XX', prac.groupNpi || '');
    S('N3', x12name(prac.address1 || prac.address || ''));
    S('N4', x12name(prac.city || ''), x12name(prac.state || ''), String(prac.zip || '').replace(/\D/g, ''));
    S('REF', 'EI', String(prac.taxId || '').replace(/\D/g, ''));
    const billHl = hl;
    claims.forEach((item, ix) => {
      const c = item.claim, pt = item.patient || {}, pv = item.provider || {};
      const ins = pt.relationship && pt.relationship !== 'self';
      const sn = splitName(ins ? pt.insuredName : pt.name), pn = splitName(pt.name), rn = splitName(pv.name);
      hl++; const subHl = hl;
      S('HL', subHl, billHl, '22', ins ? '1' : '0');
      S('SBR', 'P', ins ? REL[pt.relationship] || 'G8' : '18', pt.groupNo || '', '', '', '', '', '', PAYER_CODE[c.payer] || 'CI');
      S('NM1', 'IL', '1', x12name(sn.last), x12name(sn.first), x12name(sn.mi), '', '', 'MI', String(pt.memberId || '').replace(/\s/g, ''));
      S('N3', x12name(ins ? pt.insuredAddress : pt.address));
      S('N4', x12name(pt.city || ''), x12name(pt.state || ''), String(pt.zip || '').replace(/\D/g, ''));
      if (!ins) S('DMG', 'D8', d8(pt.dob), c.sex || 'U');
      S('NM1', 'PR', '2', x12name(pt.payerName || c.payer), '', '', '', '', 'PI', pt.payerId || (prac.payerIds || {})[c.payer] || '');
      if (ins) { hl++; S('HL', hl, subHl, '23', '0'); S('PAT', REL[pt.relationship] || 'G8'); S('NM1', 'QC', '1', x12name(pn.last), x12name(pn.first), x12name(pn.mi)); S('N3', x12name(pt.address)); S('N4', x12name(pt.city || ''), x12name(pt.state || ''), String(pt.zip || '').replace(/\D/g, '')); S('DMG', 'D8', d8(pt.dob), c.sex || 'U'); }
      S('CLM', pt.account || ('CLM' + (ix + 1)), money(total(c)), '', '', (c.pos || '11') + ':B:' + (pt.resub || '1'), 'Y', 'A', 'Y', 'Y');
      if (pt.onset) S('DTP', '431', 'D8', d8(pt.onset));
      if (pt.origRef) S('REF', 'F8', pt.origRef);
      if (pt.auth) S('REF', 'G1', pt.auth);
      if (pv.clia && (c.lines || []).some((l) => (CI.G && CI.G.qwCodes || []).includes(String(l.cpt).toUpperCase()))) S('REF', 'X4', pv.clia);
      const dx = dxOf(c).slice(0, 12);
      if (dx.length) S('HI', ...dx.map((d, i) => (i ? 'ABF:' : 'ABK:') + d));
      if (pt.referringNpi) S('NM1', 'DN', '1', x12name(splitName(pt.referring).last), x12name(splitName(pt.referring).first), '', '', '', 'XX', pt.referringNpi);
      S('NM1', '82', '1', x12name(rn.last), x12name(rn.first), x12name(rn.mi), '', '', 'XX', pv.npi || '');
      if (pv.taxonomy) S('PRV', 'PE', 'PXC', pv.taxonomy);
      (c.lines || []).filter((l) => l.cpt).forEach((l, i) => {
        S('LX', i + 1);
        S('SV1', ['HC', String(l.cpt).toUpperCase()].concat(modsOf(l).slice(0, 4)).join(':'), money(lineCharge(l)), 'UN', l.units || 1, '', '', ptrNums(l).slice(0, 4).join(':'));
        S('DTP', '472', 'D8', d8(c.dos));
      });
    });
    const stIx = seg.findIndex((s) => s.startsWith('ST*'));
    S('SE', seg.length - stIx + 1, '0001');
    S('GE', '1', '1');
    S('IEA', '1', ctrl);
    return seg.join('\n');
  }

  function csv(items) {
    const H = ['account', 'patient_last', 'patient_first', 'dob', 'sex', 'member_id', 'group', 'relationship', 'payer', 'payer_id', 'dos', 'pos', 'rendering_npi', 'taxonomy', 'dx', 'line', 'cpt', 'modifiers', 'dx_pointers', 'units', 'charge'];
    const rows = [H];
    items.forEach((it) => { const c = it.claim, pt = it.patient || {}, pv = it.provider || {}, n = splitName(pt.name); (c.lines || []).filter((l) => l.cpt).forEach((l, i) => rows.push([pt.account, n.last, n.first, pt.dob, c.sex, pt.memberId, pt.groupNo, pt.relationship || 'self', c.payer, pt.payerId, c.dos, c.pos, pv.npi, pv.taxonomy, dxOf(c).join(' '), i + 1, String(l.cpt).toUpperCase(), modsOf(l).join(' '), String(l.ptr || 'A').toUpperCase(), l.units || 1, money(lineCharge(l))])); });
    return rows.map((r) => r.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\n');
  }
  /* What a payer will bounce before the rules even run. */
  function formGaps(c, pt, pv, prac) {
    pt = pt || {}; pv = pv || {}; prac = prac || {};
    const g = [];
    if (!pt.name) g.push('Patient name'); if (!pt.dob) g.push('Patient DOB'); if (!c.sex) g.push('Patient sex'); if (!pt.memberId && c.payer !== 'selfpay') g.push('Member ID'); if (!pt.address) g.push('Patient address');
    if (!pt.payerName && c.payer !== 'selfpay') g.push('Payer name'); if (!(pt.payerId || (prac.payerIds || {})[c.payer]) && c.payer !== 'selfpay') g.push('Payer ID (for 837P)');
    if (!pv.npi) g.push('Rendering NPI'); if (!prac.groupNpi) g.push('Billing NPI (practice)'); if (!prac.taxId) g.push('Tax ID'); if (!(prac.address1 || prac.address)) g.push('Practice address'); if (!pt.account) g.push('Patient account #');
    return g;
  }
  CI.forms = { cms1500, x837, csv, formGaps, total, lineCharge, blankPatient: () => ({ name: '', dob: '', address: '', city: '', state: '', zip: '', phone: '', memberId: '', groupNo: '', relationship: 'self', insuredName: '', insuredAddress: '', payerName: '', payerId: '', payerAddr: '', account: '', auth: '', referring: '', referringNpi: '', onset: '', resub: '', origRef: '', secondary: '', note: '', paid: '' }) };
})(typeof window !== 'undefined' ? window : globalThis);
