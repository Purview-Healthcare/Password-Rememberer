/* Modifiers, provider taxonomies, places of service, and the modifier decision tree. */
(function (root) {
  'use strict';
  const CI = (root.CI = root.CI || {});

  /* [code, short name, applies to, what it means / when, documentation, payer notes] */
  const MODS = [
    ['25', 'Significant, separately identifiable E/M', 'E/M on the same day as a procedure, preventive visit or vaccine', 'The problem-oriented E/M goes beyond the usual pre-/post-procedure work (decision for minor procedure is included in the procedure). Append to the E/M, not the procedure.', 'Separate HPI/assessment/plan for a problem distinct from (or beyond) the procedure indication. Do not just copy the procedure note.', 'Most-audited modifier. Medicare and many commercial payers reduce or review E/M-25. Do not append when nothing else was billed.'],
    ['24', 'Unrelated E/M during postoperative period', 'E/M by the same physician during a 10/90-day global', 'Visit for a condition unrelated to the surgery.', 'Document the unrelated problem and dx.', 'Use an unrelated dx on the line. Minor procedure globals (0/10 days) apply.'],
    ['57', 'Decision for surgery', 'E/M the day before or day of a major (90-day) procedure', 'The E/M led to the decision to perform major surgery.', 'Document the decision-making.', 'Rare in family medicine; applies to major procedures (e.g., OB delivery) only.'],
    ['59', 'Distinct procedural service', 'Procedures that NCCI bundles', 'Different session, site/organ, lesion, injury, or separate encounter. Last resort: prefer X{E,P,S,U}.', 'Document site/lesion/time clearly.', 'Overuse draws audits. Use only when an NCCI edit has modifier indicator 1.'],
    ['XE', 'Separate encounter', 'Bundled pairs on the same day', 'Service performed during a separate encounter.', 'Document different time/encounter.', 'More specific than 59; payer must accept X{EPSU}.'],
    ['XS', 'Separate structure', 'Bundled pairs', 'Different organ/structure (e.g., injection of a different joint).', 'Document the distinct structure.', 'More specific than 59.'],
    ['XP', 'Separate practitioner', 'Bundled pairs', 'Performed by a different practitioner.', '', ''],
    ['XU', 'Unusual non-overlapping service', 'Bundled pairs', 'Use when no other X modifier fits.', '', ''],
    ['33', 'Preventive services', 'Commercial plans: USPSTF A/B services where cost-sharing must be waived; Medicare: ACP in AWV', 'Service is preventive under ACA and should have no patient cost share even though CPT code is not an obvious preventive code.', 'Link to screening dx (Z-code) where required.', 'Medicare uses modifier 33 for ACP 99497 delivered with an AWV. Some payers want PT for screening that turns diagnostic.'],
    ['PT', 'Colorectal screening turned diagnostic/therapeutic', 'Colonoscopy/ FIT-DNA follow-up', 'Screening test with findings that required a diagnostic/therapeutic procedure.', '', 'Colorectal screening cost-share waiver (Medicare/ACA).'],
    ['50', 'Bilateral procedure', 'Procedures done on both sides in one session', 'Bilateral services: report once with 50 and units 1 (many payers), or RT/LT on two lines.', 'Document both sides and indication.', 'Medicare: 50 on one line, 1 unit, charge both sides. Verify per payer.'],
    ['RT', 'Right side', 'Paired anatomy', 'Procedure on right side.', '', 'Use when a code is not bilateral by definition.'],
    ['LT', 'Left side', 'Paired anatomy', 'Procedure on left side.', '', ''],
    ['F1', 'Left hand, 2nd digit', 'Hand/finger procedures', 'Digit modifiers: F1-F4 (left 2-5), F5-F9 (right 1-5), FA (left thumb).', '', 'Trigger-finger injections, nail procedures, I&D.'],
    ['TA', 'Left foot, great toe', 'Foot/toe procedures', 'Toe modifiers: TA, T1-T5 (left 2-5), T6-T9 (right 2-5), TA/T5 (right great toe).', '', 'Nail debridement, ingrown nail.'],
    ['51', 'Multiple procedures', 'Different procedures at same session', 'Report on second and subsequent procedures. Many payers apply multiple-procedure reduction automatically - do not append unless payer asks.', '', ''],
    ['52', 'Reduced services', 'Procedures partially performed', 'Service reduced by physician election.', 'Explain the reduction.', ''],
    ['53', 'Discontinued procedure', 'Procedure stopped for patient safety', 'Procedure started but not completed due to threat to well-being.', '', 'Use sparingly (outpatient facility uses 73/74).'],
    ['76', 'Repeat procedure, same physician', 'Same procedure repeated same day', 'Repeat service by the same practitioner.', 'Document medical reason.', ''],
    ['77', 'Repeat procedure, different physician', 'Same procedure repeated same day', 'Repeat by a different practitioner.', '', ''],
    ['91', 'Repeat clinical diagnostic lab test', 'Lab', 'Repeat the same test the same day to obtain subsequent results (e.g., serial troponin, glucose tolerance).', 'Document the clinical reason.', 'Not for replicate/confirm of questionable results.'],
    ['QW', 'CLIA-waived test', 'Lab (point-of-care)', 'Test performed under a CLIA certificate of waiver.', 'CLIA certificate number in box 23.', 'Medicare/Medicaid and many commercials require it on non-exempt waived tests (e.g., A1c 83036, strep 87880, flu 87804, COVID Ag 87811, 81003).'],
    ['90', 'Reference (outside) lab', 'Lab', 'Test performed by an outside lab billed by the practice (rare).', '', 'Practice must be billing for the outside lab service.'],
    ['26', 'Professional component', 'Diagnostic tests (ECG interpretation, imaging)', 'Physician interpretation only.', 'Signed interpretation/report.', 'Use when equipment is owned by hospital or independent facility.'],
    ['TC', 'Technical component', 'Diagnostic tests', 'Equipment, supplies, technician only.', '', 'Do not use TC and 26 on the same line. Global (no modifier) = both.'],
    ['95', 'Synchronous telemedicine (audio + video)', 'E/M via telehealth', 'Real-time interactive audio-video encounter.', 'Document patient location, provider location, consent, modality, participants.', 'Required by many commercial payers. Medicare requirements depend on the current telehealth flexibilities and POS 02/10 - verify.'],
    ['93', 'Synchronous audio-only telemedicine', 'E/M via telephone', 'Audio-only encounter.', 'Document why video was not used, consent, time.', 'Medicare allows audio-only in some circumstances (mental health, some flexibilities).'],
    ['GT', 'Telehealth (interactive A/V)', 'Legacy telehealth', 'Older telehealth modifier; some Medicaid/Critical-access plans.', '', 'Many payers replaced GT with 95.'],
    ['FQ', 'Mental health service furnished using audio-only', 'Mental health E/M', 'Medicare audio-only mental health.', '', ''],
    ['GQ', 'Asynchronous telehealth', 'Store-and-forward', 'Asynchronous telecommunications system.', '', 'Federal demo programs.'],
    ['GA', 'Waiver of liability on file (ABN)', 'Medicare services that may not be reasonable and necessary', 'ABN signed by patient: may be denied, patient is liable.', 'ABN (CMS-R-131) in chart before service.', 'Use for denials expected due to medical necessity or frequency limits.'],
    ['GX', 'Voluntary notice of liability (non-covered by statute)', 'Medicare statutory exclusions', 'Voluntary notice for services that are never covered.', '', 'Optional notification; secondary payer may require.'],
    ['GY', 'Item/service statutorily excluded', 'Medicare noncovered services (e.g., routine physical 99397, cosmetic)', 'Service is excluded by statute - denial is expected so patient is billed.', 'Patient informed in advance.', 'Prevents Medicare from reviewing medical necessity; generates a CO-96 denial the patient owes.'],
    ['GZ', 'Expected denial - no ABN signed', 'Medicare', 'No ABN on file but you expect denial; practice liable.', '', 'Use only when you know service will not be covered.'],
    ['AI', 'Principal physician of record', 'Medicare initial hospital care', 'Admitting physician for hospital initial care.', '', 'Initial hospital care only.'],
    ['AS', 'Non-physician assistant at surgery', 'Assistant at surgery by PA/NP/CNS', '', '', ''],
    ['SA', 'Nurse practitioner rendering in collaboration with physician', 'NP services (specific payers)', '', '', 'Rarely required; check payer.'],
    ['FS', 'Split (or shared) E/M visit', 'Facility-based E/M shared between physician and NPP', '', '', 'Facility setting only - not office incident-to.'],
    ['EP', 'EPSDT service (Medicaid)', 'Child health screening / well-child', 'Service provided as part of Medicaid EPSDT program.', '', 'State Medicaid dependent; often needed with preventive visits and immunizations.'],
    ['TJ', 'Program group, child and/or adolescent', 'Medicaid', '', '', 'State dependent.'],
    ['SE', 'State and/or federally funded programs', 'Medicaid', '', '', 'State dependent.'],
    ['U1', 'Medicaid level of care 1', 'State Medicaid', '', '', 'State-defined modifier. Check your state manual.'],
    ['KX', 'Requirements specified in policy met', 'DME/therapy/some Medicare services', 'Documentation criteria in LCD/NCD met.', '', ''],
    ['Q7', 'One Class A finding (podiatry routine foot care)', 'Nail debridement', 'Medicare class findings for foot care.', '', 'Q7 / Q8 / Q9 with 11720/11721 and a systemic condition.'],
    ['Q8', 'Two Class B findings', 'Nail debridement', '', '', ''],
    ['Q9', 'One Class B and two Class C findings', 'Nail debridement', '', '', ''],
    ['TS', 'Follow-up service', 'Medicaid/Medicare therapy', '', '', ''],
    ['AF', 'Specialty physician', 'Medicare', 'Specialty physician identifier (rare).', '', ''],
    ['KH', 'DMEPOS item, initial claim', 'DMEPOS', '', '', 'Not typical in FM.'],
    ['CS', 'Cost-sharing waived (COVID-19 testing)', 'COVID-19 testing related visits', 'Cost sharing waived for COVID-19 testing-related services.', '', 'Public health emergency era; verify current status.'],
    ['SC', 'Medically necessary service or supply', 'Medicare', '', '', ''],
    ['SL', 'State-supplied vaccine', 'Vaccines', 'Vaccine supplied by state (VFC) - product code billed at $0 admin only.', '', 'VFC/state programs: bill admin only; product code with SL, charge may be $0.']
  ];
  CI.MODS = MODS.map(function (m) { return { code: m[0], name: m[1], applies: m[2], meaning: m[3], doc: m[4], payer: m[5] }; });
  CI.MODMAP = {};
  CI.MODS.forEach(function (m) { CI.MODMAP[m.code] = m; });

  /* Modifier decision tree. Each node: q (question), a: [{t: label, next|result}] */
  CI.TREE = {
    start: { q: 'What are you billing on the same day?', a: [
      { t: 'E/M visit together with a procedure (injection, biopsy, wart removal, laceration, etc.)', next: 'emproc' },
      { t: 'Preventive visit AND a problem addressed (e.g., physical + HTN follow-up)', next: 'prevprob' },
      { t: 'Vaccine given at a problem or preventive visit', next: 'vaccem' },
      { t: 'Two procedures that payer bundles (edit denies the second)', next: 'bundle' },
      { t: 'Procedure on both sides (knees, ears, shoulders)', next: 'bilat' },
      { t: 'Telehealth visit', next: 'tele' },
      { t: 'In-office lab test (rapid strep, A1c, flu swab)', next: 'lab' },
      { t: 'Medicare service that may not be covered', next: 'abn' },
      { t: 'Visit within the global period of a prior procedure', next: 'postop' }
    ] },
    emproc: { q: 'Did you evaluate and manage a significant problem BEYOND the decision to do the procedure (new complaint, chronic disease management, work-up)?', a: [
      { t: 'Yes - separate documented problem and MDM', result: { mod: '25', on: 'E/M line', why: 'Significant, separately identifiable E/M. Use a different dx pointer for the E/M when possible and make sure the note supports it.' } },
      { t: 'No - the visit was only for the procedure', result: { mod: 'none', on: '', why: 'Bill only the procedure. The decision to perform a minor procedure is included in the procedure payment. Adding an E/M-25 here risks a denial / audit.' } }
    ] },
    prevprob: { q: 'Was the problem significant enough to require work beyond the preventive visit (assessment/plan, Rx management, new work-up)?', a: [
      { t: 'Yes', result: { mod: '25', on: 'Problem-oriented E/M (9921x)', why: 'Bill preventive code (9938x/9939x) plus a problem-oriented E/M with 25. Link the problem dx to the E/M line and Z00.01 or Z00.00 to the preventive line. Patient may owe copay for the problem E/M.' } },
      { t: 'No - just reviewed existing stable conditions (refills, quick check)', result: { mod: 'none', on: '', why: 'Include in preventive visit. Z00.01 if an abnormal finding is documented. Do not unbundle a 99213 for routine review of meds.' } }
    ] },
    vaccem: { q: 'Is the E/M a separate, billable evaluation (not just discussing the vaccine)?', a: [
      { t: 'Yes - patient was seen for a problem or preventive exam', result: { mod: '25', on: 'E/M line', why: 'Bill vaccine product + admin (90471/90460/G0008) + E/M-25 only if the visit was separately identifiable. Admin and product need Z23.' } },
      { t: 'No - nurse visit just for the shot', result: { mod: 'none', on: '', why: 'Bill product + admin only. 99211 is usually not payable with vaccine admin unless significant, separately identifiable.' } }
    ] },
    bundle: { q: 'Is there an NCCI edit with modifier indicator "1" and are the two procedures truly distinct (different site, lesion, session or injury)?', a: [
      { t: 'Yes, different site/structure (e.g., two different joints, two lesions in different areas)', result: { mod: 'XS (or 59)', on: 'Second (component) procedure', why: 'Use the most specific X modifier; fall back to 59 only if payer does not accept XS. Document site/laterality for each.' } },
      { t: 'Yes, different session on the same day', result: { mod: 'XE (or 59)', on: 'Second procedure', why: 'Separate encounter - document time and reason for return.' } },
      { t: 'Yes, different practitioner', result: { mod: 'XP (or 59)', on: 'Second procedure', why: '' } },
      { t: 'No - same site/lesion or the edit indicator is 0', result: { mod: 'none', on: '', why: 'No modifier will bypass the edit. Bill only the comprehensive code or one of the codes.' } }
    ] },
    bilat: { q: 'Does the CPT descriptor already say "bilateral" or "unilateral or bilateral"?', a: [
      { t: 'Yes - descriptor includes both sides', result: { mod: 'none', on: '', why: 'Do not append 50/RT/LT. Bill once.' } },
      { t: 'No - unilateral code performed on both sides', result: { mod: '50 (or RT + LT)', on: 'Procedure line', why: 'Medicare: one line with 50 and 1 unit. Many commercial payers: two lines RT/LT with units 1 each. Verify payer. 69210 and 20610 are common FM examples.' } }
    ] },
    tele: { q: 'Was it real-time video or audio-only?', a: [
      { t: 'Real-time audio + video', result: { mod: '95', on: 'E/M line', why: 'POS 02 (patient not at home) or 10 (patient at home) is the standard for Medicare; many commercial payers instead want POS 11 + 95. Verify current Medicare telehealth flexibilities and payer policy.' } },
      { t: 'Audio-only (phone)', result: { mod: '93', on: 'E/M line', why: 'Audio-only is paid by a subset of payers/circumstances. Document why video was not used, consent and total time. FQ for Medicare audio-only mental health.' } }
    ] },
    lab: { q: 'Did you perform it in your own office using a CLIA-waived kit?', a: [
      { t: 'Yes', result: { mod: 'QW', on: 'Lab line', why: 'Add QW to non-exempt waived tests (A1c, strep, flu, COVID antigen, automated UA). Exempt from QW: 81002, 81025, 82270, 82272, 82962, 83026, 84830, 85013, 85651. List your CLIA certificate in box 23.' } },
      { t: 'No - collected only and sent to a lab', result: { mod: 'none', on: '', why: 'Bill 36415 (venipuncture) if payer allows; reference lab bills the test.' } }
    ] },
    abn: { q: 'Is Medicare likely to deny the service as not reasonable/necessary (or frequency limit)?', a: [
      { t: 'Yes, and patient signed an ABN', result: { mod: 'GA', on: 'Service line', why: 'Patient is liable if Medicare denies. Keep signed ABN in chart.' } },
      { t: 'Yes, and no ABN was signed', result: { mod: 'GZ', on: 'Service line', why: 'Practice is liable (no patient billing) if denied. Better to get an ABN beforehand.' } },
      { t: 'Never covered by statute (routine physical, cosmetic, hearing exam)', result: { mod: 'GY', on: 'Service line', why: 'Generates a denial that makes the patient responsible. A notice of non-coverage is still good practice (GX optional notice).' } }
    ] },
    postop: { q: 'Is the new problem unrelated to the original procedure?', a: [
      { t: 'Yes - unrelated dx', result: { mod: '24', on: 'E/M line', why: 'Unrelated E/M during postoperative period. Minor-procedure globals: 0 or 10 days.' } },
      { t: 'No - related follow-up/wound check', result: { mod: 'none', on: '', why: 'Included in the global package. Non-billable.' } }
    ] }
  };

  /* Provider taxonomy codes (NUCC). scope = patient age band the taxonomy implies; flags: pedsOnly/adultOnly/etc. */
  CI.TAX = {
    '207Q00000X': { name: 'Family Medicine (MD/DO)', kind: 'phys', medicare: '08 Family Practice', ageMin: 0, ageMax: 120, note: 'Broad scope. All ages, all organ systems; OB care if credentialed.' },
    '207QA0000X': { name: 'Family Medicine - Adolescent Medicine', kind: 'phys', medicare: '08', ageMin: 10, ageMax: 25, note: 'Adolescent/young adult focus.' },
    '207QA0505X': { name: 'Family Medicine - Adult Medicine', kind: 'phys', medicare: '08', ageMin: 16, ageMax: 120, note: 'Adult only - pediatric well visits will look out of scope.' },
    '207QB0002X': { name: 'Family Medicine - Obesity Medicine', kind: 'phys', medicare: '08', ageMin: 0, ageMax: 120, note: 'Subspecialty - expect E66/Z68/E11 dx.' },
    '207QG0300X': { name: 'Family Medicine - Geriatric Medicine', kind: 'phys', medicare: '38 Geriatric Medicine', ageMin: 50, ageMax: 120, note: 'Older adults - pediatric/adolescent services will look out of scope.' },
    '207QH0002X': { name: 'Family Medicine - Hospice & Palliative Medicine', kind: 'phys', medicare: '08/active', ageMin: 0, ageMax: 120, note: 'Expect serious illness dx, Z51.5, ACP.' },
    '207QS0010X': { name: 'Family Medicine - Sports Medicine', kind: 'phys', medicare: '08', ageMin: 5, ageMax: 120, note: 'MSK/injury dx dominate.' },
    '207QS1201X': { name: 'Family Medicine - Sleep Medicine', kind: 'phys', medicare: '08', ageMin: 0, ageMax: 120, note: 'Expect G47.- / sleep dx.' },
    '208D00000X': { name: 'General Practice', kind: 'phys', medicare: '01 General Practice', ageMin: 0, ageMax: 120, note: 'Pre-residency or non-board certified generalist.' },
    '207R00000X': { name: 'Internal Medicine (comparison)', kind: 'phys', medicare: '11 Internal Medicine', ageMin: 16, ageMax: 120, note: 'Internists see adults - pediatrics out of scope.' },
    '208000000X': { name: 'Pediatrics (comparison)', kind: 'phys', medicare: '37 Pediatric Medicine', ageMin: 0, ageMax: 21, note: 'Children/young adults - geriatric services out of scope.' },
    '363LF0000X': { name: 'Nurse Practitioner - Family', kind: 'npp', medicare: '50 Nurse Practitioner', ageMin: 0, ageMax: 120, note: 'Family NP scope is across the lifespan; check state collaborative rules and incident-to vs. direct billing.' },
    '363LA2200X': { name: 'Nurse Practitioner - Adult Health', kind: 'npp', medicare: '50', ageMin: 16, ageMax: 120, note: 'Adult NP - no pediatrics.' },
    '363LG0600X': { name: 'Nurse Practitioner - Gerontology', kind: 'npp', medicare: '50', ageMin: 50, ageMax: 120, note: 'Older adults.' },
    '363LP0200X': { name: 'Nurse Practitioner - Pediatrics', kind: 'npp', medicare: '50', ageMin: 0, ageMax: 21, note: 'Pediatric NP.' },
    '363LW0102X': { name: "Nurse Practitioner - Women's Health", kind: 'npp', medicare: '50', ageMin: 12, ageMax: 120, sex: 'F', note: "Women's health NP - female patients." },
    '363A00000X': { name: 'Physician Assistant', kind: 'npp', medicare: '97 Physician Assistant', ageMin: 0, ageMax: 120, note: 'Scope set by supervising physician and state. Bill under PA NPI (85%) or incident-to when criteria met.' },
    '363AM0700X': { name: 'Physician Assistant - Medical', kind: 'npp', medicare: '97', ageMin: 0, ageMax: 120, note: 'Medical PA in primary care.' },
    '261QP2300X': { name: 'Primary Care Clinic/Center (facility)', kind: 'fac', medicare: '70 / clinic', ageMin: 0, ageMax: 120, note: 'Facility/billing taxonomy. Rendering provider needs an individual taxonomy.' },
    '193200000X': { name: 'Multi-Specialty Group (billing)', kind: 'grp', medicare: '70', ageMin: 0, ageMax: 120, note: 'Billing entity taxonomy.' },
    '193400000X': { name: 'Single Specialty Group (billing)', kind: 'grp', medicare: '70', ageMin: 0, ageMax: 120, note: 'Billing entity taxonomy.' }
  };

  /* Dx chapters/ICD prefixes that deserve a second look when billed by a primary care provider. */
  CI.TAX_DX_WATCH = [
    { p: ['C'], sev: 'info', msg: 'Malignancy dx (C00-C96) as a treating diagnosis from primary care: confirm the practice is managing it (not oncology). For surveillance or history use Z08/Z85/Z12 codes. Bill routine care with the chronic comorbid dx.' },
    { p: ['O'], sev: 'info', msg: 'Pregnancy (O) dx: if the practice delivers, use the global OB package 59400; if not, bill 59425/59426 for 4+ antepartum visits or E/M with O dx. FM taxonomy is acceptable for OB only when credentialed.' },
    { p: ['P'], sev: 'warn', msg: 'Perinatal (P) dx codes apply to the newborn period/condition originating perinatally. Verify age and that FM/clinic is the managing provider.' },
    { p: ['Q'], sev: 'info', msg: 'Congenital anomaly (Q) dx: confirm specialist co-management; FM usually reports monitoring/referral.' },
    { p: ['F20', 'F25', 'F30', 'F31'], sev: 'info', msg: 'Serious mental illness dx: ok for primary care if medication management; check behavioral-health carve-out rules (some plans route to a BH network).' },
    { p: ['I21', 'I22', 'I63', 'I64'], sev: 'warn', msg: 'Acute MI/stroke dx in an office E/M: usually inpatient/ED. For follow-up use I25.2 (old MI) / Z86.73 / I69.-.' },
    { p: ['H'], sev: 'info', msg: 'Eye/ear dx: ok for minor problems (H61.2- cerumen, H10 conjunctivitis, H66 OM). Complex eye disease goes to ophthalmology.' },
    { p: ['Z3A'], sev: 'warn', msg: 'Z3A weeks of gestation must accompany an O-code; do not report alone.' }
  ];

  /* Places of service most relevant to family medicine. */
  CI.POS = [
    ['11', 'Office', 'Non-facility rate'],
    ['02', 'Telehealth - patient not at home', 'Facility rate (Medicare)'],
    ['10', 'Telehealth - patient at home', 'Non-facility rate (Medicare)'],
    ['12', 'Patient home', ''],
    ['13', 'Assisted living facility', ''],
    ['14', 'Group home', ''],
    ['15', 'Mobile unit', ''],
    ['19', 'Off-campus outpatient hospital', 'Facility rate'],
    ['20', 'Urgent care', ''],
    ['21', 'Inpatient hospital', 'Facility rate'],
    ['22', 'On-campus outpatient hospital', 'Facility rate'],
    ['23', 'Emergency room', 'Facility rate'],
    ['24', 'Ambulatory surgical center', 'Facility rate'],
    ['31', 'Skilled nursing facility', ''],
    ['32', 'Nursing facility', ''],
    ['33', 'Custodial care facility', ''],
    ['34', 'Hospice', ''],
    ['49', 'Independent clinic', ''],
    ['50', 'Federally qualified health center', 'FQHC billing differs (PPS)'],
    ['72', 'Rural health clinic', 'RHC billing differs (AIR)'],
    ['81', 'Independent laboratory', '']
  ];
})(typeof window !== 'undefined' ? window : globalThis);
