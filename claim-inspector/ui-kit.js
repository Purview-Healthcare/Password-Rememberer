/* Icons (inline SVG, stroke-based), short rule titles, and one-click visit templates. */
(function (root) {
  'use strict';
  const CI = (root.CI = root.CI || {});
  const P = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  CI.ICON = {
    home: P('<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>'),
    inspect: P('<path d="M9 3h6l1 2h3v16H5V5h3z"/><circle cx="11.5" cy="13" r="3"/><path d="m14 15.5 2.5 2.5"/>'),
    batch: P('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/><path d="m17 16 2 2 4-4"/>'),
    match: P('<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>'),
    em: P('<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>'),
    mod: P('<path d="M20 12l-8 8-9-9V4h7z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
    capture: P('<path d="M4 7V4h3"/><path d="M20 7V4h-3"/><path d="M4 17v3h3"/><path d="M20 17v3h-3"/><path d="m8 12 3 3 5-6"/>'),
    prev: P('<path d="M12 21s-7-4.4-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.6-7 11-7 11z"/>'),
    programs: P('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="m9 15 2 2 4-4"/>'),
    denials: P('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
    codes: P('<path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m14 4-4 16"/>'),
    ref: P('<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h12"/>'),
    error: P('<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6"/><path d="m15 9-6 6"/>'),
    warn: P('<path d="M12 3 2 20h20z"/><path d="M12 9v5"/><path d="M12 17h.01"/>'),
    info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'),
    ok: P('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    fix: P('<path d="m14 4 6 6-10 10H4v-6z"/><path d="m12 6 6 6"/>'),
    dollar: P('<path d="M12 2v20"/><path d="M17 6.5A4 4 0 0 0 13 4h-2a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2a4 4 0 0 1-4-2.5"/>'),
    user: P('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    sick: P('<path d="M9 3h6v6l4 9a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3z"/><path d="M8 13h8"/>'),
    physical: P('<path d="M6 3v6a6 6 0 0 0 12 0V3"/><path d="M12 15v3a3 3 0 0 0 6 0v-2"/><circle cx="18" cy="14" r="2"/>'),
    inject: P('<path d="m17 3 4 4"/><path d="m19 5-9 9"/><path d="m13 7 4 4"/><path d="m6 12 6 6-4 4H4v-4z"/>'),
    vaccine: P('<path d="M12 2v4"/><path d="M8 6h8"/><rect x="9" y="6" width="6" height="14" rx="2"/><path d="M9 11h6"/><path d="M9 15h6"/>'),
    tele: P('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>'),
    skin: P('<circle cx="12" cy="12" r="8"/><circle cx="10" cy="10" r="1.5"/><path d="m14 14 .5.5"/>'),
    awv: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    peds: P('<circle cx="12" cy="9" r="4"/><path d="M6 21a6 6 0 0 1 12 0"/><path d="M12 2v3"/>'),
    search: P('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    arrow: P('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>')
  };

  /* Short, scannable titles for rule IDs; the long message becomes the "why". */
  CI.RULE_TITLE = {
    'CLM-001': 'No service lines', 'CLM-002': 'No diagnosis', 'CLM-003': 'Too many diagnoses', 'CLM-004': 'Future date of service', 'CLM-005': 'Filing deadline approaching', 'CLM-006': 'Past timely-filing limit',
    'DX-001': 'Invalid diagnosis code', 'DX-002': 'Bad ICD-10 format', 'DX-003': 'Diagnosis needs more digits', 'DX-004': 'Unknown diagnosis code', 'DX-005': 'Unspecified diagnosis', 'DX-006': 'Risk-adjusting diagnosis', 'DX-007': 'Diagnosis vs patient sex', 'DX-008': 'Perinatal code, older patient', 'DX-009': 'Child exam code on adult', 'DX-010': 'Adult exam code on child', 'DX-011': 'Newborn exam code', 'DX-012': 'BMI code listed first', 'DX-013': 'Secondary-only code listed first', 'DX-014': 'Duplicate diagnosis', 'DX-015': 'Abnormal finding not coded', 'DX-016': 'Z00.00 with a problem dx',
    'CPT-001': 'Bad CPT format', 'CPT-002': 'Unknown procedure code', 'PTR-001': 'Missing diagnosis pointer', 'PTR-002': 'Too many pointers', 'PTR-003': 'Pointer to missing dx', 'UNT-001': 'Bad units', 'UNT-002': 'E/M units must be 1', 'UNT-003': 'ECG units', 'UNT-004': 'Too many 96127 units', 'UNT-005': 'Venipuncture units',
    'MOD-001': 'Too many modifiers', 'MOD-002': 'Invalid modifier', 'MOD-003': 'Unusual modifier', 'MOD-004': '59 and X modifier together', 'MOD-005': '50 with RT/LT', 'MOD-006': '26 with TC', 'MOD-007': 'Modifier 25 on wrong line', 'MOD-008': 'Telehealth modifier with POS 11', 'MOD-009': 'Telehealth modifier missing', 'MOD-010': 'Add modifier 25 (preventive + problem)', 'MOD-011': 'Check 25 documentation', 'MOD-012': 'Add modifier 25 (AWV + problem)', 'MOD-013': 'Add modifier 25 (procedure + E/M)', 'MOD-014': 'Check 25 documentation', 'MOD-015': 'E/M and procedure share a dx', 'MOD-016': 'Modifier 25 for injection visit', 'MOD-017': 'Modifier 25 with vaccine',
    'POS-001': 'Office E/M in facility POS', 'POS-002': 'Hospital E/M in office POS', 'POS-003': 'Nursing facility POS expected', 'POS-004': 'Home visit POS expected', 'POS-005': 'Split ECG in facility', 'POS-006': 'Hospital outpatient rate',
    'AGE-001': 'Code outside patient age', 'SEX-001': 'Sex-specific service', 'BND-001': 'Bundled service - drop it', 'NEW-001': 'New-patient code on established patient', 'NEW-002': 'Established code on new patient', 'NEW-003': '99211 on new patient', 'LAB-001': 'Add QW (waived test)', 'LAB-002': 'QW not needed', 'NEC-001': 'Diagnosis does not support service', 'VAC-001': 'Vaccine needs Z23',
    'EM-001': 'Two office E/Ms same day', 'EM-002': 'Two preventive visits', 'EM-003': 'Two hospital E/Ms', 'EM-004': '99417 without 99205/99215', 'EM-005': 'G2212 without 99205/99215', 'EM-006': 'G2212 is Medicare-only', 'EM-007': 'Medicare uses G2212, not 99417', 'EM-008': '99211 with vaccine only',
    'G22-001': 'G2211 needs an office E/M', 'G22-002': 'G2211 is Medicare-focused', 'G22-003': 'G2211 not paid with modifier 25',
    'AWV-001': 'Two wellness codes', 'AWV-002': 'AWV + physical same day', 'AWV-003': 'G0444 not with initial AWV/IPPE', 'AWV-004': 'Add 33 to ACP with AWV', 'MCR-001': 'Medicare does not cover physicals', 'MCR-002': 'Medicare-only code', 'MCR-003': 'Under-65 Medicare',
    'DRG-001': 'Drug without administration', 'DRG-002': 'J3301 units / NDC', 'DRG-003': 'NDC and JW/JZ', 'DRG-004': 'IUD device not billed', 'DRG-005': 'Implant device not billed',
    'VAC-002': 'Vaccine without administration', 'VAC-003': 'Administration without vaccine', 'VAC-004': 'Medicare flu admin is G0008', 'VAC-005': 'Medicare pneumo admin is G0009', 'VAC-006': 'Medicare hep B admin is G0010', 'VAC-007': 'G0008 without flu vaccine', 'VAC-008': 'G-admin codes are Medicare-only', 'VAC-009': 'Consider 90460 (counseling)', 'VAC-010': '90461 needs 90460', 'VAC-011': '90460 is for age 18 and under', 'VAC-012': '96372 is not for vaccines',
    'CNS-001': '99406 + 99407 together', 'CNS-002': '99408 + 99409 together', 'CNS-003': 'Modifier 25 with counseling', 'CNS-004': 'Medicare depression screen is G0444', 'CNS-005': 'Document tobacco minutes',
    'CCM-001': 'CCM prerequisites', 'CCM-002': 'TCM + CCM same month', 'TCM-001': 'TCM includes the visit', 'TCM-002': '99495 + 99496 together',
    'NCCI-001': 'Mutually exclusive pair', 'NCCI-002': 'Bundled pair - needs modifier', 'NCCI-003': 'Distinct-service modifier used', 'LAT-001': 'Add laterality (RT/LT/50)', 'INC-001': 'Incident-to rules (NP/PA)', 'INC-002': 'AWV by NP/PA',
    'TAX-001': 'No taxonomy entered', 'TAX-002': 'Unknown taxonomy', 'TAX-003': 'Group taxonomy as rendering', 'TAX-004': 'Patient younger than scope', 'TAX-005': 'Patient older than scope', 'TAX-006': 'Taxonomy sex scope', 'TAX-007': 'Obesity taxonomy, no weight dx', 'TAX-008': 'Sports taxonomy, no MSK dx', 'TAX-009': 'Geriatric taxonomy, pediatric code', 'TAX-DX': 'Diagnosis vs taxonomy scope'
  };

  /* One-click visit templates for the Inspector. */
  CI.TEMPLATES = [
    { id: 'sick', icon: 'sick', name: 'Sick visit', sub: 'Est. patient · 99213', c: { age: 45, sex: 'F', payer: 'commercial', status: 'est', pos: '11', dx: ['J06.9'], lines: [['99213', '', 'A']] } },
    { id: 'chronic', icon: 'user', name: 'Chronic follow-up', sub: 'DM + HTN · 99214 + A1c', c: { age: 58, sex: 'M', payer: 'commercial', status: 'est', pos: '11', dx: ['E11.65', 'I10', 'Z79.84'], lines: [['99214', '', 'AB'], ['83036', 'QW', 'A'], ['3052F', '', 'A']] } },
    { id: 'physical', icon: 'physical', name: 'Physical', sub: 'Adult preventive', c: { age: 40, sex: 'F', payer: 'commercial', status: 'est', pos: '11', dx: ['Z00.00'], lines: [['99396', '', 'A']] } },
    { id: 'physprob', icon: 'physical', name: 'Physical + problem', sub: '9939x + 9921x-25', c: { age: 52, sex: 'M', payer: 'commercial', status: 'est', pos: '11', dx: ['Z00.01', 'I10'], lines: [['99396', '', 'A'], ['99213', '25', 'B']] } },
    { id: 'awv', icon: 'awv', name: 'Medicare AWV', sub: 'G0439 + ACP + screens', c: { age: 72, sex: 'F', payer: 'medicare', status: 'est', pos: '11', dx: ['Z00.00', 'I10', 'E78.5'], lines: [['G0439', '', 'A'], ['99497', '33', 'A'], ['G0444', '', 'A'], ['G0136', '', 'A']] } },
    { id: 'inject', icon: 'inject', name: 'Joint injection', sub: '20610 + Kenalog', c: { age: 66, sex: 'F', payer: 'medicare', status: 'est', pos: '11', dx: ['M17.11'], lines: [['99213', '25', 'A'], ['20610', 'RT', 'A'], ['J3301', '', 'A', 4]] } },
    { id: 'vacc', icon: 'vaccine', name: 'Vaccine only', sub: 'Nurse visit · flu', c: { age: 35, sex: 'M', payer: 'commercial', status: 'est', pos: '11', dx: ['Z23'], lines: [['90686', '', 'A'], ['90471', '', 'A']] } },
    { id: 'peds', icon: 'peds', name: 'Well child + shots', sub: '9939x + 90460', c: { age: 4, sex: 'F', payer: 'medicaid', status: 'est', pos: '11', dx: ['Z00.129', 'Z23'], lines: [['99392', '', 'A'], ['90700', '', 'B'], ['90460', '', 'B'], ['90461', '', 'B', 2]] } },
    { id: 'tele', icon: 'tele', name: 'Telehealth', sub: 'Video · POS 10 + 95', c: { age: 29, sex: 'F', payer: 'commercial', status: 'est', pos: '10', dx: ['F41.1'], lines: [['99214', '95', 'A']] } },
    { id: 'skin', icon: 'skin', name: 'Skin procedure', sub: 'Biopsy + E/M-25', c: { age: 61, sex: 'M', payer: 'commercial', status: 'est', pos: '11', dx: ['D48.5', 'L57.0'], lines: [['99213', '25', 'B'], ['11102', '', 'A'], ['17000', '', 'B']] } },
    { id: 'tcm', icon: 'programs', name: 'Post-discharge TCM', sub: '99495', c: { age: 74, sex: 'M', payer: 'medicare', status: 'est', pos: '11', dx: ['I50.22', 'N18.32', 'I13.0'], lines: [['99495', '', 'ABC']] } },
    { id: 'blank', icon: 'codes', name: 'Blank claim', sub: 'Start from scratch', c: null }
  ];
})(typeof window !== 'undefined' ? window : globalThis);

/* Provider profile: service catalogue + specialty presets. */
(function (root) {
  'use strict';
  const CI = (root.CI = root.CI || {});
  const inG = (g, c) => (CI.G[g] || []).indexOf(c) >= 0;
  const cat = (c) => (CI.CPT[c] || {}).cat;
  const fam = (c, f) => ((CI.CPT[c] || {}).fam || []).indexOf(f) >= 0;
  /* Each service: id, label, icon, hint, and a test(code) => does this code belong to the service. Codes matching no service are "core" (E/M etc.) and always allowed. */
  CI.SERVICES = [
    { id: 'office', label: 'Office visits (E/M)', icon: 'user', core: true, test: (c) => inG('em', c) || c === 'G2211' || c === '99417' || c === 'G2212' },
    { id: 'preventive', label: 'Physicals / well visits', icon: 'physical', test: (c) => inG('prevAll', c) || /^9940[1-4]$/.test(c) },
    { id: 'awv', label: 'Medicare AWV / IPPE', icon: 'awv', test: (c) => inG('awv', c) || ['G0444', 'G0442', 'G0443', 'G0447', 'G0136', '99497', '99498', '99483'].includes(c) },
    { id: 'peds', label: 'Pediatrics', icon: 'peds', test: (c) => ['96110', '96161', '99173', '92551', '99188', '90460', '90461'].includes(c) || /^9938[1-4]$|^9939[1-4]$/.test(c) },
    { id: 'vaccines', label: 'Vaccines', icon: 'vaccine', test: (c) => cat(c) === 'Vaccine' },
    { id: 'poclab', label: 'In-office (CLIA-waived) labs', icon: 'match', test: (c) => cat(c) === 'Lab' && c !== '36415' && c !== '36416' && !['88142', '88175', '87624', '88305', '81528', 'G0123', 'G0328', '87086', '86701', '86803', '87389', '87491', '87591', '84443', '85025', '80053', '80048', '80061', '82465', '82947'].includes(c) },
    { id: 'draw', label: 'Blood draw / send-out labs', icon: 'inject', test: (c) => ['36415', '36416', '84443', '85025', '80053', '80048', '80061', '82465', '82947', '87086', '86701', '86803', '87389', '87491', '87591', '81528', 'G0328', '87624', '88142', '88175', 'G0123'].includes(c) },
    { id: 'inject', label: 'Joint / trigger-point injections', icon: 'inject', test: (c) => /^20(5[5]|6[0-1])\d$/.test(c) || fam(c, 'inj') && cat(c) === 'Drug' },
    { id: 'imshots', label: 'Therapeutic injections / infusions', icon: 'inject', test: (c) => ['96372', '96365', '96374', 'J3420', 'J0696', 'J1885', 'J1100', 'J2550', 'J1050'].includes(c) },
    { id: 'skin', label: 'Skin procedures (biopsy, lesion, wart)', icon: 'skin', test: (c) => /^11[0-9]{3}$/.test(c) && !/^1198[1-3]$/.test(c) && !/^117(19|20|21|30|65)$/.test(c) || /^17[0-9]{3}$/.test(c) || /^1(0060|0061|0120)$/.test(c) },
    { id: 'wound', label: 'Laceration repair / wound care', icon: 'sick', test: (c) => /^12[0-9]{3}$/.test(c) || c === '17250' },
    { id: 'foot', label: 'Nail / foot care', icon: 'skin', test: (c) => /^117(19|20|21|30|65)$/.test(c) || /^1105[5-7]$/.test(c) },
    { id: 'msk', label: 'Splints, strapping, MSK imaging', icon: 'em', test: (c) => /^29[0-9]{3}$/.test(c) || /^7(2100|3030|3560|3610|6881|6882)$/.test(c) },
    { id: 'ent', label: 'Ear / nose procedures', icon: 'sick', test: (c) => ['69200', '69210', '30901'].includes(c) },
    { id: 'cardio', label: 'ECG / ambulatory BP', icon: 'em', test: (c) => ['93000', '93005', '93010', '93784'].includes(c) },
    { id: 'pulm', label: 'Spirometry / nebulizer', icon: 'capture', test: (c) => ['94010', '94060', '94640', '94664', '94760', '94761', '71045', '71046', 'J7613'].includes(c) },
    { id: 'womens', label: "Women's health (Pap, IUD, implant, contraception)", icon: 'prev', test: (c) => ['58300', '58301', 'Q0091', 'G0101', '11981', '11982', '11983', 'J7296', 'J7297', 'J7298', 'J7300', 'J7307', '77067', '77080'].includes(c) },
    { id: 'ob', label: 'Obstetrics', icon: 'prev', test: (c) => cat(c) === 'OB' },
    { id: 'gu', label: 'Bladder scan / catheter', icon: 'sick', test: (c) => ['51701', '51798'].includes(c) },
    { id: 'gi', label: 'Hemorrhoid / minor GI', icon: 'sick', test: (c) => ['46083'].includes(c) },
    { id: 'us', label: 'Point-of-care ultrasound', icon: 'match', test: (c) => ['76536', '76705', '76881', '76882', '20604', '20606', '20611'].includes(c) },
    { id: 'behav', label: 'Behavioral screening & counseling', icon: 'programs', test: (c) => ['96127', '96160', '99406', '99407', '99408', '99409', '99401', '99402', '99403', '99404', 'G8431', 'G8510'].includes(c) },
    { id: 'ccm', label: 'Care management (CCM / PCM / APCM / TCM)', icon: 'programs', test: (c) => /^994(9[0-9]|8[4-9]|3[7-9]|2[4-7])$/.test(c) || /^G055[6-8]$/.test(c) },
    { id: 'rpm', label: 'Remote monitoring (RPM)', icon: 'tele', test: (c) => /^9945[3-8]$/.test(c) },
    { id: 'bhi', label: 'Behavioral health integration / CoCM', icon: 'programs', test: (c) => ['99484', '99492', '99493', '99494'].includes(c) },
    { id: 'tele', label: 'Telehealth / virtual', icon: 'tele', test: (c) => ['99421', '99422', '99423', '98016', 'G2012'].includes(c) },
    { id: 'hospital', label: 'Hospital rounding', icon: 'programs', test: (c) => inG('hospital', c) },
    { id: 'snf', label: 'Nursing facility / home visits', icon: 'home', test: (c) => inG('nf', c) || inG('home', c) },
    { id: 'quality', label: 'Quality (CPT II) reporting', icon: 'denials', core: true, test: (c) => cat(c) === 'Quality' }
  ];
  CI.serviceOf = function (code) { code = String(code || '').toUpperCase(); return CI.SERVICES.filter((s) => s.test(code)).map((s) => s.id); };
  CI.SPECIALTIES = {
    fm: { label: 'Family Medicine', taxonomy: '207Q00000X', ageMin: 0, ageMax: 120, services: ['office', 'preventive', 'awv', 'peds', 'vaccines', 'poclab', 'draw', 'inject', 'imshots', 'skin', 'wound', 'ent', 'cardio', 'pulm', 'womens', 'behav', 'ccm', 'tele', 'quality'] },
    im: { label: 'Internal Medicine', taxonomy: '207R00000X', ageMin: 18, ageMax: 120, services: ['office', 'preventive', 'awv', 'vaccines', 'poclab', 'draw', 'inject', 'imshots', 'cardio', 'pulm', 'behav', 'ccm', 'rpm', 'tele', 'hospital', 'quality'] },
    peds: { label: 'Pediatrics', taxonomy: '208000000X', ageMin: 0, ageMax: 21, services: ['office', 'preventive', 'peds', 'vaccines', 'poclab', 'draw', 'wound', 'ent', 'pulm', 'behav', 'tele', 'quality'] },
    np: { label: 'Family NP / PA', taxonomy: '363LF0000X', ageMin: 0, ageMax: 120, services: ['office', 'preventive', 'awv', 'peds', 'vaccines', 'poclab', 'draw', 'imshots', 'wound', 'ent', 'behav', 'ccm', 'tele', 'quality'] },
    geri: { label: 'Geriatrics', taxonomy: '207QG0300X', ageMin: 50, ageMax: 120, services: ['office', 'awv', 'vaccines', 'poclab', 'draw', 'imshots', 'cardio', 'behav', 'ccm', 'rpm', 'tele', 'snf', 'quality'] }
  };
  CI.blankProfile = () => ({ name: '', credential: 'MD', npi: '', groupNpi: '', specialty: 'fm', taxonomy: '207Q00000X', clia: '', pos: '11', payers: ['commercial', 'medicare', 'medicaid'], telehealth: true, services: CI.SPECIALTIES.fm.services.slice(), favCpt: ['99213', '99214', '99396', '90471', '36415'], favDx: ['I10', 'E11.9', 'E78.5', 'Z00.00', 'J06.9'], favMods: ['25', 'QW', '95'], notes: '' });
  /* NPI check digit: Luhn over '80840' + 10 digits. */
  CI.validNPI = function (n) {
    n = String(n || '').replace(/\D/g, ''); if (n.length !== 10) return false;
    const s = '80840' + n; let sum = 0;
    for (let i = s.length - 1, alt = false; i >= 0; i--, alt = !alt) { let d = +s[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; }
    return sum % 10 === 0;
  };
})(typeof window !== 'undefined' ? window : globalThis);
(function (root) { const CI = root.CI; Object.assign(CI.RULE_TITLE, { 'PRO-001': 'NPI fails check digit', 'PRO-002': 'Service not in provider profile', 'PRO-003': 'No CLIA on file for in-office lab', 'PRO-004': 'Telehealth not offered by provider', 'PRO-005': 'Age outside specialty range', 'PRO-006': 'Payer not in provider setup' });
  CI.ICON.setup = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
})(typeof window !== 'undefined' ? window : globalThis);
(function (root) { Object.assign(root.CI.RULE_TITLE, { 'PRO-007': 'Unknown provider code in label' }); })(typeof window !== 'undefined' ? window : globalThis);
