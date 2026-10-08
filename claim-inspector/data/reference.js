/* Reference content: RCM cycle, denials, programs, preventive schedules, charge capture, quality, filing rules. */
(function (root) {
  'use strict';
  const CI = (root.CI = root.CI || {});

  CI.RCM = [
    { id: 'sched', n: '01', t: 'Scheduling & pre-registration', owner: 'Front desk', goal: 'Right visit type, right payer, right provider - before the patient arrives.',
      tasks: ['Capture legal name, DOB, address, phone, insurance card (front/back) and photo ID', 'Book the correct visit type: new vs. established (3-year rule), AWV vs. physical, sick vs. chronic, procedure slot', 'Check referral/prior-auth need and in-network status of the rendering provider', 'Confirm if the visit is eligible for telehealth under the payer policy', 'Send intake forms, consent, HIPAA acknowledgement and (Medicare) ABN triggers'],
      pitfalls: ['Booking a "physical" for a Medicare patient (not covered) instead of an AWV', 'Scheduling a patient with a provider not credentialed with the payer', 'Missing secondary coverage / COB'], kpi: 'Insurance captured pre-visit: >98%' },
    { id: 'elig', n: '02', t: 'Eligibility & benefits', owner: 'Front desk / billing', goal: 'Know coverage, copay, deductible, visit limits and exclusions before the visit.',
      tasks: ['Run a 270/271 eligibility check 1-3 days before and again at check-in', 'Verify PCP assignment (HMO), copay for PCP vs. specialist vs. preventive, deductible remaining', 'Check frequency limits: AWV (11 full months), annual physical, mammogram, A1c, lipid, Pap/HPV', 'Identify Medicare Advantage vs. Original Medicare, Medicaid managed-care plan, and secondary/COB', 'Estimate patient responsibility and communicate it'],
      pitfalls: ['Eligibility checked once at scheduling and never again', 'Medicaid eligibility lapsed month-to-month', 'Primary vs. secondary payer reversed (MSP questionnaire)'], kpi: 'Eligibility denials (CO-27/CO-31/CO-109): <1%' },
    { id: 'checkin', n: '03', t: 'Check-in & point-of-service collection', owner: 'Front desk', goal: 'Collect what is owed at the time of service.',
      tasks: ['Copay/coinsurance collected before the visit', 'Signed financial policy, assignment of benefits, release of information', 'Medicare: ABN when a non-covered or frequency-limited service is likely', 'Update demographics + insurance at every visit', 'Patient portal / statement preferences'], pitfalls: ['Collecting after the visit (collection rate halves)', 'No signed AOB'], kpi: 'Point-of-service collection rate: >70% of copays' },
    { id: 'doc', n: '04', t: 'Clinical documentation', owner: 'Provider / MA', goal: 'Note supports the level, the diagnoses and the medical necessity.',
      tasks: ['Chief complaint + HPI relevant to the dx coded', 'Document each chronic problem addressed with status (stable, worsening) and plan - MEAT: Monitor, Evaluate, Assess, Treat', 'Total time statement OR MDM elements (problems, data, risk)', 'Procedures: indication, consent, site/laterality, size, technique, lot/NDC, complications', 'Screening tools (PHQ-9, GAD-7, AUDIT-C) with score and interpretation', 'Sign + date within payer window (no cloned notes)'],
      pitfalls: ['Copy-forward "all stable" notes', 'Diagnoses listed in problem list but not assessed - cannot be coded', 'Time documented but not as total time on date of encounter'], kpi: 'Note signed within 48 h: >95%' },
    { id: 'coding', n: '05', t: 'Coding', owner: 'Coder / provider', goal: 'Right CPT, ICD-10-CM, HCPCS and modifiers - to the highest level of specificity supported.',
      tasks: ['Select E/M by MDM or time (whichever is more favorable and documented)', 'Assign ICD-10-CM to max specificity; list the reason for the visit first', 'Add G2211, prolonged service, care-management and screening codes when criteria are met', 'Apply modifiers (25, 59/X, 33, QW, RT/LT, 95)', 'Link each CPT to the relevant dx pointer (max 4)', 'Add quality (CPT II) codes for BP, A1c, depression screening'],
      pitfalls: ['Defaulting to 99213/99214', 'Using unspecified codes (E11.9, E78.5, F32.9) when documentation supports specificity', 'Missing modifier 25 or QW'], kpi: 'Coding accuracy audit: >95%' },
    { id: 'charge', n: '06', t: 'Charge entry & capture', owner: 'Billing', goal: 'Every billable service is captured once - and only once.',
      tasks: ['Reconcile the schedule with charges daily (no visit without a charge)', 'Capture supplies/drugs (J-codes, IUD, implants, vaccines) with NDC and units', 'Charge-lag target: <=2 business days', 'Hold charges with open provider queries'], pitfalls: ['Missed vaccine product codes', 'Missed drug units (J3301 per 10 mg)', 'Duplicate charges when a visit is re-opened'], kpi: 'Charge lag: <2 days; missed-charge rate <1%' },
    { id: 'scrub', n: '07', t: 'Claim scrubbing (pre-submission edits)', owner: 'Billing', goal: 'Catch denials before they happen.',
      tasks: ['Run payer-specific + NCCI + MUE + age/sex + dx-CPT necessity edits (use the Claim Inspector tab)', 'Check taxonomy, NPI, billing vs. rendering provider enrollment, credentialing dates', 'Verify prior auth number, referral, CLIA number in box 23, ABN modifiers', 'Check timely filing window'], pitfalls: ['Scrubber warnings ignored', 'Rendering NPI not enrolled with payer on DOS'], kpi: 'Clean-claim rate: >95%' },
    { id: 'submit', n: '08', t: 'Claim submission', owner: 'Billing / clearinghouse', goal: 'Get the claim accepted by the payer within 24-48 hours of the visit.',
      tasks: ['Send 837P electronically; monitor 999/277CA acknowledgements', 'Work clearinghouse rejections the same day', 'Track claims not acknowledged after 3 days', 'Attach documentation when requested (PWK)'], pitfalls: ['Rejections ≠ denials: rejected claims were never processed and the filing clock keeps running'], kpi: 'First-pass acceptance: >98%' },
    { id: 'adjud', n: '09', t: 'Payer adjudication & follow-up', owner: 'Billing / AR', goal: 'Claims paid correctly and quickly.',
      tasks: ['Status at day 14 (commercial) / day 30 (Medicare ~14-30 days normal)', 'Track pending claims > 30 days', 'Check allowed amounts against the contract fee schedule', 'Appeal underpayments'], pitfalls: ['Waiting for 90 days before first follow-up', 'Underpayments accepted silently'], kpi: 'Days in A/R: <35-40 (FM benchmark)' },
    { id: 'post', n: '10', t: 'Payment posting & reconciliation', owner: 'Posting', goal: 'Accurate posting by CARC/RARC with adjustments classified correctly.',
      tasks: ['Post ERA/835 payments + adjustments by code (CO vs. PR)', 'Transfer remaining balance to secondary/patient correctly', 'Reconcile deposits to remits daily', 'Flag denials into work queues with the CARC reason'], pitfalls: ['Contractual write-offs posted as denials', 'PR amounts written off (compliance risk)'], kpi: 'Posting lag: <24 h' },
    { id: 'denial', n: '11', t: 'Denials & appeals', owner: 'AR / denials team', goal: 'Overturn what is owed; fix the root cause.',
      tasks: ['Categorize each denial: front-end, coding, clinical, payer error', 'Work within appeal windows (see Denials tab)', 'Send corrected claim (freq code 7) vs. appeal appropriately', 'Track top 5 denial reasons monthly and fix upstream'], pitfalls: ['Appealing every denial instead of correcting simple data errors', 'Missing appeal deadlines'], kpi: 'Initial denial rate: <5%; overturn rate: >60%' },
    { id: 'pt', n: '12', t: 'Patient billing & collections', owner: 'Patient financial services', goal: 'Clear statements, payment options, minimal bad debt.',
      tasks: ['Statements only after insurance adjudication', 'Text/email pay links; payment plans', 'Financial assistance policy; No Surprises Act good-faith estimates for self-pay', 'Refund credits within state/payer deadlines'], pitfalls: ['Balance billing contractual adjustments', 'Billing patient for Medicare denial without GA/GY and notice'], kpi: 'Patient A/R > 90 days: <10%' }
  ];

  CI.KPI = [
    ['Clean claim rate', '> 95%', 'Claims accepted without edits or rework'],
    ['First-pass resolution rate', '> 90%', 'Paid on first submission'],
    ['Initial denial rate', '< 5%', 'Industry average ~10%+; best-in-class primary care <5%'],
    ['Days in A/R', '< 35-40', 'Total A/R ÷ average daily charges'],
    ['A/R > 90 days', '< 15%', 'Of total A/R'],
    ['Net collection rate', '> 95%', 'Payments ÷ (charges - contractual adjustments)'],
    ['Charge lag', '< 2 days', 'DOS to charge entry'],
    ['Cost to collect', '< 4-5%', 'Total RCM cost ÷ collections'],
    ['Point-of-service collection', '> 70%', 'Copays collected before visit']
  ];

  /* Denials: [carc, group, name, causes, fix, prevention] */
  CI.DENIALS = [
    ['CO-4', 'Coding', 'Modifier missing or inconsistent with the procedure', 'Missing 25/59/QW/laterality, or modifier doesn\'t match the CPT.', 'Correct the modifier and submit a corrected claim (freq 7). If E/M-25: be ready to supply the note.', 'Scrubber rule for E/M+procedure and QW; use modifier checklists.'],
    ['CO-11', 'Medical necessity', 'Diagnosis inconsistent with the procedure', 'Dx doesn\'t support the CPT (e.g., A1c with J06.9).', 'Check pointer; add the supporting dx documented in the note; corrected claim or appeal with note.', 'Use the CPT↔Dx match tool before submitting.'],
    ['CO-16', 'Claim error', 'Claim lacks information / has submission or billing errors', 'Missing NPI, rendering provider, ref number, CLIA, prior auth, units, or invalid field. The RARC explains which.', 'Read the RARC (e.g., N290 missing rendering NPI, MA130 unprocessable). Fix and resubmit - it\'s not appealable.', 'Standardize payer-specific data fields; scrubber required-field edits.'],
    ['CO-18', 'Duplicate', 'Exact duplicate claim/service', 'Resubmitting while the original is pending; same line twice; RT/LT conflicts.', 'Check original status; if the original was denied/rejected for a fix use freq 7; if legit repeat use 76/77 or 91.', 'Check claim status before rebilling; use laterality modifiers.'],
    ['CO-22', 'COB', 'Care may be covered by another payer per COB', 'Another primary exists (MSP, accident, auto, work comp).', 'Contact the patient; update COB; bill the correct primary first, then this payer.', 'Collect MSP questionnaire; re-verify at each visit.'],
    ['CO-27', 'Eligibility', 'Expenses incurred after coverage terminated', 'Coverage ended or lapsed before DOS.', 'Verify; bill new payer or patient if still liable. Obtain proof of coverage.', 'Eligibility check on DOS.'],
    ['CO-29', 'Timely filing', 'Time limit for filing has expired', 'Submitted past the payer window.', 'Appeal with proof of timely filing (clearinghouse acceptance report 277CA, prior payer denial). Otherwise write off - patient can\'t be billed.', 'Track unbilled claims and rejections; work rejections daily.'],
    ['CO-31', 'Eligibility', 'Patient cannot be identified as our insured', 'Wrong ID, DOB, name spelling.', 'Verify subscriber demographics; resubmit.', 'Scan insurance card and ID; copy exactly.'],
    ['CO-45', 'Contractual', 'Charge exceeds fee schedule / maximum allowable', 'Contract write-off - expected.', 'Write off the contractual adjustment. Not a denial; do not bill patient.', 'Use fee schedule comparison to detect underpayments.'],
    ['CO-50', 'Medical necessity', 'Non-covered: not deemed a medical necessity', 'Documentation or dx doesn\'t meet LCD/NCD/policy.', 'Appeal with clinical documentation, guideline citations; check LCD criteria and dx list.', 'ABN (Medicare, GA modifier) before service; dx pairing checks.'],
    ['CO-55', 'Medical necessity', 'Procedure/treatment deemed experimental or investigational', '', 'Appeal with literature/guidelines or accept denial.', ''],
    ['CO-96', 'Non-covered', 'Non-covered charge(s)', 'Statutory exclusion (e.g., routine physical in Medicare), or benefit exclusion.', 'Patient may be billed only if GY/ABN/notice was given. Check RARC N-codes.', 'Use AWV/IPPE for Medicare; GY/GX modifiers.'],
    ['CO-97', 'Bundling', 'Benefit included in payment for another service', 'Bundled service (e.g., 94760, 36415 for some payers, E/M with procedure without 25).', 'If distinct, add 25/59/X and appeal with note; otherwise write off.', 'NCCI edits in scrubber.'],
    ['CO-109', 'Eligibility', 'Claim not covered by this payer/contractor', 'Wrong payer (e.g., MA plan vs Medicare, Medicaid MCO).', 'Identify correct payer and rebill within its filing window.', 'Verify eligibility on DOS.'],
    ['CO-119', 'Benefit limits', 'Maximum benefit for this time period has been met', 'Annual visit limit, frequency limit (A1c, AWV).', 'Verify prior use; patient may be liable if notified; appeal if wrongly counted.', 'Frequency tracking; ABN.'],
    ['CO-167', 'Medical necessity', 'Diagnosis is not covered', 'Dx not on covered list (e.g., Z-code as primary for screening test).', 'Replace with covered dx supported by the note, or appeal.', 'Dx coverage lists in scrubber.'],
    ['CO-197', 'Authorization', 'Precertification/authorization absent', 'Missing PA for imaging, DME, specialist referral.', 'Request retro-authorization with clinical documentation; appeal.', 'Auth check at scheduling.'],
    ['CO-204', 'Non-covered', 'Service/equipment not covered under the patient\'s benefit plan', 'Non-covered benefit.', 'Verify; bill patient if notified, else write off.', 'Benefits verification.'],
    ['CO-234', 'Bundling', 'Procedure not paid separately', 'Bundled by NCCI/payer policy.', 'Check NCCI; if truly distinct use X modifier + appeal.', ''],
    ['CO-236', 'Bundling', 'Procedure/modifier combination not compatible with another procedure on the same date', 'NCCI PTP edit.', 'Add correct modifier if legitimately separate; otherwise drop.', 'NCCI checks in scrubber.'],
    ['CO-252', 'Documentation', 'Additional documentation needed', 'Payer needs the note, lab, or form.', 'Send documents with the cover letter quoting the claim number.', 'Attach PWK when known.'],
    ['PR-1', 'Patient resp.', 'Deductible amount', 'Applied to deductible.', 'Bill patient; send to secondary.', 'Collect estimate at POS.'],
    ['PR-2', 'Patient resp.', 'Coinsurance amount', '', 'Bill patient / secondary.', ''],
    ['PR-3', 'Patient resp.', 'Copayment amount', 'Copay not collected at visit.', 'Bill patient; verify copay applicability (preventive, telehealth).', 'Collect at check-in.'],
    ['PR-96', 'Patient resp.', 'Non-covered charge', 'Patient responsible - benefit exclusion.', 'Bill patient with proper notice.', ''],
    ['OA-23', 'COB', 'Payment adjusted due to prior payer\'s adjudication', 'Secondary claim - primary already paid.', 'Expected. Verify math.', ''],
    ['CO-B7', 'Credentialing', 'Provider not certified/eligible for this procedure on this DOS', 'Rendering not credentialed, taxonomy mismatch, NP/PA enrollment.', 'Check enrollment dates; appeal with credentialing letter; re-bill under correct provider.', 'Credentialing tracker.'],
    ['CO-8', 'Credentialing', 'Procedure code is inconsistent with provider type/specialty (taxonomy)', 'Taxonomy/specialty doesn\'t match service (e.g., peds codes by geriatric taxonomy).', 'Update taxonomy on claim to what\'s enrolled; if enrollment is wrong update NPPES/PECOS; appeal.', 'Taxonomy check in scrubber.'],
    ['CO-5', 'Coding', 'Procedure code/bill type inconsistent with place of service', 'Hospital E/M in POS 11, office E/M in POS 21, etc.', 'Correct POS or CPT; resubmit.', 'POS rules.'],
    ['CO-6', 'Coding', 'Procedure/revenue code inconsistent with patient\'s age', 'Age-banded preventive code mismatch, vaccines outside indicated age.', 'Fix CPT to match age.', 'Age edits in scrubber.'],
    ['CO-7', 'Coding', 'Procedure/revenue code inconsistent with patient\'s gender', 'Sex-specific service or dx.', 'Correct sex or code.', 'Sex edits.'],
    ['CO-15', 'Authorization', 'Authorization number missing/invalid', '', 'Add auth number; resubmit.', ''],
    ['CO-26', 'Eligibility', 'Expenses incurred prior to coverage', '', 'Verify coverage dates.', ''],
    ['CO-35', 'Benefit limits', 'Lifetime benefit maximum has been reached', '', 'Verify.', ''],
    ['CO-39', 'Authorization', 'Services denied at the time authorization was requested', '', 'Appeal.', ''],
    ['CO-59', 'Payment', 'Multiple/concurrent procedures reduced', 'Multiple-procedure reduction applied.', 'Expected. Check allowance.', ''],
    ['CO-107', 'Claim error', 'Related or qualifying service was not covered/identified on the claim', 'Add-on with no primary, G2211 without E/M, etc.', 'Fix the primary service on claim.', 'Add-on edit.'],
    ['CO-146', 'Medical necessity', 'Diagnosis invalid for the date(s) of service', 'Dx code not valid on DOS (e.g., retired/new code).', 'Use dx valid on DOS; ICD updates each Oct 1.', 'Annual ICD update.'],
    ['CO-151', 'Medical necessity', 'Payment adjusted: frequency/units not supported', 'Too many units/visits.', 'Appeal with documentation, MUE.', ''],
    ['CO-170', 'Credentialing', 'Payment denied when performed by this type of provider', 'NP/PA/provider type not covered for service.', 'Check payer policy for provider type.', ''],
    ['CO-181', 'Claim error', 'Procedure code was invalid on the DOS', 'Deleted CPT; new year code.', 'Use current code.', 'Annual code updates.'],
    ['CO-182', 'Claim error', 'Procedure modifier was invalid on the DOS', 'Retired/invalid modifier.', 'Use valid modifier.', ''],
    ['CO-183', 'Claim error', 'Referring provider is not eligible to refer', '', 'Correct referring provider.', ''],
    ['CO-199', 'Claim error', 'Revenue code and procedure code do not match', '', 'Fix.', ''],
    ['N30', 'RARC', 'Patient ineligible for this service', 'Informational.', 'See CARC.', ''],
    ['N386', 'RARC', 'Decision based on NCD/LCD', 'Medical necessity policy applied.', 'Check cited policy; ensure dx and documentation meet criteria.', ''],
    ['N522', 'RARC', 'Duplicate of a claim processed or in process as a crossover claim', 'Duplicate.', 'Wait for crossover.', ''],
    ['M80', 'RARC', 'Not covered when performed during the same session/date as a previously processed service', 'Bundled.', 'Add modifier if distinct.', ''],
    ['N657', 'RARC', 'Should be billed with the appropriate code for these services', 'Wrong code.', 'Resubmit with proper code.', ''],
    ['N179', 'RARC', 'Additional information has been requested from the member', 'Payer waiting on patient (COB questionnaire).', 'Contact patient.', '']
  ];

  CI.TIMELY = [
    ['Medicare Part B', '12 months from DOS (calendar year after the year of DOS ends is obsolete)', 'Appeal: redetermination within 120 days of initial determination notice', 'Reopening for clerical errors: 1 year'],
    ['Medicare Advantage', 'Per contract - usually 90-180 days for in-network; 12 months out-of-network', 'Plan reconsideration within 60 days of determination (65 w/ mailing)', 'Contracted providers: follow plan appeal rules'],
    ['Medicaid FFS / MCO', 'State-specific: 90 days to 12 months (often 180 days from DOS for MCO, 365 for FFS)', 'State-specific (commonly 60-90 days)', 'Check your state provider manual'],
    ['Commercial (typical)', '90-180 days from DOS; some 365 days', 'Level 1 provider appeal commonly 180 days from denial (ERISA minimum 180 days for plan members)', 'Contract language controls'],
    ['TRICARE', '1 year from DOS', 'Request for reconsideration within 90 days of notice', ''],
    ['Workers\' comp', 'State-specific: 30-180 days', 'State-specific', 'Often needs medical report (CA: DWC-RFA)'],
    ['Corrected claims', 'Usually 90-180 days from original remit; Medicare 12 months from DOS', 'CMS-1500 box 22: resubmission code 7 (replace) / 8 (void) + original claim number', 'Electronic: CLM05-3 frequency 7 or 8 + REF*F8']
  ];

  CI.CMS1500 = [
    ['1', 'Type of coverage', 'Payer program: Medicare, Medicaid, TRICARE, group health, other'],
    ['1a', 'Insured ID', 'Exactly as on the card (MBI for Medicare)'],
    ['2', 'Patient name', 'Last, first, MI'],
    ['3', 'DOB / sex', 'Must match payer file'],
    ['4', 'Insured name', 'Subscriber (if different, use relationship box 6)'],
    ['9-9d', 'Other insured', 'Secondary payer / Medigap'],
    ['10a-c', 'Condition related to', 'Employment, auto accident, other accident - drives COB'],
    ['11', 'Insured policy/group', 'Group number; "NONE" if no secondary'],
    ['14', 'Date of current illness/injury', 'Qualifier 431 onset; 484 LMP'],
    ['17', 'Referring/ordering provider + NPI', 'DN referring, DK ordering, DQ supervising'],
    ['19', 'Additional claim info', 'Hospice/NOC description; sometimes payer-specific'],
    ['21', 'Diagnosis codes (A-L)', 'ICD indicator 0; up to 12; no decimal'],
    ['22', 'Resubmission code', '7 replacement, 8 void + original ref number'],
    ['23', 'Prior authorization / CLIA #', 'CLIA certificate for lab tests'],
    ['24A', 'Dates of service', 'From-To'],
    ['24B', 'Place of service', 'POS 11, 02, 10, 12...'],
    ['24D', 'CPT/HCPCS + modifiers', 'Up to 4 modifiers'],
    ['24E', 'Diagnosis pointer', 'Letters A-L, max 4 (no commas)'],
    ['24F', 'Charges', 'Per line'],
    ['24G', 'Units', 'Whole numbers'],
    ['24I/J', 'ID qualifier / Rendering NPI', 'Individual practitioner NPI (type 1)'],
    ['25', 'Federal tax ID', 'EIN or SSN'],
    ['26', 'Patient account number', 'Your PMS ID'],
    ['27', 'Accept assignment', 'Yes for participating providers'],
    ['31', 'Signature of physician', 'Signature on file'],
    ['32', 'Service facility', 'Where services were rendered (NPI 32a)'],
    ['33', 'Billing provider', 'Pay-to; group NPI 33a; taxonomy in 33b with ZZ qualifier']
  ];

  /* Care programs and playbooks */
  CI.PROGRAMS = [
    { id: 'ccm', t: 'Chronic Care Management (CCM)', codes: '99490 · 99439 · 99487 · 99489 · 99491 · 99437', who: 'Clinical staff under general supervision (99490/99487); physician/QHP time for 99491',
      req: ['2+ chronic conditions expected to last ≥12 months that place patient at significant risk', 'Documented patient consent (verbal OK, in chart)', 'Comprehensive care plan, shared with patient', '24/7 access to care team', 'Initiating visit (E/M, AWV, IPPE) in prior 12 months for new/not-seen-in-12-months patients', 'Time log - ≥20 min staff time per calendar month for 99490 (+99439 per extra 20 min, max 2 for Medicare)'],
      pitfalls: ['Billing in months with <20 min documented', 'Two practices billing CCM for same patient', 'Counting time that overlaps TCM/home health supervision rules'], value: '~$60 / patient / month for 99490 (national avg); scales with 99439' },
    { id: 'pcm', t: 'Principal Care Management (PCM)', codes: '99424 · 99425 · 99426 · 99427', who: 'Physician/QHP (99424/5) or clinical staff (99426/7)',
      req: ['One serious chronic condition that is a focus of the service and needs short-term management', 'Often used when specialist is managing', 'Consent + disease-specific care plan'], pitfalls: ['Cannot bill with CCM for same patient same month by same practitioner in most cases'], value: 'Alternative to CCM for single-condition patients' },
    { id: 'apcm', t: 'Advanced Primary Care Management (APCM)', codes: 'G0556 · G0557 · G0558', who: 'Billing practitioner / practice', req: ['Medicare monthly bundle for primary care infrastructure (since 2025)', 'Levels depend on # chronic conditions and QMB status', 'Practice-level requirements for 24/7 access, care plan, population-level management', 'Monthly billing, cannot overlap with CCM/PCM/TCM/BHI codes in same month (check current rules)'], pitfalls: ['Overlap with other care-management codes', 'Eligibility rules change yearly'], value: 'Replaces many time-tracking codes with a flat monthly payment' },
    { id: 'tcm', t: 'Transitional Care Management (TCM)', codes: '99495 · 99496', who: 'Physician/QHP with clinical staff',
      req: ['Discharge from inpatient/observation/SNF/partial hospitalization to community', 'Interactive contact within 2 business days after discharge (attempts documented)', 'Face-to-face within 14 days (99495, ≥moderate MDM) or 7 days (99496, high MDM)', 'Medication reconciliation on or before the date of the visit', '30-day service period; bill on date of visit (Medicare allows) - one provider per discharge'],
      pitfalls: ['Contact outside 2 business days without 2 documented attempts', 'Readmission within 30 days', 'Billing an E/M in addition on the same visit'], value: '~$200-270 per discharge' },
    { id: 'rpm', t: 'Remote Physiologic Monitoring (RPM)', codes: '99453 · 99454 · 99457 · 99458', who: 'Clinical staff + physician oversight',
      req: ['FDA-defined medical device transmitting physiologic data (BP cuff, glucometer, scale)', '99454: ≥16 days of data in 30-day period', '99457: first 20 min/month of interactive communication; 99458 each add\'l 20 min', 'Established patient relationship; consent', 'Dx like I10, E11.-, I50.-, J44.-'], pitfalls: ['<16 days data → 99454 not billable', 'Billing 99457 without a live conversation', 'Duplicate with CCM time'], value: '~$125-150 / patient / month for HTN with consistent engagement' },
    { id: 'bhi', t: 'Behavioral Health Integration', codes: '99484 · 99492 · 99493 · 99494', who: 'Billing practitioner + BH care manager + psychiatric consultant',
      req: ['Depression/anxiety/other BH condition identified', '99484: ≥20 min/mo care management with systematic assessment', 'CoCM (9949x): behavioral health care manager + psychiatric consultant, registry, measurement-based care', 'Consent, treatment plan'], pitfalls: ['Time overlap with CCM', 'No registry/ psychiatric consult documentation for CoCM'], value: 'CoCM first month ~$140, subsequent ~$125' },
    { id: 'awv', t: 'Medicare Annual Wellness Visit (AWV) / IPPE', codes: 'G0402 · G0438 · G0439 (+ G0444, 99497, G0136)', who: 'Physician/NPP, or qualified health professional (RN, MA) under supervision',
      req: ['G0402 IPPE: within 12 months of Part B effective date (once)', 'G0438 initial AWV: after the first 12 months of Part B, once', 'G0439 subsequent: every 12 months (11 full months after the last AWV)', 'HRA, medical/family history, list of providers/suppliers, vital signs, cognitive assessment, depression risk review, functional ability/safety, screening schedule, personalized prevention plan', 'Add-ons: ACP 99497 (-33), depression screen G0444 (not with G0438), SDOH risk G0136, alcohol G0442, vaccines'],
      pitfalls: ['AWV is not a physical exam - problems addressed get 9921x-25', 'Missing HRA', 'G0439 within 11 months of last AWV'], value: '~$120-175; high-yield annual touchpoint for Medicare population' },
    { id: 'acp', t: 'Advance Care Planning (ACP)', codes: '99497 · 99498', who: 'Physician/QHP', req: ['Face-to-face voluntary discussion of advance directives (living will, healthcare proxy, POLST)', '≥16 min for 99497; +30 min for 99498', 'Document who was present, what was discussed, time, patient\'s voluntary participation'], pitfalls: ['Time overlap with E/M time (count once)', 'Cost-share: use -33 with AWV for Medicare waiver'], value: '~$80 per 30 min' },
    { id: 'tele', t: 'Telehealth & virtual care', codes: '9920x/9921x + 95/93 · 99421-99423 · 98016/G2012', who: 'Any billing practitioner', req: ['Audio-video real time (95) or audio-only (93) as permitted', 'POS 02 (not home) / 10 (home) for Medicare; commercial often POS 11 + 95', 'Document patient & provider locations, consent, platform, participants, time', 'Patient-initiated portal messages: 99421-99423 (5-10, 11-20, 21+ min over 7 days)'], pitfalls: ['Medicare telehealth flexibilities and expiration dates change frequently - confirm current status', 'Audio-only not covered by all payers'], value: 'Same E/M level rules apply (MDM or time)' },
    { id: 'obgyn', t: 'Women\'s health in primary care', codes: '58300 · 58301 · 11981-11983 · Q0091 · G0101 · 59400/59425/59426', who: 'Credentialed FM physicians/NPs', req: ['Contraception visit: pair devices (J7296-J7300, J7307) and Z30.- dx; separate E/M-25 only if separately identifiable', 'Pap: Z01.411/419 (gyn exam) vs Z12.4 (screening); HPV co-testing 87624', 'OB: global 59400 if delivering; otherwise 59425/59426 or E/M with O/Z34 dx'], pitfalls: ['Billing 99213-25 with every IUD insertion', 'IUD device not billed'], value: '' },
    { id: 'peds', t: 'Pediatric well-care', codes: '9938x/9939x · 90460/90461 · 96110 · 96127 · 99173 · 92551 · 99188 · 83655', who: 'Any practitioner', req: ['Bright Futures periodicity: newborn, 3-5 d, 1, 2, 4, 6, 9, 12, 15, 18, 24, 30 months; annually 3-21 y', 'Developmental screening (96110) at 9, 18, 30 months; autism at 18 & 24 months', 'Depression screening 12+ (96127), maternal depression at infant visits (96161)', 'Fluoride varnish (99188) through age 5 with dental-referral documentation', 'Vaccines: 90460 + 90461 if counseling; VFC admin-only billing'], pitfalls: ['Missing 25 on sick visit at a well visit', 'Z00.129 vs Z00.121 (abnormal finding)'], value: '' }
  ];

  CI.DOC = [
    { t: 'Joint injection (20610 / 20611)', items: ['Joint + laterality', 'Indication / failed conservative therapy', 'Consent + time-out', 'Drug, dose, lot, expiration, NDC', 'Guidance (palpation vs. ultrasound; for 20611 keep image + report)', 'Post-procedure status; instructions'] },
    { t: 'Skin biopsy (11102-11107)', items: ['Lesion site, size (cm), description', 'Method: tangential / punch / incisional', 'Anesthetic, hemostasis, closure', 'Specimen sent, path requisition, dx suspicion', 'One entry per lesion'] },
    { t: 'Laceration repair (12001-12057)', items: ['Anatomic site(s) and total length in cm', 'Simple (single layer) vs. intermediate (layered) vs. complex', 'Irrigation/debridement, anesthetic, suture type + size', 'Tetanus status', 'Neurovascular exam'] },
    { t: 'Destruction of lesions (17000-17111)', items: ['Number and site of lesions (premalignant vs. benign)', 'Method (cryo, chemical, electrodessication)', 'Symptoms/indication (e.g., painful, bleeding, inflamed)'] },
    { t: 'Cerumen removal (69210)', items: ['Impaction documented (symptoms, inability to visualize TM)', 'Laterality; instrumentation (not irrigation alone, which is bundled)', 'Post-procedure TM visualization'] },
    { t: 'Tobacco cessation (99406/99407)', items: ['Start/stop time or total minutes', 'Content of counseling; tobacco use status', 'Pharmacotherapy offered; quit date/plan'] },
    { t: 'Depression / behavioral screening (96127, G0444)', items: ['Instrument (PHQ-2/9, GAD-7)', 'Score and interpretation', 'Follow-up plan for positive result'] },
    { t: 'Prolonged service (99417 / G2212)', items: ['Total provider time on date of encounter', 'Activities included (not separately reported, not clinical staff time)', 'Start of billing threshold met'] },
    { t: 'Advance care planning (99497)', items: ['Who participated, voluntary nature', 'Explanation of directives; discussion details', 'Start/stop time (≥16 min)', 'Forms completed'] },
    { t: 'E/M (MDM)', items: ['Problems: number/complexity (stable chronic vs. exacerbation)', 'Data: tests ordered/reviewed, independent historian, discussion with external provider', 'Risk: Rx management, social determinants, procedures, decision for hospitalization', 'Assessment/plan for each problem'] },
    { t: 'MEAT for risk adjustment', items: ['Monitor: signs, symptoms, labs', 'Evaluate: test results, response to treatment', 'Assess: exam findings, status', 'Treat: medications, referrals, counseling'] }
  ];

  /* Charge capture: things that happened in the visit -> codes to consider */
  CI.CAPTURE = [
    { id: 'tob', label: 'Tobacco cessation counseling', min: true, codes: [['99406', '3-10 min', '25 on E/M'], ['99407', '>10 min', '25 on E/M']], dx: 'F17.210 / Z72.0' },
    { id: 'depr', label: 'Depression / anxiety screening tool (PHQ-9, GAD-7) scored', codes: [['96127', 'per instrument', 'G0444 for Medicare annual'], ['G0444', 'Medicare annual, no initial AWV', '']], dx: 'Z13.31 / Z13.39' },
    { id: 'alc', label: 'Alcohol screening + brief intervention', codes: [['99408', '15-30 min', ''], ['G0442', 'Medicare screening 5-15 min', ''], ['G0443', 'Medicare counseling 15 min', '']], dx: 'Z13.39 / Z71.41' },
    { id: 'acp', label: 'Advance care planning discussion >=16 min', codes: [['99497', 'first 30 min', '-33 with AWV'], ['99498', 'each add\'l 30 min', '']], dx: 'Any' },
    { id: 'sdoh', label: 'SDOH screening (PRAPARE / AHC)', codes: [['G0136', 'Medicare 5-15 min', ''], ['96160', 'patient-focused HRA', '']], dx: 'Z55-Z65' },
    { id: 'hra', label: 'Health risk assessment (pt-completed)', codes: [['96160', 'patient-focused', ''], ['96161', 'caregiver-focused', '']], dx: 'Z13.- or Z00.-' },
    { id: 'g2211', label: 'Longitudinal primary care relationship (Medicare)', codes: [['G2211', 'add-on to 9921x', 'No 25 unless vaccine/AWV/preventive']], dx: 'n/a' },
    { id: 'long', label: 'Visit took >=55 min (est) / >=75 min (new) total provider time', codes: [['99417', 'each add\'l 15 min (CPT)', ''], ['G2212', 'Medicare (69 / 89 min thresholds)', '']], dx: 'n/a' },
    { id: 'ecg', label: '12-lead ECG performed and interpreted', codes: [['93000', 'with interpretation', '']], dx: 'R00.-, R07.-, I-' },
    { id: 'spiro', label: 'Spirometry / bronchodilator test', codes: [['94010', 'spirometry', ''], ['94060', 'pre/post bronchodilator', 'no 94010']], dx: 'J44.- / J45.- / R06.-' },
    { id: 'neb', label: 'Nebulizer treatment in office', codes: [['94640', 'treatment', ''], ['J7613', 'albuterol (per 1 mg)', 'check units']], dx: 'J45.- / J44.- / R06.-' },
    { id: 'strep', label: 'Rapid strep / flu / COVID POC test', codes: [['87880', 'strep A', 'QW'], ['87804', 'influenza A/B', 'QW'], ['87811', 'COVID antigen', 'QW']], dx: 'J02.- / J10-J11 / U07.1' },
    { id: 'a1c', label: 'POC HbA1c', codes: [['83036', 'A1c', 'QW'], ['3044F-3046F', 'A1c value (quality)', '']], dx: 'E11.- / R73.-' },
    { id: 'ua', label: 'Urinalysis dip', codes: [['81002', 'non-automated', ''], ['81003', 'automated', 'QW']], dx: 'N39.0 / R30.0 / R31.-' },
    { id: 'venip', label: 'Blood draw sent to outside lab', codes: [['36415', 'venipuncture', '']], dx: 'Dx of the ordered tests' },
    { id: 'vacc', label: 'Vaccine(s) given', codes: [['9047x/9046x', 'admin + product', 'Z23'], ['G0008-G0010', 'Medicare flu/pneumo/hepB admin', '']], dx: 'Z23' },
    { id: 'inj', label: 'Therapeutic injection (B12, ceftriaxone, Depo)', codes: [['96372', 'admin', '25 on E/M if separately identifiable'], ['J-code', 'drug supply with units', 'NDC']], dx: 'Per drug' },
    { id: 'joint', label: 'Joint / trigger-point / tendon injection', codes: [['20610', 'major joint no US', 'RT/LT/50'], ['20611', 'with US + report', ''], ['20552', 'trigger point 1-2 muscles', ''], ['J3301/J1030', 'steroid', 'units!']], dx: 'M17.-, M25.5-, M75.-, M77.-' },
    { id: 'biop', label: 'Skin biopsy / shave / excision', codes: [['11102-11107', 'biopsy', ''], ['11300-11313', 'shave', ''], ['11400-11446', 'excision benign', '']], dx: 'D22.-, L82.-, D48.5 (only after path)' },
    { id: 'wart', label: 'Cryotherapy of AKs / warts', codes: [['17000/17003/17004', 'premalignant', ''], ['17110/17111', 'benign lesions (warts)', '']], dx: 'L57.0 / B07.-' },
    { id: 'lac', label: 'Laceration repair', codes: [['12001-12057', 'by length + layers + site', ''], ['90715', 'Tdap if given', '']], dx: 'S0-S9' },
    { id: 'cer', label: 'Ear wax removal with instruments', codes: [['69210', 'unilateral', '50 if bilateral']], dx: 'H61.2-' },
    { id: 'abs', label: 'Abscess I&D', codes: [['10060', 'simple', ''], ['10061', 'complicated', '']], dx: 'L02.-' },
    { id: 'iud', label: 'IUD or implant insertion/removal', codes: [['58300', 'IUD insert', ''], ['58301', 'IUD remove', ''], ['J7296-J7300', 'device', ''], ['11981-11983', 'implant', ''], ['J7307', 'implant device', '']], dx: 'Z30.430 / Z30.432 / Z30.017' },
    { id: 'nail', label: 'Nail debridement / ingrown toenail', codes: [['11720/11721', 'debridement', 'Q7-Q9 for Medicare'], ['11730', 'avulsion', 'T-modifiers'], ['11765', 'wedge excision', '']], dx: 'B35.1 / L60.0' },
    { id: 'splint', label: 'Splint or strapping', codes: [['29125/29130/29515', 'splint', ''], ['29540', 'ankle strapping', '']], dx: 'S-codes' },
    { id: 'bp', label: 'Quality: BP / A1c / screening values recorded', codes: [['3074F-3080F', 'BP values', ''], ['3044F-3046F', 'A1c', ''], ['G8431/G8510', 'depression screen result', '']], dx: 'none' },
    { id: 'care', label: 'Non-visit work: care coordination / CCM minutes', codes: [['99490', '20 min staff/month', ''], ['99439', 'each add\'l 20', ''], ['99487', 'complex 60 min', '']], dx: '2+ chronic' }
  ];

  CI.PREVENTIVE = {
    Pediatric: [
      ['Well visits', 'Newborn · 3-5 d · 1, 2, 4, 6, 9, 12, 15, 18, 24, 30 mo · yearly 3-21 y (Bright Futures)', '9938x/9939x', 'Z00.110/.111, Z00.121/.129'],
      ['Developmental screening', '9, 18, 30 months (+ autism 18, 24 mo)', '96110', 'Z13.4x'],
      ['Maternal depression', '1, 2, 4, 6 months', '96161', 'Z13.32 (use baby chart)'],
      ['Depression screening', '12-21 years', '96127', 'Z13.31'],
      ['Vision / hearing', 'Age-specific by Bright Futures', '99173 / 92551', 'Z01.00, Z01.10 / Z13.5'],
      ['Lead / anemia', 'Lead 12 & 24 mo; Hgb at 12 mo', '83655 / 85018', 'Z13.88, Z13.0'],
      ['Fluoride varnish', 'Eruption through 5 y', '99188', 'Z29.3 with Z00.12-'],
      ['Immunizations', 'CDC schedule; VFC for eligible', '90460/90461 + product', 'Z23']
    ],
    'Adults 18-39': [
      ['Annual preventive visit', 'Per payer/benefit (often yearly)', '99385 / 99395', 'Z00.00 / Z00.01'],
      ['Blood pressure', 'Every visit', '3074F-3080F', 'Z13.6 (screening)'],
      ['Cervical cancer', '21-29 cytology q3y; 30-65 HPV q5y / cotest q5y / cytology q3y', 'Q0091 + lab 88142/87624', 'Z01.411/Z01.419, Z12.4'],
      ['Depression / anxiety', 'Adults incl. pregnant & postpartum; anxiety ≤64', '96127', 'Z13.31, Z13.39'],
      ['HIV / Hep C / Hep B', 'HIV 15-65; HCV 18-79 once; HBV once (CDC)', '87389 / 86803 / 86704-86706', 'Z11.4 / Z11.59'],
      ['Chlamydia / gonorrhea', 'Sexually active women ≤24 and at-risk', '87491 / 87591', 'Z11.3'],
      ['Contraception', 'As desired', '58300 / 11981 / 96372', 'Z30.-'],
      ['Tobacco / alcohol / drug use', 'Every adult', '99406 / 99408', 'Z13.39, Z71.-']
    ],
    'Adults 40-64': [
      ['Annual preventive visit', 'Yearly (payer rules)', '99386 / 99396', 'Z00.00 / Z00.01'],
      ['Breast cancer screening', 'Mammogram biennial 40-74 (USPSTF 2024)', '77067 (referral)', 'Z12.31'],
      ['Colorectal cancer', '45-75: colonoscopy q10y, FIT yearly, FIT-DNA q1-3y', 'G0328 / 81528 / 82270', 'Z12.11'],
      ['Diabetes / prediabetes', '35-70 with overweight/obesity: every 3 y', '83036 / 82947', 'Z13.1'],
      ['Lipids / statin', '40-75 risk assessment (ASCVD)', '80061', 'Z13.220'],
      ['Lung cancer', '50-80, ≥20 pack-years, current or quit <15 y: annual LDCT', '71271 (+G0296 counseling)', 'Z12.2, F17.-'],
      ['Hypertension', 'Annual BP, home/ambulatory confirmation', '93784', 'Z13.6'],
      ['Shingles / flu / Tdap / COVID', '≥50 RZV x2; flu yearly; Td/Tdap q10y', '90750 / 90686 / 90715', 'Z23'],
      ['Hepatitis C', 'Once 18-79', '86803', 'Z11.59']
    ],
    'Adults 65+': [
      ['Annual Wellness Visit', 'Medicare yearly', 'G0438 / G0439', 'Z00.00 / Z00.01'],
      ['IPPE', 'Within 12 mo of Part B enrollment', 'G0402 (+93000 ECG)', 'Z00.00'],
      ['Falls risk', 'Annual; exercise interventions for ≥65 at risk', 'Part of AWV', 'Z91.81'],
      ['Cognition', 'Detect impairment during AWV', '99483 if indicated', 'Z13.4 / G31.84'],
      ['Osteoporosis', 'Women ≥65', '77080', 'Z13.820'],
      ['AAA ultrasound', 'Men 65-75 who ever smoked, once', '76706', 'Z13.6 / F17.-'],
      ['Colorectal', 'Through age 75; individualized 76-85', 'G0328 / 81528 / G0105', 'Z12.11'],
      ['Pneumococcal / RSV / Flu / COVID / Shingles', 'Per ACIP; Medicare Part B vs D coverage varies', 'G0009 / 90677; G0008', 'Z23'],
      ['Advance care planning', 'Offer during AWV', '99497-33', 'Any'],
      ['Depression screening', 'Annual', 'G0444', 'Z13.31'],
      ['Alcohol screening', 'Annual + up to 4 counseling', 'G0442 / G0443', 'Z13.39']
    ]
  };

  CI.QUALITY = [
    ['Controlling high BP (CBP)', 'Adults 18-85 with HTN', 'BP <140/90 on most recent reading', '3074F or 3075F (systolic) + 3078F or 3079F (diastolic)', 'Repeat BP if elevated; document both values every visit'],
    ['Glycemic status / HbA1c control (GSD/HBD)', 'Diabetes 18-75', 'A1c <8% (and >9% = poor control)', '3044F (<7), 3051F (7-8), 3052F (8-9), 3046F (>9)', 'Point-of-care A1c; A1c every 3-6 months'],
    ['Eye exam for diabetes (EED)', 'Diabetes 18-75', 'Retinal exam by eye care or AI retinal imaging', '2022F-2026F, 3072F', 'Obtain report; document date and result'],
    ['Kidney health evaluation (KED)', 'Diabetes 18-85', 'eGFR + uACR within the year', 'Lab claims', 'Order uACR with annual labs'],
    ['Statin therapy (SPC / SPD)', 'ASCVD or diabetes 40-75', 'Dispensed statin', 'Rx claims', 'Document reasons for exclusion (myalgia etc.)'],
    ['Colorectal cancer screening (COL)', '45-75', 'Colonoscopy 10y, FIT yearly, FIT-DNA 3y', 'G0328, 81528, 45378…', 'Cologuard/FIT orders at AWV'],
    ['Breast cancer screening (BCS)', 'Women 50-74 (HEDIS) / 40-74 USPSTF', 'Mammogram in prior 27 months', '77067', 'Standing orders'],
    ['Cervical cancer screening (CCS)', 'Women 21-64', 'Cytology 3y or hrHPV 5y', '88142, 87624…', ''],
    ['Depression screening & follow-up (DSF)', 'Age 12+', 'PHQ-9 with follow-up plan if positive', 'G8431 / G8510 · 96127 · G0444', 'Score + plan in structured fields'],
    ['Tobacco screening & cessation', 'Age 12+', 'Screen yearly, intervene if user', '1036F / 4004F · 99406', ''],
    ['Child immunization status (CIS)', 'Age 2', 'Combo 10 vaccines by 2nd birthday', '9xxxx + 90460', 'Recall list at 12 and 18 months'],
    ['Well-child visits (WCV)', 'Ages 3-21', '≥1 well visit per year', '9938x/9939x', 'Offer well visit at sick visit'],
    ['BMI & counseling (WCC)', 'Children 3-17', 'BMI percentile, nutrition and physical activity counseling', 'Z68.5x, Z71.3, Z71.82', ''],
    ['Fall risk screening', '≥65', 'Annual screening + plan', '1100F / 1101F', 'AWV'],
    ['Advance care plan', '≥65', 'Documentation of plan or discussion', '1123F-1124F, 99497', '']
  ];

  /* Document / form templates */
  CI.APPEAL = {
    generic: 'RE: Appeal for claim {{claim}} - Patient: {{patient}} - DOS: {{dos}}\nPayer: {{payer}}   Denial: {{carc}}   Amount: {{amount}}\n\nTo the Appeals Department:\n\nWe are writing to request reconsideration of the above claim, which was denied with reason code {{carc}} ({{carc_desc}}). We believe the denial was made in error for the following reasons:\n\n{{reason}}\n\nEnclosed are the supporting documents: {{attachments}}.\n\nBased on this information the service was medically necessary, correctly coded and billed in accordance with your policy. We respectfully request that the claim be reprocessed and paid at the contracted rate.\n\nSincerely,\n{{provider}}\n{{practice}}\nNPI: {{npi}}   Phone: {{phone}}',
    reasons: {
      'CO-50': 'The patient has {{dx}} documented in the attached visit note dated {{dos}}. The service meets the criteria in the payer\'s medical-necessity policy ({{policy}}). Specifically: [state criteria met, failed conservative therapy, objective findings].',
      'CO-11': 'The submitted diagnosis ({{dx}}) was documented in the note as the clinical indication for {{cpt}}. [Quote the note: symptoms, history, exam]. The pointer on the original claim was incorrect/should be updated.',
      'CO-97': 'The service {{cpt}} was distinct from {{other}}: [different site/lesion/session]. Modifier {{mod}} is appended and the documentation supports a separate and identifiable service.',
      'CO-29': 'The claim was submitted timely on {{submitted}} as shown by the attached clearinghouse acceptance report (277CA) / payer acknowledgement / prior denial letter.',
      'CO-4': 'The original claim contained a modifier error. A corrected claim has been submitted (frequency code 7) with the right modifier. [Or: this appeal is for the modifier {{mod}} which is appropriate because ...]',
      'CO-16': 'We have corrected the missing information ({{missing}}) and are resubmitting. Please process the corrected claim.',
      'CO-8': 'The rendering provider {{provider}} (NPI {{npi}}) is enrolled with your plan under taxonomy {{taxonomy}} effective {{effective}}. The service {{cpt}} is within the scope of practice for this provider.',
      'CO-119': 'The prior service the plan used to count against the limit was not for the same service. Attached are the remittances showing the dates of previous services.',
      'CO-197': 'Authorization number {{auth}} was obtained on {{authdate}} (attached). If not on file: request for retro-authorization due to medical urgency [explain].'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
