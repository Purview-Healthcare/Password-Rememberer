/* Claim Inspector rules engine. Pure functions, no DOM. Works in browser and Node. */
(function (root) {
  'use strict';
  const CI = (root.CI = root.CI || {});
  const G = () => CI.G;

  const normDx = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const fmtDx = (s) => { const n = normDx(s); return n.length > 3 ? n.slice(0, 3) + '.' + n.slice(3) : n; };
  const normCpt = (s) => String(s || '').toUpperCase().replace(/\s/g, '');
  const stripDot = (p) => p.replace(/\./g, '');
  const DX_RE = /^[A-TV-Z][0-9][0-9AB][0-9A-TV-Z]{0,4}$/;
  const CPT_RE = /^([0-9]{4}[0-9FTU]|[A-V][0-9]{4})$/;
  const LETTERS = 'ABCDEFGHIJKL';

  function famMatch(famKeys, dxList) {
    for (const k of famKeys) {
      const fam = CI.FAM[k];
      if (!fam) continue;
      for (const dx of dxList) for (const p of fam.p) { if (dx.startsWith(stripDot(p))) return k; }
    }
    return null;
  }

  /* Suggest dx example codes (from local dictionary) that support a CPT's families. */
  function supportingDx(cpt, limit) {
    const c = CI.CPT[cpt];
    if (!c || !c.fam.length) return [];
    const out = [];
    Object.keys(CI.ICD).forEach((k) => {
      if (out.length >= (limit || 12)) return;
      if (famMatch(c.fam, [k])) out.push(CI.ICD[k]);
    });
    return out;
  }

  const ageOf = (v) => (v === '' || v == null || isNaN(+v)) ? null : +v;

  /**
   * claim = { age, sex:'F'|'M'|'', payer:'medicare'|'medicaid'|'commercial'|'tricare'|'selfpay', pos, taxonomy,
   *           status:'new'|'est'|'', dos:'YYYY-MM-DD', dx:[str], lines:[{cpt, mods:[], ptr:'AB', units, charge}] }
   */
  function inspect(claim) {
    const issues = [];
    const add = (sev, rule, msg, o) => issues.push(Object.assign({ sev, rule, msg, line: null }, o || {}));
    const age = ageOf(claim.age);
    const sex = (claim.sex || '').toUpperCase();
    const payer = claim.payer || 'commercial';
    const medicare = payer === 'medicare';
    const pos = String(claim.pos || '11');
    const dxRaw = (claim.dx || []).map((d) => String(d || '').trim()).filter(Boolean);
    const dxN = dxRaw.map(normDx);
    const lines = (claim.lines || []).map((l, i) => ({
      i, cpt: normCpt(l.cpt), mods: (l.mods || []).map((m) => String(m).toUpperCase().trim()).filter(Boolean),
      ptr: String(l.ptr || '').toUpperCase().replace(/[^A-L]/g, ''), units: l.units === '' || l.units == null ? 1 : +l.units, charge: l.charge
    })).filter((l) => l.cpt);
    const idxOf = (fn) => { const f = lines.find(fn); return f ? f.i : null; };
    const has = (code) => lines.some((l) => l.cpt === code);
    const lineWith = (arr) => lines.filter((l) => arr.indexOf(l.cpt) >= 0);
    const info = (c) => CI.CPT[c];
    const isEM = (l) => G().em.indexOf(l.cpt) >= 0;
    const isPrev = (l) => G().prevAll.indexOf(l.cpt) >= 0;
    const dxOfLine = (l) => l.ptr.split('').map((ch) => dxN[LETTERS.indexOf(ch)]).filter(Boolean);

    if (!lines.length) add('error', 'CLM-001', 'No service lines on the claim. Add at least one CPT/HCPCS code.');
    if (!dxN.length) add('error', 'CLM-002', 'No diagnosis codes. Every claim needs at least one ICD-10-CM code (box 21).');
    if (dxN.length > 12) add('error', 'CLM-003', 'CMS-1500 holds a maximum of 12 diagnoses (A-L).');
    if (claim.dos) {
      const d = new Date(claim.dos + 'T00:00:00');
      const days = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (days < 0) add('error', 'CLM-004', 'Date of service is in the future.');
      else {
        const limit = { medicare: 365, tricare: 365, medicaid: 180, commercial: 90, selfpay: 9999 }[payer];
        if (days > limit * 0.8 && days <= limit) add('warn', 'CLM-005', 'DOS is ' + days + ' days old - approaching a typical ' + limit + '-day timely filing window. Confirm your payer contract.');
        if (days > limit) add('error', 'CLM-006', 'DOS is ' + days + ' days old - past a typical ' + limit + '-day filing limit for this payer type. Look for proof of timely filing / prior submission.');
      }
    }

    /* ---------- Diagnosis checks ---------- */
    dxN.forEach((d, i) => {
      const letter = LETTERS[i];
      if (CI.ICD_INVALID[d]) { add('error', 'DX-001', 'Dx ' + letter + ' (' + fmtDx(d) + '): ' + CI.ICD_INVALID[d] + '.', { dx: i }); return; }
      if (!DX_RE.test(d)) { add('error', 'DX-002', 'Dx ' + letter + ' "' + dxRaw[i] + '" is not a valid ICD-10-CM format (letter + digit + alphanumeric, up to 7 characters).', { dx: i }); return; }
      const rec = CI.ICD[d];
      if (!rec) {
        if (d.length < 4 && !['I10', 'Z23', 'A09', 'N10', 'R21'].includes(d)) add('warn', 'DX-003', 'Dx ' + letter + ' (' + fmtDx(d) + ') has only 3 characters - most categories need more digits to be billable.', { dx: i });
        else add('info', 'DX-004', 'Dx ' + letter + ' (' + fmtDx(d) + ') is not in the built-in code set - validate it in your encoder.', { dx: i });
      } else if (rec.unspecified) {
        add('info', 'DX-005', 'Dx ' + letter + ' (' + rec.code + ' ' + rec.desc + ') is non-specific. ' + (rec.tip || 'Document the more specific form so it can be coded.'), { dx: i });
      }
      if (rec && rec.hcc && payer === 'medicare') add('info', 'DX-006', 'Dx ' + letter + ' (' + rec.code + ') is typically risk-adjusting for Medicare Advantage/ACO models - make sure it is documented as assessed (MEAT) this year.', { dx: i });
      // sex / age edits
      const sx = CI.DX_SEX.find((r) => r.p.some((p) => d.startsWith(p)));
      if (sx && sex && sex !== sx.sex) add('error', 'DX-007', 'Dx ' + letter + ' (' + fmtDx(d) + ') is ' + sx.why + ' but patient sex is ' + sex + '. Fix patient sex or code.', { dx: i });
      if (age != null) {
        if (d.startsWith('P') && age > 1) add('warn', 'DX-008', 'Dx ' + letter + ' (' + fmtDx(d) + ') is a perinatal-period code; patient is ' + age + ' years old.', { dx: i });
        if ((d.startsWith('Z00121') || d.startsWith('Z00129')) && age >= 18) add('error', 'DX-009', 'Dx ' + letter + ' (' + fmtDx(d) + ') is a child health exam code (<18) but patient is ' + age + '. Use Z00.00 / Z00.01.', { dx: i, fix: { type: 'note' } });
        if ((d === 'Z0000' || d === 'Z0001') && age < 18) add('warn', 'DX-010', 'Dx ' + letter + ' (' + fmtDx(d) + ') is the adult exam code but patient is ' + age + '. Use Z00.121 / Z00.129 for children.', { dx: i });
        if (d.startsWith('Z0011') && age > 1) add('warn', 'DX-011', 'Newborn exam dx (' + fmtDx(d) + ') for a ' + age + '-year-old.', { dx: i });
      }
      if (d.startsWith('Z68') && i === 0) add('error', 'DX-012', 'BMI code (Z68.-) cannot be first-listed. Put the weight dx (E66.-, E66.3, R63.-) first.', { dx: i });
      if (rec && rec.noPrimary && i === 0 && d !== 'Z23') add('warn', 'DX-013', 'Dx A is ' + rec.code + ', a status/secondary-only code. List the reason for the visit first.', { dx: i });
    });
    const dupDx = dxN.filter((d, i) => d && dxN.indexOf(d) !== i);
    if (dupDx.length) add('warn', 'DX-014', 'Duplicate diagnosis code(s): ' + Array.from(new Set(dupDx)).map(fmtDx).join(', ') + '.');
    if ((dxN.includes('Z0001') || dxN.includes('Z00121')) && dxN.every((d) => d.startsWith('Z'))) add('warn', 'DX-015', 'Z00.01/Z00.121 means an abnormal finding was identified, but no diagnosis for the finding is listed. Add the dx for the abnormality.');
    if (dxN.includes('Z0000') && dxN.some((d) => /^[A-Y]/.test(d) && !d.startsWith('Z'))) add('info', 'DX-016', 'Z00.00 (no abnormal findings) is listed with a disease dx. If the problem was found/addressed at the exam, use Z00.01 instead.');

    /* ---------- Line checks ---------- */
    lines.forEach((l) => {
      const c = info(l.cpt);
      const L = { line: l.i };
      if (!CPT_RE.test(l.cpt)) { add('error', 'CPT-001', l.cpt + ' is not a valid CPT/HCPCS format.', L); return; }
      if (!c) add('info', 'CPT-002', l.cpt + ' is not in the built-in code set - verify description and dx pairing manually.', L);
      if (!l.ptr) add('error', 'PTR-001', l.cpt + ': no diagnosis pointer. Each line must point to at least one dx (A-L).', Object.assign({ fix: { type: 'ptr', value: 'A' } }, L));
      if (l.ptr.length > 4) add('error', 'PTR-002', l.cpt + ': more than 4 diagnosis pointers (max 4 per line).', L);
      l.ptr.split('').forEach((ch) => { if (LETTERS.indexOf(ch) >= dxN.length) add('error', 'PTR-003', l.cpt + ' points to dx ' + ch + ', which is not on the claim.', L); });
      if (!(l.units >= 1) || l.units % 1 !== 0) add('error', 'UNT-001', l.cpt + ': units must be a whole number >= 1.', L);
      if ((isEM(l) || isPrev(l) || G().awv.indexOf(l.cpt) >= 0) && l.units > 1) add('error', 'UNT-002', l.cpt + ': E/M, preventive and wellness visits are 1 unit per day (MUE 1).', Object.assign({ fix: { type: 'units', value: 1 } }, L));
      if (l.cpt === '93000' && l.units > 1) add('error', 'UNT-003', '93000 is 1 unit per ECG.', L);
      if (l.mods.length > 4) add('error', 'MOD-001', l.cpt + ': a line holds at most 4 modifiers.', L);
      l.mods.forEach((m) => {
        if (!/^[A-Z0-9]{2}$/.test(m)) add('error', 'MOD-002', l.cpt + ': "' + m + '" is not a valid 2-character modifier.', L);
        else if (!CI.MODMAP[m] && !/^(F[1-9A]|T[1-9A]|E[1-4]|LC|LD|RC|LM|RI|P[1-6]|Q[0-9]|S[A-Z]|X[EPSU]|G[A-Z]|K[A-Z]|[A-Z][A-Z])$/.test(m)) add('info', 'MOD-003', l.cpt + ': modifier ' + m + ' is unusual - confirm it is valid for the payer.', L);
      });
      if (l.mods.includes('59') && l.mods.some((m) => /^X[EPSU]$/.test(m))) add('warn', 'MOD-004', l.cpt + ': 59 and an X{EPSU} modifier together - use only the most specific one.', L);
      if (l.mods.includes('50') && (l.mods.includes('RT') || l.mods.includes('LT'))) add('error', 'MOD-005', l.cpt + ': 50 (bilateral) conflicts with RT/LT on the same line.', L);
      if (l.mods.includes('26') && l.mods.includes('TC')) add('error', 'MOD-006', l.cpt + ': 26 and TC cannot be on the same line.', L);
      if (l.mods.includes('25') && !isEM(l) && !isPrev(l) && !G().awv.includes(l.cpt) && !G().hospital.includes(l.cpt) && !G().nf.includes(l.cpt) && !G().home.includes(l.cpt)) {
        add('warn', 'MOD-007', l.cpt + ': modifier 25 belongs on the E/M service, not on this line.', Object.assign({ fix: { type: 'removeMod', value: '25' } }, L));
      }
      if (l.mods.includes('95') && (pos === '11')) add('warn', 'MOD-008', l.cpt + ': modifier 95 (telemedicine) with POS 11 (office). Telehealth lines use POS 02/10 (Medicare) or POS 11 + 95 only for some commercial payers - check the payer.', L);
      if ((pos === '02' || pos === '10') && isEM(l) && !l.mods.some((m) => ['95', '93', 'FQ', 'GT', 'GQ'].includes(m))) add('info', 'MOD-009', l.cpt + ': telehealth POS ' + pos + ' - many commercial payers also require modifier 95 (video) or 93 (audio-only). Verify.', L);

      // POS vs code
      if (c) {
        if (G().em.includes(l.cpt) && ['21', '23', '31', '32'].includes(pos)) add('error', 'POS-001', l.cpt + ' is an office/outpatient E/M but POS ' + pos + ' is a facility/inpatient setting. Use the hospital/nursing facility E/M series.', L);
        if (G().hospital.includes(l.cpt) && ['11', '12'].includes(pos)) add('error', 'POS-002', l.cpt + ' is hospital E/M but POS is ' + pos + '.', L);
        if (G().nf.includes(l.cpt) && !['31', '32', '33'].includes(pos)) add('error', 'POS-003', l.cpt + ' is a nursing-facility E/M; expected POS 31/32.', L);
        if (G().home.includes(l.cpt) && !['12', '13', '14', '16', '33'].includes(pos)) add('error', 'POS-004', l.cpt + ' is a home/residence visit; expected POS 12/13/14/16/33.', L);
        if (['93000'].includes(l.cpt) && ['21', '22', '23', '24'].includes(pos)) add('warn', 'POS-005', '93000 in facility POS: bill 93010 (interpretation only); facility bills the tracing.', L);
        if (isEM(l) && pos === '22' || isEM(l) && pos === '19') add('info', 'POS-006', 'Hospital outpatient department POS ' + pos + ': payer pays facility-rate for practitioner and the hospital bills a facility fee.', L);
      }
      // age / sex
      if (c && c.age && age != null && (age < c.age[0] || age > c.age[1])) {
        const sev = (isPrev(l) || G().vaccAdmin.includes(l.cpt) || c.cat === 'Vaccine') ? 'error' : 'warn';
        add(sev, 'AGE-001', l.cpt + ' (' + c.desc + ') is typically for ages ' + c.age[0] + '-' + (c.age[1] >= 120 ? '+' : c.age[1]) + ' - patient is ' + age + '.', Object.assign({ fix: isPrev(l) ? { type: 'prevAge' } : null }, L));
      }
      if (c && c.sex && sex && c.sex !== sex) add('error', 'SEX-001', l.cpt + ' (' + c.desc + ') is sex-specific (' + c.sex + ') but patient sex is ' + sex + '.', L);
      if (G().bundledNoPay.includes(l.cpt)) add('warn', 'BND-001', l.cpt + ' is bundled into the E/M by most payers - leave it off (it will deny CO-97).', Object.assign({ fix: { type: 'removeLine' } }, L));

      // status new/est
      if (claim.status === 'est' && (G().newEM.includes(l.cpt) || G().prevNew.includes(l.cpt))) add('error', 'NEW-001', l.cpt + ' is a NEW patient code but the patient is established (seen by you/your group, same specialty, within 3 years).', Object.assign({ fix: { type: 'toEst' } }, L));
      if (claim.status === 'new' && (G().estEM.includes(l.cpt) || G().prevEst.includes(l.cpt)) && l.cpt !== '99211') add('error', 'NEW-002', l.cpt + ' is an ESTABLISHED patient code but the patient is new (not seen in 3 years).', Object.assign({ fix: { type: 'toNew' } }, L));
      if (l.cpt === '99211' && claim.status === 'new') add('error', 'NEW-003', '99211 is for established patients only.', L);

      // QW
      if (G().qwCodes.includes(l.cpt) && !l.mods.includes('QW') && payer !== 'selfpay') add('info', 'LAB-001', l.cpt + ' is a CLIA-waived test: add modifier QW when performed with a waived kit in your office (Medicare/Medicaid and many commercial plans require it). Put your CLIA number in box 23.', Object.assign({ fix: { type: 'addMod', value: 'QW' } }, L));
      if (l.mods.includes('QW') && ['81002', '81025', '82962', '82270'].includes(l.cpt)) add('info', 'LAB-002', l.cpt + ' is exempt from QW - modifier is not needed.', L);
      if (l.cpt === '96127' && l.units > 4) add('warn', 'UNT-004', '96127 units ' + l.units + ' - per-instrument billing; most payers cap at 3-4 per visit.', L);
      if (l.cpt === '36415' && l.units > 1) add('info', 'UNT-005', '36415 is billed once per collection encounter (not per tube).', L);

      // medical necessity (dx families)
      if (c && c.fam.length && !c.fam.includes('anydx') && l.ptr) {
        const pointed = dxOfLine(l);
        if (pointed.length && !famMatch(c.fam, pointed)) {
          const names = c.fam.map((k) => CI.FAM[k] && CI.FAM[k].label).filter(Boolean).join(' / ');
          add('warn', 'NEC-001', l.cpt + ' (' + c.desc + '): none of the pointed dx (' + pointed.map(fmtDx).join(', ') + ') typically supports this service. Expected: ' + names + '. Check medical necessity / pointer or add the supporting dx.', Object.assign({ fix: { type: 'suggestDx' } }, L));
        }
      }
      if (c && c.cat === 'Vaccine' && !dxN.includes('Z23') && l.ptr) add('error', 'VAC-001', l.cpt + ': vaccines need Z23 (encounter for immunization) as the dx on the line.', L);
    });

    /* ---------- Claim-level rule groups ---------- */
    const ems = lines.filter(isEM);
    const prevs = lines.filter(isPrev);
    const awvs = lineWith(G().awv);
    const hospEm = lines.filter((l) => G().hospital.includes(l.cpt));
    // Multiple E/M
    if (ems.length > 1) add('error', 'EM-001', 'Multiple office E/M codes (' + ems.map((l) => l.cpt).join(', ') + ') on one date. Only one office E/M per provider/day - combine into the highest supported level.', { line: ems[1].i });
    if (prevs.length > 1) add('error', 'EM-002', 'Two preventive visit codes on one claim. Bill one age-appropriate preventive code.', { line: prevs[1].i });
    if (awvs.length > 1) add('error', 'AWV-001', 'More than one wellness code (' + awvs.map((l) => l.cpt).join(', ') + ') on one claim.', { line: awvs[1].i });
    if (hospEm.length > 1) add('warn', 'EM-003', 'Multiple hospital E/M codes on one date by one provider - usually only one per day.', { line: hospEm[1].i });
    if (has('99417') && !has('99205') && !has('99215')) add('error', 'EM-004', '99417 (prolonged service) requires 99205 or 99215 on the same date.', { line: idxOf((l) => l.cpt === '99417') });
    if (has('G2212') && !has('99205') && !has('99215')) add('error', 'EM-005', 'G2212 (Medicare prolonged service) requires 99205 or 99215.', { line: idxOf((l) => l.cpt === 'G2212') });
    if (has('G2212') && !medicare) add('warn', 'EM-006', 'G2212 is Medicare-specific. Commercial payers usually want 99417.', { line: idxOf((l) => l.cpt === 'G2212') });
    if (has('99417') && medicare) add('warn', 'EM-007', 'Medicare does not pay 99417; use G2212 and its higher time thresholds (69 min for 99215, 89 min for 99205).', { line: idxOf((l) => l.cpt === '99417') });
    if (has('99211') && ems.length === 1 && prevs.length === 0 && lines.some((l) => G().vaccAdmin.includes(l.cpt)) && lines.length <= 4) add('warn', 'EM-008', '99211 billed only with a vaccine administration: a nurse visit just for a shot does not support a separate E/M.', { line: idxOf((l) => l.cpt === '99211') });

    // G2211
    const g2211 = lines.find((l) => l.cpt === 'G2211');
    if (g2211) {
      if (!ems.length) add('error', 'G22-001', 'G2211 is an add-on to office E/M 99202-99215; no qualifying E/M on this claim.', { line: g2211.i });
      if (!medicare) add('info', 'G22-002', 'G2211 is a Medicare code; some commercial/Medicaid plans adopted it, many do not.', { line: g2211.i });
      const em25 = ems.find((l) => l.mods.includes('25'));
      if (em25 && medicare) {
        const other = lines.filter((l) => !isEM(l) && l.cpt !== 'G2211' && l.cpt !== 'G2212' && l.cpt !== '99417' && !G().drugAdmin.includes(l.cpt) && info(l.cpt) && info(l.cpt).cat === 'Procedure');
        const exempt = lines.some((l) => G().vaccAdmin.includes(l.cpt) || G().awv.includes(l.cpt));
        if (other.length && !exempt) add('error', 'G22-003', 'Medicare does not pay G2211 when the E/M carries modifier 25 for a procedure (exceptions: vaccine administration, AWV/IPPE, Part B preventive services).', { line: g2211.i });
      }
    }

    // Preventive + problem E/M => 25
    if (prevs.length && ems.length) {
      const e = ems[0];
      if (!e.mods.includes('25') && !prevs[0].mods.includes('25')) {
        add('error', 'MOD-010', 'Preventive visit (' + prevs[0].cpt + ') + problem E/M (' + e.cpt + ') need modifier 25 on the problem-oriented E/M so the second visit is not bundled.', { line: e.i, fix: { type: 'addMod', value: '25', line: e.i } });
      } else {
        add('info', 'MOD-011', 'Make sure the note shows a separately documented problem (HPI, assessment, plan) beyond the preventive exam. Expect copay/deductible on the problem E/M.', { line: e.i });
      }
    }
    if (awvs.length && ems.length && !ems[0].mods.includes('25')) add('error', 'MOD-012', awvs[0].cpt + ' (AWV/IPPE) + ' + ems[0].cpt + ' require modifier 25 on the problem-oriented E/M.', { line: ems[0].i, fix: { type: 'addMod', value: '25', line: ems[0].i } });
    if (awvs.length && prevs.length) add('error', 'AWV-002', 'An AWV/IPPE and a preventive-medicine visit (9938x/9939x) on the same date: Medicare does not cover both. Keep the AWV.', { line: prevs[0].i });
    if (prevs.length && medicare) add('warn', 'MCR-001', 'Medicare does not cover routine physicals (9938x/9939x). Bill G0402 (IPPE, first 12 months of Part B), G0438/G0439 (AWV), or append GY and collect from the patient.', { line: prevs[0].i, fix: { type: 'toAWV' } });
    awvs.forEach((a) => {
      if (!medicare && payer !== 'selfpay') add('warn', 'MCR-002', a.cpt + ' is a Medicare-only code - other payers use 9938x/9939x.', { line: a.i });
      if (age != null && age < 65 && medicare) add('info', 'MCR-003', a.cpt + ': patient is under 65 - confirm Medicare eligibility is through disability/ESRD.', { line: a.i });
      if (a.cpt === 'G0438' && has('G0444')) add('warn', 'AWV-003', 'G0444 (depression screening) is not payable with the initial AWV (G0438) or IPPE - it is part of those visits. It is payable with G0439.', { line: idxOf((l) => l.cpt === 'G0444') });
      if (a.cpt === 'G0402' && has('G0444')) add('warn', 'AWV-003', 'G0444 is not payable with IPPE (G0402).', { line: idxOf((l) => l.cpt === 'G0444') });
      if (has('99497') && !lines.find((l) => l.cpt === '99497').mods.includes('33')) add('info', 'AWV-004', '99497 (advance care planning) with an AWV: append modifier 33 so no cost-sharing applies (Medicare), and document the 16+ minutes.', { line: idxOf((l) => l.cpt === '99497'), fix: { type: 'addMod', value: '33', line: idxOf((l) => l.cpt === '99497') } });
    });

    // Procedure + E/M => 25
    const procs = lines.filter((l) => { const c = info(l.cpt); return c && c.cat === 'Procedure' && ['0', '10', '90'].includes(String(c.global)); });
    if (procs.length && ems.length && !prevs.length) {
      const e = ems[0];
      if (!e.mods.includes('25')) {
        add('error', 'MOD-013', e.cpt + ' billed with procedure ' + procs[0].cpt + ' on the same day: add modifier 25 to the E/M if (and only if) a significant, separately identifiable problem was addressed. Otherwise drop the E/M.', { line: e.i, fix: { type: 'addMod', value: '25', line: e.i } });
      } else {
        add('info', 'MOD-014', e.cpt + '-25 with ' + procs[0].cpt + ': documentation must show an E/M beyond the usual pre-procedure evaluation (consider a different dx on the E/M).', { line: e.i });
        const eDx = dxOfLine(e).join(','), pDx = dxOfLine(procs[0]).join(',');
        if (eDx && eDx === pDx) add('info', 'MOD-015', 'E/M-25 and the procedure point to the identical dx. Payers look for a separate dx on the E/M when it is truly distinct.', { line: e.i });
      }
    }
    // Drug administration + E/M
    const adm = lines.filter((l) => ['96372', '96365', '96374'].includes(l.cpt));
    if (adm.length && ems.length && !ems[0].mods.includes('25') && !procs.length) add('warn', 'MOD-016', 'Injection/infusion admin (' + adm[0].cpt + ') with E/M: add modifier 25 on the E/M only if separately identifiable; otherwise bill the injection alone.', { line: ems[0].i, fix: { type: 'addMod', value: '25', line: ems[0].i } });

    // Drug supply without administration
    lines.filter((l) => /^J/.test(l.cpt) && !/^J72|^J73/.test(l.cpt)).forEach((j) => {
      if (!lines.some((l) => G().drugAdmin.includes(l.cpt))) add('warn', 'DRG-001', j.cpt + ' (drug) has no administration/procedure code (e.g., 96372, 20610) on the claim.', { line: j.i });
      if (['J3301'].includes(j.cpt)) add('info', 'DRG-002', 'J3301 is per 10 mg: 40 mg = 4 units. Include NDC (N4 qualifier) for Medicaid/some commercial plans.', { line: j.i });
      if (['J1030', 'J1040'].includes(j.cpt)) add('info', 'DRG-003', j.cpt + ': include NDC + units per payer. Wasted drug from a single-dose vial uses JW (discarded) / JZ (none discarded) for Medicare.', { line: j.i });
    });
    if (lines.some((l) => ['58300'].includes(l.cpt)) && !lines.some((l) => ['J7296', 'J7297', 'J7298', 'J7300'].includes(l.cpt))) add('warn', 'DRG-004', '58300 (IUD insertion) without the device code (J7296-J7300). Device is billed separately unless supplied by the patient/340B.', { line: idxOf((l) => l.cpt === '58300') });
    if (lines.some((l) => ['11981', '11983'].includes(l.cpt)) && !has('J7307')) add('warn', 'DRG-005', 'Implant insertion without implant supply code J7307.', { line: idxOf((l) => ['11981', '11983'].includes(l.cpt)) });

    // Vaccines
    const prodFlu = lines.filter((l) => G().fluProd.includes(l.cpt));
    const prodPn = lines.filter((l) => G().pneumoProd.includes(l.cpt));
    const prodHb = lines.filter((l) => G().hepBProd.includes(l.cpt));
    const products = lines.filter((l) => info(l.cpt) && info(l.cpt).cat === 'Vaccine' && !G().vaccAdmin.includes(l.cpt));
    const adminLines = lines.filter((l) => G().vaccAdmin.includes(l.cpt));
    if (products.length && !adminLines.length) add('error', 'VAC-002', 'Vaccine product billed without an administration code (90460/90471/G0008-G0010).', { line: products[0].i });
    if (adminLines.length && !products.length) add('error', 'VAC-003', 'Vaccine administration billed without the vaccine product code.', { line: adminLines[0].i });
    if (medicare) {
      if (prodFlu.length && !has('G0008')) add('error', 'VAC-004', 'Medicare: flu vaccine administration is G0008 (not 90471/90472).', { line: prodFlu[0].i, fix: { type: 'swapAdmin', value: 'G0008' } });
      if (prodPn.length && !has('G0009')) add('error', 'VAC-005', 'Medicare: pneumococcal vaccine administration is G0009.', { line: prodPn[0].i, fix: { type: 'swapAdmin', value: 'G0009' } });
      if (prodHb.length && !has('G0010')) add('error', 'VAC-006', 'Medicare: hepatitis B vaccine administration is G0010.', { line: prodHb[0].i, fix: { type: 'swapAdmin', value: 'G0010' } });
      if (has('G0008') && !prodFlu.length) add('error', 'VAC-007', 'G0008 requires a flu vaccine product code.', { line: idxOf((l) => l.cpt === 'G0008') });
    } else {
      if (has('G0008') || has('G0009') || has('G0010')) add('warn', 'VAC-008', 'G0008/G0009/G0010 are Medicare-only. Use 90471/90472 (or 90460/90461 for patients <=18 with counseling).');
    }
    if (age != null && age <= 18 && lines.some((l) => ['90471', '90472'].includes(l.cpt))) add('info', 'VAC-009', 'Patient <=18: if physician/QHP counseling was documented use 90460 + 90461 per component (needed for VFC and many Medicaid plans).', {});
    if (age != null && age <= 18 && lines.some((l) => ['90460', '90461'].includes(l.cpt)) && !lines.some((l) => l.cpt === '90460')) add('error', 'VAC-010', '90461 requires 90460 on the claim.', {});
    if (age != null && age > 18 && lines.some((l) => ['90460', '90461'].includes(l.cpt))) add('error', 'VAC-011', '90460/90461 are for patients 18 and younger. Use 90471/90472.', {});
    if (has('99211') && adminLines.length === 0) { /* fine */ }
    if (adminLines.length && ems.length && !prevs.length && !ems[0].mods.includes('25')) add('info', 'MOD-017', 'E/M + vaccine admin same day: modifier 25 is needed on the E/M if it was a separately identifiable visit; if the visit was only the vaccine, drop the E/M.', { line: ems[0].i, fix: { type: 'addMod', value: '25', line: ems[0].i } });
    if (has('96372') && products.length) add('error', 'VAC-012', '96372 cannot be used to administer a vaccine. Use 90471/90472 or 90460/G0008-G0010.', { line: idxOf((l) => l.cpt === '96372') });

    // Counseling / screening
    if (has('99406') && has('99407')) add('error', 'CNS-001', '99406 and 99407 are mutually exclusive on one date.', { line: idxOf((l) => l.cpt === '99407') });
    if (has('99408') && has('99409')) add('error', 'CNS-002', '99408 and 99409 are mutually exclusive.', { line: idxOf((l) => l.cpt === '99409') });
    if (['99406', '99407', '99408', '99409', '99497', '96127', 'G0444', 'G0442', 'G0443', 'G0447', '99401', '99402', '99403', '99404'].some(has) && ems.length && !ems[0].mods.includes('25') && !prevs.length && !awvs.length) add('info', 'CNS-003', 'Counseling/screening billed with an E/M: modifier 25 on the E/M is required if the counseling time is separate from E/M time (do not count the same minutes twice).', { line: ems[0].i });
    if (has('96127') && medicare && !has('G0444')) add('info', 'CNS-004', 'Medicare screening for depression uses G0444 (once per year, 15 min). 96127 is paid by some MACs for monitoring but not as a screening code.', { line: idxOf((l) => l.cpt === '96127') });
    if (has('99406') || has('99407')) add('info', 'CNS-005', 'Tobacco cessation: document minutes (3-10 / >10), content and a tobacco dx (F17.- or Z72.0). Medicare requires a qualifying condition or medication affected by tobacco.', { line: idxOf((l) => ['99406', '99407'].includes(l.cpt)) });
    if (has('99497') && !dxN.length) { /* handled by general */ }

    // Care management
    if ((has('99490') || has('99487') || has('99439')) && ems.length === 0 && !has('G0438') && !has('G0439')) add('info', 'CCM-001', 'Chronic care management billed: confirm consent on file, comprehensive care plan, 24/7 access, and an initiating visit (E/M, AWV or IPPE) within the past 12 months for new patients.', {});
    if ((has('99495') || has('99496')) && has('99490')) add('info', 'CCM-002', 'TCM and CCM can be billed in the same month on Medicare only if the time is not double counted (check current CMS rules).', {});
    if ((has('99495') || has('99496')) && ems.length) add('warn', 'TCM-001', 'TCM (99495/99496) includes the face-to-face visit; do not add a separate office E/M for the same visit.', { line: ems[0].i });
    if (has('99496') && has('99495')) add('error', 'TCM-002', '99495 and 99496 are mutually exclusive.', {});

    // Bundling pairs
    const PAIRS = [
      ['20611', '20610', true, 'Same joint: bill only the ultrasound-guided code. Different joints need XS/59.'],
      ['20610', '20552', true, 'Joint injection and trigger point injection are distinct only if different anatomic sites.'],
      ['20610', '20550', true, 'Tendon-sheath injection in a different location than the joint: use XS/59.'],
      ['20610', '20605', true, 'Different joints: XS/59 on the second; same joint: bill one.'],
      ['94060', '94010', false, '94060 includes 94010 - never bill both.'],
      ['93000', '93005', false, '93000 already includes tracing + interpretation.'],
      ['93000', '93010', false, '93000 already includes tracing + interpretation.'],
      ['81003', '81002', false, 'Two urinalysis codes at once; bill one.'],
      ['17000', '17110', true, 'Premalignant and benign lesion destruction on different lesions: use 59/XS.'],
      ['17004', '17000', false, '17004 includes 17000/17003.'],
      ['11720', '11721', false, 'Nail debridement 1-5 and 6+ are mutually exclusive.'],
      ['11055', '11056', false, 'Paring codes are mutually exclusive.'],
      ['11720', '11055', true, 'Nail debridement and paring in the same area: bundled unless distinct (59/XS).'],
      ['11104', '11102', true, 'Same lesion biopsied twice: bill only one; different lesions: add-on codes (11103/11105/11107).'],
      ['10061', '10060', false, 'Simple and complicated I&D on the same lesion: bill only 10061.'],
      ['12032', '12002', true, 'Repairs of different complexity in the same anatomic group: combine by highest complexity.'],
      ['99000', '36415', false, '99000 handling fee is bundled into 36415 by most payers.'],
      ['96372', '96374', true, 'Different routes/sequencing allowed with modifier 59.'],
      ['69210', '69200', true, 'Cerumen removal and foreign body removal are distinct only for separate problems/ears.'],
      ['G0438', 'G0439', false, 'Only one AWV code per date.']
    ];
    PAIRS.forEach(([a, b, modOk, why]) => {
      const la = lines.find((l) => l.cpt === a), lb = lines.find((l) => l.cpt === b);
      if (la && lb) {
        const hasMod = lb.mods.some((m) => ['59', 'XS', 'XE', 'XP', 'XU'].includes(m));
        if (!modOk) add('error', 'NCCI-001', a + ' + ' + b + ': ' + why, { line: lb.i, fix: { type: 'removeLineByCpt', value: b } });
        else if (!hasMod) add('warn', 'NCCI-002', a + ' + ' + b + ' is an edit pair (illustrative; check current CMS NCCI PTP table). ' + why, { line: lb.i, fix: { type: 'addMod', value: 'XS', line: lb.i } });
        else add('info', 'NCCI-003', b + ' carries a distinct-service modifier with ' + a + '. Be sure documentation proves a separate site/session; X-modifiers are audited.', { line: lb.i });
      }
    });
    // injection laterality
    lines.filter((l) => ['20610', '20611', '20600', '20604', '20605', '20606', '69210'].includes(l.cpt)).forEach((l) => {
      if (!l.mods.some((m) => ['RT', 'LT', '50', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'FA', 'XS', '59'].includes(m))) add('warn', 'LAT-001', l.cpt + ': add laterality (RT / LT / 50) so the payer can tell which side was done and avoid duplicate-claim denials.', Object.assign({ line: l.i }, {}));
    });

    // Hospital outpatient / incident-to
    const tax = CI.TAX[claim.taxonomy];
    if (tax && tax.kind === 'npp' && medicare && pos === '11' && ems.length) add('info', 'INC-001', 'NP/PA in the office with Medicare: if billing under the physician NPI (incident-to), the physician must have initiated the plan of care, the problem cannot be new, and supervision must be direct. Otherwise bill under the NP/PA NPI at 85%.', {});
    if (tax && tax.kind === 'npp' && has('G0438') && medicare) add('info', 'INC-002', 'AWV can be performed by NP/PA/RN under physician supervision; incident-to is permitted for AWV components.', {});

    /* ---------- Taxonomy / scope ---------- */
    if (!claim.taxonomy) add('info', 'TAX-001', 'No rendering taxonomy entered - taxonomy ↔ service/diagnosis scope not checked.');
    else if (!tax) add('warn', 'TAX-002', 'Taxonomy ' + claim.taxonomy + ' is not in the built-in list. Confirm it matches the NPPES record for the rendering NPI.');
    else {
      if (tax.kind === 'fac' || tax.kind === 'grp') add('warn', 'TAX-003', tax.name + ' is a billing/facility taxonomy. The rendering provider (box 24J) needs an individual practitioner taxonomy.');
      if (age != null) {
        if (age < tax.ageMin) add('warn', 'TAX-004', 'Patient age ' + age + ' is below the typical scope of ' + tax.name + ' (' + tax.ageMin + '+). Payers with specialty-age edits (esp. Medicaid) may deny.');
        if (age > tax.ageMax) add('warn', 'TAX-005', 'Patient age ' + age + ' is above the typical scope of ' + tax.name + ' (up to ' + tax.ageMax + '). Verify enrollment taxonomy / specialty.');
      }
      if (tax.sex && sex && tax.sex !== sex) add('warn', 'TAX-006', tax.name + ' scope is ' + (tax.sex === 'F' ? 'female' : 'male') + ' patients.');
      dxN.forEach((d, i) => {
        CI.TAX_DX_WATCH.forEach((w) => { if (w.p.some((p) => d.startsWith(p) && !(w.p[0] === 'H' && /^H(6|10|9)/.test(d)))) add(w.sev, 'TAX-DX', 'Dx ' + LETTERS[i] + ' (' + fmtDx(d) + ') ↔ ' + tax.name + ': ' + w.msg, { dx: i }); });
      });
      if (tax.name.indexOf('Obesity') >= 0 && dxN.length && !dxN.some((d) => d.startsWith('E66') || d.startsWith('Z68') || d.startsWith('E11') || d.startsWith('E78'))) add('info', 'TAX-007', 'Obesity-medicine taxonomy but no E66/Z68/E11/E78 dx on the claim - payers that map taxonomy to diagnoses may flag it.');
      if (tax.name.indexOf('Sports') >= 0 && dxN.length && !dxN.some((d) => /^[MS]/.test(d))) add('info', 'TAX-008', 'Sports-medicine taxonomy but no M-/S- dx on the claim.');
      if (tax.name.indexOf('Geriatric') >= 0 && prevs.some((l) => info(l.cpt) && info(l.cpt).age && info(l.cpt).age[1] < 50)) add('warn', 'TAX-009', 'Geriatric taxonomy billing a pediatric/young adult preventive code.');
    }

    // Score
    const errs = issues.filter((x) => x.sev === 'error').length, warns = issues.filter((x) => x.sev === 'warn').length;
    const score = Math.max(0, 100 - errs * 18 - warns * 6 - issues.filter((x) => x.sev === 'info').length * 1);
    return { issues, score, errs, warns, infos: issues.filter((x) => x.sev === 'info').length, lines };
  }

  /* Apply a suggested fix to a claim; returns a new claim. */
  function applyFix(claim, issue) {
    const cl = JSON.parse(JSON.stringify(claim));
    const f = issue.fix;
    if (!f) return cl;
    const line = cl.lines[f.line != null ? f.line : issue.line];
    const L = line;
    const swap = (from, to) => { const x = cl.lines.find((l) => normCpt(l.cpt) === from); if (x) x.cpt = to; };
    switch (f.type) {
      case 'addMod': if (L && !(L.mods || []).includes(f.value)) { L.mods = (L.mods || []).concat(f.value); } break;
      case 'removeMod': if (L) L.mods = (L.mods || []).filter((m) => m !== f.value); break;
      case 'units': if (L) L.units = f.value; break;
      case 'ptr': if (L) L.ptr = f.value; break;
      case 'removeLine': cl.lines = cl.lines.filter((l, i) => i !== issue.line); break;
      case 'removeLineByCpt': cl.lines = cl.lines.filter((l) => normCpt(l.cpt) !== f.value); break;
      case 'toEst': if (L) { const m = { '99202': '99212', '99203': '99213', '99204': '99214', '99205': '99215', '99381': '99391', '99382': '99392', '99383': '99393', '99384': '99394', '99385': '99395', '99386': '99396', '99387': '99397' }; L.cpt = m[normCpt(L.cpt)] || L.cpt; } break;
      case 'toNew': if (L) { const m = { '99212': '99202', '99213': '99203', '99214': '99204', '99215': '99205', '99391': '99381', '99392': '99382', '99393': '99383', '99394': '99384', '99395': '99385', '99396': '99386', '99397': '99387' }; L.cpt = m[normCpt(L.cpt)] || L.cpt; } break;
      case 'toAWV': if (L) L.cpt = (claim.status === 'new') ? 'G0438' : 'G0439'; break;
      case 'prevAge': if (L && claim.age != null && claim.age !== '') { const a = +claim.age; const est = normCpt(L.cpt) >= '99391'; const base = est ? 99391 : 99381; const idx = a < 1 ? 0 : a < 5 ? 1 : a < 12 ? 2 : a < 18 ? 3 : a < 40 ? 4 : a < 65 ? 5 : 6; L.cpt = String(base + idx); } break;
      case 'swapAdmin': {
        const x = cl.lines.find((l) => ['90471', '90472', '90473', '90474'].includes(normCpt(l.cpt)));
        if (x) x.cpt = f.value; break;
      }
      default: break;
    }
    return cl;
  }

  /* ---------- Pairing check (CPT x Dx x patient) ---------- */
  function matchCptDx(cpt, dxList) {
    cpt = normCpt(cpt);
    const c = CI.CPT[cpt];
    const dxs = dxList.map(normDx).filter(Boolean);
    const res = { cpt: c, verdict: 'unknown', reasons: [], dx: [], suggestions: [] };
    if (!c) { res.reasons.push('CPT/HCPCS ' + cpt + ' is not in the built-in code set.'); return res; }
    if (!c.fam.length) { res.verdict = 'ok'; res.reasons.push('This service has no diagnosis-specific coverage rule built in (E/M and similar codes are supported by any dx that reflects the problem addressed).'); }
    else if (c.fam.includes('anydx')) { res.verdict = 'ok'; res.reasons.push('Any documented diagnosis can support this service.'); }
    else {
      const names = c.fam.map((k) => CI.FAM[k].label);
      res.expected = names;
      dxs.forEach((d) => {
        const fam = famMatch(c.fam, [d]);
        res.dx.push({ code: fmtDx(d), rec: CI.ICD[d] || null, ok: !!fam, family: fam ? CI.FAM[fam].label : null });
      });
      const okCount = res.dx.filter((x) => x.ok).length;
      if (!dxs.length) { res.verdict = 'missing'; res.reasons.push('Enter at least one diagnosis.'); }
      else if (okCount === dxs.length) res.verdict = 'ok';
      else if (okCount > 0) res.verdict = 'partial';
      else res.verdict = 'mismatch';
      if (res.verdict === 'ok') res.reasons.push('All diagnoses fall within the expected families: ' + names.join(', ') + '.');
      if (res.verdict === 'partial') res.reasons.push('Some diagnoses support the service; point the line only at those that do.');
      if (res.verdict === 'mismatch') { res.reasons.push('None of the diagnoses is in an expected family (' + names.join(', ') + '). Expect a medical-necessity denial (CO-50 / CO-11).'); res.suggestions = supportingDx(cpt, 10); }
    }
    if (c.note) res.reasons.push('Note: ' + c.note);
    return res;
  }

  /* Which CPTs are typically supported by a given dx? */
  function cptsForDx(dx) {
    const d = normDx(dx);
    const out = [];
    Object.keys(CI.CPT).forEach((k) => {
      const c = CI.CPT[k];
      if (c.fam.length && !c.fam.includes('anydx') && famMatch(c.fam, [d])) out.push(c);
    });
    return out;
  }

  function timeEM(status, minutes) {
    const est = [[10, '99212'], [20, '99213'], [30, '99214'], [40, '99215']];
    const nw = [[15, '99202'], [30, '99203'], [45, '99204'], [60, '99205']];
    const t = status === 'new' ? nw : est;
    let code = null;
    t.forEach(([m, c]) => { if (minutes >= m) code = c; });
    const top = status === 'new' ? 75 : 55; // CPT prolonged threshold
    const medTop = status === 'new' ? 89 : 69;
    const res = { code, prolongedCPT: 0, prolongedMedicare: 0 };
    if (minutes >= top) res.prolongedCPT = Math.floor((minutes - top) / 15) + 1;
    if (minutes >= medTop) res.prolongedMedicare = Math.floor((minutes - medTop) / 15) + 1;
    return res;
  }

  /* MDM: p, d, r each 0..3 (0 straightforward, 1 low, 2 moderate, 3 high). Level = 2 of 3. */
  function mdmLevel(p, d, r) {
    const s = [p, d, r].sort((a, b) => b - a);
    return s[1];
  }
  const EM_BY_LEVEL = { new: ['99202', '99203', '99204', '99205'], est: ['99212', '99213', '99214', '99215'] };

  CI.engine = { inspect, applyFix, matchCptDx, cptsForDx, supportingDx, timeEM, mdmLevel, EM_BY_LEVEL, normDx, fmtDx, normCpt, famMatch };
  if (typeof module !== 'undefined' && module.exports) module.exports = CI;
})(typeof window !== 'undefined' ? window : globalThis);
