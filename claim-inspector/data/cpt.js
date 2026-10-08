/* Claim Inspector knowledge base: procedure codes (CPT/HCPCS) + diagnosis "families".
   Descriptions are short paraphrases, not AMA CPT descriptors. Always verify against current code books/payer policy. */
(function (root) {
  'use strict';
  const CI = (root.CI = root.CI || {});

  /* Diagnosis families = groups of ICD-10-CM prefixes (no dots) that typically support a service. */
  CI.FAM = {
    dm: { label: 'Diabetes / glucose', p: ['E08', 'E09', 'E10', 'E11', 'E13', 'O24', 'R73', 'R631', 'E16', 'E66', 'Z131', 'Z794', 'Z7984', 'Z7985', 'Z833', 'Z8632', 'R824', 'R35', 'N08', 'H3'] },
    lipid: { label: 'Lipids / cardiometabolic', p: ['E78', 'E66', 'E10', 'E11', 'E13', 'E03', 'E88', 'I1', 'I2', 'I5', 'I6', 'I7', 'N18', 'K76', 'Z13220', 'Z824', 'Z8342', 'Z79899', 'Z7982'] },
    htn: { label: 'Hypertension / cardiorenal', p: ['I1', 'I2', 'I5', 'N18', 'R03', 'O10', 'O11', 'O13', 'O14', 'O16', 'E26', 'E27', 'Z8679', 'Z013'] },
    thyroid: { label: 'Thyroid / fatigue / weight', p: ['E00', 'E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E89', 'R946', 'R53', 'R63', 'R4', 'F32', 'F33', 'D64', 'E78', 'N91', 'N92', 'N95', 'L64', 'L65', 'R60', 'R00', 'Z79899', 'Z8639', 'Z1329', 'Z00'] },
    anemia: { label: 'Anemia / blood', p: ['D50', 'D51', 'D52', 'D53', 'D55', 'D56', 'D57', 'D58', 'D59', 'D6', 'D7', 'E53', 'E61', 'R53', 'R58', 'R71', 'K92', 'K62', 'N92', 'N93', 'N18', 'Z00', 'Z13', 'C9', 'R16', 'R59', 'O99', 'R23'] },
    b12: { label: 'B12 / folate deficiency', p: ['D51', 'D52', 'E53', 'K90', 'K91', 'D53', 'E538', 'G63', 'Z98'] },
    renal: { label: 'Kidney / urine chemistry', p: ['N0', 'N1', 'N2', 'E10', 'E11', 'E13', 'I12', 'I13', 'I1', 'R80', 'R31', 'R94', 'R82', 'R34', 'E87', 'E79', 'M10', 'Z79899', 'Z0000', 'Z00'] },
    uti: { label: 'Urinary', p: ['N30', 'N34', 'N39', 'N10', 'N12', 'N13', 'N20', 'N21', 'N23', 'N40', 'N41', 'R30', 'R31', 'R32', 'R33', 'R35', 'R36', 'R39', 'R82', 'R80', 'R10', 'R50', 'Z8744', 'O23', 'N76', 'N77', 'A59', 'E10', 'E11', 'Z01.4', 'Z00', 'Z32', 'Z34', 'Z33'] },
    preg: { label: 'Pregnancy / menstrual / reproductive', p: ['Z32', 'Z33', 'Z34', 'Z36', 'Z3A', 'O', 'N91', 'N92', 'N93', 'N97', 'N94', 'R10', 'R11', 'Z30', 'Z31', 'N95', 'E28', 'N80', 'R63', 'Z01.4', 'Z01.8', 'Z0001', 'Z0000'] },
    resp: { label: 'Respiratory', p: ['J', 'R05', 'R06', 'R09', 'R04', 'R07', 'R84', 'R91', 'B34', 'B37', 'U07', 'U09', 'A37', 'Z20', 'Z11', 'Z87891', 'F17', 'Z72', 'Z77', 'Z0000', 'Z0001', 'Z79', 'G47', 'I5', 'C34', 'D86', 'T78', 'Z01.8', 'Z02'] },
    strep: { label: 'Pharyngitis / strep', p: ['J02', 'J03', 'J36', 'R07', 'R50', 'J06', 'R59', 'B95', 'A38', 'Z20', 'Z8689', 'J04', 'R21', 'B27', 'R13', 'J35'] },
    flu: { label: 'Influenza-like illness', p: ['J09', 'J10', 'J11', 'J12', 'J06', 'J20', 'R05', 'R50', 'R51', 'R52', 'B34', 'U07', 'Z20', 'M79', 'R53', 'R11', 'J18', 'J22', 'R09', 'R06', 'J44', 'J45'] },
    covid: { label: 'COVID-19 / contact / screening', p: ['U07', 'U09', 'J12', 'B34', 'Z20822', 'Z1152', 'Z0000', 'Z0001', 'R05', 'R50', 'R06', 'R09', 'J06', 'J20', 'R43', 'R51', 'R52', 'M79', 'R53', 'R19', 'R11', 'Z03818', 'Z20', 'Z11', 'Z02'] },
    msk: { label: 'Musculoskeletal / injury', p: ['M', 'S', 'T14', 'T79', 'G56', 'G57', 'G54', 'G55', 'R25', 'R26', 'R29', 'R20', 'Q65', 'Q66', 'Q67', 'Q68', 'Q74', 'G89', 'Z47', 'Z96', 'Z98', 'Z09', 'Z44', 'Z45', 'Z46', 'Z48', 'Z51', 'Z79', 'Z91', 'W', 'X', 'V', 'Y'] },
    inj: { label: 'Injections (joint/tendon/trigger)', p: ['M0', 'M1', 'M2', 'M5', 'M6', 'M7', 'M8', 'S', 'G56', 'G57', 'G89'] },
    skin: { label: 'Skin / lesion', p: ['L', 'B00', 'B01', 'B02', 'B07', 'B08', 'B35', 'B36', 'B85', 'B86', 'C43', 'C44', 'D03', 'D04', 'D17', 'D18', 'D21', 'D22', 'D23', 'D48', 'D49', 'I83', 'I87', 'R21', 'R22', 'R23', 'Z12.83', 'Z85', 'Z08', 'Z87', 'A63', 'Z1283', 'Q82', 'Q83', 'Q84', 'T20', 'T21', 'T22', 'T23', 'T24', 'T25', 'W', 'S', 'E11', 'I70', 'Z48'] },
    wart: { label: 'Warts / premalignant / benign lesions', p: ['B07', 'A63', 'L57', 'L82', 'L85', 'L91', 'D22', 'D23', 'D48', 'D49', 'D03', 'D04', 'C44', 'L98', 'B08', 'D18', 'Z85', 'Z08'] },
    nail: { label: 'Nails / feet / debridement', p: ['B35', 'L60', 'L03', 'L97', 'L98', 'L89', 'E11', 'E10', 'I70', 'I73', 'I87', 'M20', 'M21', 'M72', 'M79', 'Q84', 'L84', 'L85', 'B07', 'S9', 'G6', 'E08', 'E13', 'Z86', 'Z79'] },
    wound: { label: 'Laceration / wound care', p: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'T1', 'T2', 'T3', 'W', 'X', 'Y', 'Z48', 'T81', 'L02', 'L03', 'L08', 'L97', 'L89', 'M79'] },
    abscess: { label: 'Abscess / foreign body / cyst', p: ['L02', 'L03', 'L05', 'L72', 'L73', 'L08', 'L98', 'N61', 'N75', 'N76', 'K61', 'K60', 'K64', 'M71', 'T14', 'T15', 'T16', 'T17', 'T18', 'T19', 'T78', 'S', 'W', 'X', 'M79', 'A41', 'B95', 'B96', 'B97'] },
    ear: { label: 'Ear / hearing', p: ['H6', 'H7', 'H8', 'H9', 'J01', 'J30', 'J32', 'Z01.1', 'Z011', 'R42', 'H81', 'H83', 'Z13.5', 'Z135', 'Z0012', 'Z0011', 'H5', 'Z00', 'T16', 'R09', 'R04'] },
    eye: { label: 'Eye / vision', p: ['H0', 'H1', 'H2', 'H3', 'H4', 'H5', 'E10', 'E11', 'Z010', 'Z135', 'Z0012', 'Z0011', 'Z00', 'Q1', 'T15', 'S05', 'G43', 'R51', 'Z9'] },
    ecg: { label: 'Cardiac / ECG', p: ['I', 'R00', 'R01', 'R03', 'R06', 'R07', 'R42', 'R53', 'R55', 'R94', 'R94.31', 'Z01810', 'Z0181', 'Z136', 'Z0000', 'Z0001', 'Z79899', 'Z8674', 'Z95', 'Z82', 'E78', 'E66', 'E1', 'F4', 'R60', 'R0', 'G47', 'T4', 'R22', 'R23', 'Z7901', 'Z7902', 'Z51', 'Z02', 'Z00', 'Z13'] },
    spiro: { label: 'Pulmonary function', p: ['J4', 'J3', 'J6', 'J8', 'R05', 'R06', 'R09', 'Z87891', 'F17', 'Z72', 'Z13', 'Z77', 'Z57', 'Z02', 'Z01', 'T78', 'D86', 'I5', 'Z79', 'Z0181', 'Z0000', 'Z0001', 'Z00'] },
    contra: { label: 'Contraception', p: ['Z30', 'Z31', 'Z32', 'Z33', 'Z34', 'Z79.3', 'Z793', 'N92', 'N94', 'N93', 'N80', 'E28', 'Z01.4', 'Z0141', 'Z0142', 'Z1', 'Z98', 'Z97', 'Z44', 'Z45'] },
    vacc: { label: 'Vaccination (Z23)', p: ['Z23'] },
    prev: { label: 'Preventive exam', p: ['Z00', 'Z01', 'Z02', 'Z76', 'Z71', 'Z13', 'Z11', 'Z12', 'Z23', 'Z68', 'Z72', 'Z86', 'Z87', 'Z80', 'Z82', 'Z83', 'Z84', 'Z79', 'Z28', 'Z91', 'Z59', 'Z63', 'Z60', 'Z56', 'Z55', 'Z57', 'Z65', 'Z73', 'Z74', 'Z78', 'Z99', 'Z0'] },
    colon: { label: 'Colorectal screening / evaluation', p: ['Z1211', 'Z1212', 'Z8601', 'Z800', 'K62', 'K92', 'K63', 'K57', 'K58', 'K59', 'K50', 'K51', 'K52', 'D12', 'D50', 'R19', 'R10', 'R15', 'D37', 'D01', 'C18', 'C19', 'C20', 'C21', 'R63', 'R94', 'Z00', 'Z12', 'R14'] },
    gyn: { label: 'Cervical / gyn screening', p: ['Z124', 'Z0141', 'Z0142', 'Z1151', 'Z113', 'Z114', 'N8', 'N9', 'R87', 'D06', 'D26', 'N76', 'N72', 'B97', 'Z0000', 'Z0001', 'Z01.4', 'Z01.8', 'Z30', 'Z7', 'N95', 'Z9', 'Z12'] },
    mammo: { label: 'Breast screening / evaluation', p: ['Z1231', 'Z803', 'Z8543', 'N6', 'R92', 'Z0000', 'Z0001', 'Z12', 'D05', 'C50', 'Z85', 'Z15', 'Z17'] },
    tobacco: { label: 'Tobacco', p: ['F17', 'Z720', 'Z716', 'Z87891', 'J4', 'I2', 'I7', 'C34', 'C32', 'C33', 'Z122', 'Z7', 'O99.33', 'O993', 'Z0000', 'Z0001', 'E11', 'Z71'] },
    alcohol: { label: 'Alcohol / substance', p: ['F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F18', 'F19', 'Z714', 'Z7141', 'Z7142', 'Z7151', 'Z7152', 'Z1331', 'Z1339', 'Z133', 'K70', 'K86', 'K29', 'Z0000', 'Z0001', 'Z7289', 'T51', 'R78', 'Z72', 'Z04', 'Z02'] },
    depress: { label: 'Depression / behavioral screening', p: ['Z1331', 'Z1332', 'Z1339', 'Z1340', 'F32', 'F33', 'F34', 'F41', 'F43', 'F90', 'F4', 'F5', 'F6', 'F8', 'F9', 'R45', 'R41', 'O99.34', 'Z0000', 'Z0001', 'Z0012', 'Z00121', 'Z00129', 'Z6', 'Z7', 'Z63', 'Z62', 'Z59', 'Z56', 'Z13', 'G47', 'Z91', 'F1', 'F0', 'F2', 'F3', 'R44', 'R46', 'R4', 'Z39'] },
    devscreen: { label: 'Developmental screening', p: ['Z1341', 'Z1342', 'Z1349', 'Z0012', 'Z00121', 'Z00129', 'Z0011', 'Z001', 'R62', 'F8', 'F9', 'F84', 'F90', 'R41', 'R48', 'R45', 'Z13', 'Z62', 'Z63', 'Z0'] },
    vision: { label: 'Vision screening', p: ['Z010', 'Z0012', 'Z00121', 'Z00129', 'Z0011', 'Z135', 'H5', 'H4', 'H3', 'H2', 'H1', 'H0', 'Z01.0', 'Z00', 'Z02', 'Z9'] },
    hearing: { label: 'Hearing screening', p: ['Z011', 'Z0012', 'Z00121', 'Z00129', 'Z0011', 'Z135', 'H6', 'H7', 'H8', 'H9', 'R94', 'Z01.1', 'Z00', 'Z02', 'Z9'] },
    lead: { label: 'Lead / TB / infectious screening', p: ['Z1388', 'Z7701', 'Z770', 'Z0012', 'Z00121', 'Z00129', 'Z0011', 'Z111', 'Z117', 'Z2001', 'Z201', 'Z203', 'Z11', 'Z13', 'A15', 'A16', 'A18', 'R76', 'T56', 'D50', 'D64', 'R62', 'F8', 'Z57', 'Z59', 'Z77', 'Z20', 'Z00'] },
    stis: { label: 'STI / viral screening', p: ['Z113', 'Z114', 'Z1159', 'Z1151', 'Z202', 'Z206', 'Z208', 'Z7251', 'Z7252', 'Z7253', 'A5', 'A6', 'B20', 'B18', 'B19', 'N34', 'N39', 'N41', 'N45', 'N49', 'N7', 'R30', 'R36', 'Z11', 'Z20', 'Z72', 'Z0000', 'Z0001', 'Z34', 'Z33', 'O98', 'K70', 'R74', 'R79'] },
    hcc: { label: 'Care management eligible (2+ chronic)', p: ['E10', 'E11', 'E13', 'E78', 'E66', 'E03', 'E05', 'E55', 'I10', 'I11', 'I12', 'I13', 'I20', 'I21', 'I25', 'I48', 'I50', 'I63', 'I69', 'I73', 'I82', 'J44', 'J45', 'J43', 'N18', 'N40', 'F32', 'F33', 'F41', 'F31', 'F20', 'F03', 'F10', 'F11', 'F90', 'G30', 'G31', 'G20', 'G40', 'G43', 'G47', 'G89', 'M05', 'M06', 'M10', 'M15', 'M16', 'M17', 'M19', 'M81', 'M32', 'K21', 'K50', 'K51', 'K58', 'K70', 'K74', 'B18', 'B20', 'C', 'D50', 'D51', 'D64', 'D68', 'D69', 'L40', 'L20', 'Z79', 'Z99', 'Z74', 'Z91', 'Z72', 'Z68', 'Z87', 'Z86', 'Z85', 'R54', 'R26', 'R41', 'R60', 'M54', 'E88', 'E87', 'E83', 'E21', 'E27', 'E28'] },
    advcare: { label: 'Advance care planning (any dx)', p: [''] },
    anydx: { label: 'Any diagnosis', p: [''] },
    ob: { label: 'Obstetric', p: ['O', 'Z34', 'Z3A', 'Z36', 'Z33', 'Z39'] },
    psych: { label: 'Behavioral health', p: ['F', 'Z13', 'Z63', 'Z62', 'Z71', 'R45', 'R46', 'R41', 'R44', 'G47', 'Z91', 'Z72', 'Z73', 'Z65', 'Z56', 'Z59', 'Z60', 'Z55', 'Z81', 'T14.91', 'X7', 'Z91.5', 'R4'] },
    cog: { label: 'Cognitive impairment', p: ['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'G30', 'G31', 'R41', 'R54', 'G20', 'G91', 'G93', 'Z91', 'Z73', 'Z74', 'Z63', 'Z8', 'Z13', 'Z00', 'Z0'] },
    sdoh: { label: 'Social determinants Z-codes', p: ['Z55', 'Z56', 'Z57', 'Z58', 'Z59', 'Z60', 'Z62', 'Z63', 'Z64', 'Z65'] },
    asthma: { label: 'Asthma / COPD', p: ['J4', 'J30', 'J45', 'J44', 'J43', 'J84', 'J96', 'R06', 'R05', 'R09', 'T78', 'D86', 'Q3', 'B34', 'J20', 'J21', 'J22', 'J18', 'J06'] },
    gi: { label: 'GI / abdominal', p: ['K', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'A0', 'B15', 'B16', 'B17', 'B18', 'B19', 'D12', 'D13', 'D37', 'Z12', 'Z86', 'Z87', 'Z80', 'E86', 'E87', 'E66', 'R63', 'R74', 'R94', 'Z71', 'Z0'] }
  };

  /* Compact row format: code|description|category|globalDays|families(comma)|ageMin-ageMax|sex|note
     global: 0, 10, 90 = surgical global; X = not applicable (XXX). */
  const ROWS = `
99202|New pt office visit - straightforward MDM or 15-29 min|E/M|X|||| Time 15+ min or straightforward MDM
99203|New pt office visit - low MDM or 30-44 min|E/M|X||||
99204|New pt office visit - moderate MDM or 45-59 min|E/M|X||||
99205|New pt office visit - high MDM or 60-74 min|E/M|X||||
99211|Est pt office visit - minimal / nurse visit|E/M|X||||Does not require physician presence; 'incident-to' supervision rules apply
99212|Est pt office visit - straightforward MDM or 10-19 min|E/M|X||||
99213|Est pt office visit - low MDM or 20-29 min|E/M|X||||
99214|Est pt office visit - moderate MDM or 30-39 min|E/M|X||||
99215|Est pt office visit - high MDM or 40-54 min|E/M|X||||
99417|Prolonged office service, each add'l 15 min (CPT)|E/M|X||||Add-on to 99205/99215 only, after the min time of that code is exceeded by 15 min (75 / 55 min total). Commercial/CPT rule; Medicare uses G2212
G2212|Prolonged office service, each add'l 15 min (Medicare)|E/M|X||||Medicare: after max time of 99205 (89 min) / 99215 (69 min)
G2211|Visit complexity add-on (longitudinal care relationship)|E/M|X||||Medicare add-on to 99202-99215 for ongoing primary care / serial care of a single serious or complex condition. Not payable with 25 unless other service is vaccine admin, AWV or Part B preventive
99381|Preventive visit, new, infant <1 yr|Preventive|X|prev|0-0||
99382|Preventive visit, new, 1-4 yrs|Preventive|X|prev|1-4||
99383|Preventive visit, new, 5-11 yrs|Preventive|X|prev|5-11||
99384|Preventive visit, new, 12-17 yrs|Preventive|X|prev|12-17||
99385|Preventive visit, new, 18-39 yrs|Preventive|X|prev|18-39||
99386|Preventive visit, new, 40-64 yrs|Preventive|X|prev|40-64||
99387|Preventive visit, new, 65+ yrs|Preventive|X|prev|65-120||Medicare does not cover routine physicals - use AWV / IPPE
99391|Preventive visit, est, infant <1 yr|Preventive|X|prev|0-0||
99392|Preventive visit, est, 1-4 yrs|Preventive|X|prev|1-4||
99393|Preventive visit, est, 5-11 yrs|Preventive|X|prev|5-11||
99394|Preventive visit, est, 12-17 yrs|Preventive|X|prev|12-17||
99395|Preventive visit, est, 18-39 yrs|Preventive|X|prev|18-39||
99396|Preventive visit, est, 40-64 yrs|Preventive|X|prev|40-64||
99397|Preventive visit, est, 65+ yrs|Preventive|X|prev|65-120||Medicare does not cover routine physicals - use AWV / IPPE
99401|Preventive counseling, individual, ~15 min|Counseling|X|prev|||Risk-factor counseling (not for a problem visit)
99402|Preventive counseling, individual, ~30 min|Counseling|X|prev||| 
99403|Preventive counseling, individual, ~45 min|Counseling|X|prev||| 
99404|Preventive counseling, individual, ~60 min|Counseling|X|prev||| 
99406|Tobacco cessation counseling 3-10 min|Counseling|X|tobacco||| Document time + content. Medicare covers with tobacco use / related condition
99407|Tobacco cessation counseling >10 min|Counseling|X|tobacco|||
99408|Alcohol/substance screening + brief intervention 15-30 min (SBIRT)|Counseling|X|alcohol|||
99409|Alcohol/substance screening + brief intervention >30 min|Counseling|X|alcohol|||
G0442|Annual alcohol misuse screening, 5-15 min (Medicare)|Counseling|X|alcohol||| Medicare once/yr
G0443|Brief alcohol misuse counseling, 15 min (Medicare)|Counseling|X|alcohol|||Up to 4/yr
G0444|Annual depression screening, 5-15 min (Medicare)|Screening|X|depress|||Medicare once/yr in primary care; not with initial AWV G0438 or IPPE
G0447|Obesity behavioral counseling, 15 min (Medicare)|Counseling|X|dm,lipid,thyroid|||BMI >=30; Medicare intensive behavioral therapy for obesity
G0136|SDOH risk assessment, 5-15 min (Medicare)|Screening|X|sdoh,anydx|||Standardized tool; can accompany E/M or AWV
G0402|Initial preventive physical exam (IPPE / Welcome to Medicare)|Medicare Wellness|X|prev||| Within first 12 months of Part B only; once per lifetime
G0438|Initial Annual Wellness Visit (Medicare)|Medicare Wellness|X|prev|||Once; not in first 12 months of Part B; includes HRA and personalized prevention plan
G0439|Subsequent Annual Wellness Visit (Medicare)|Medicare Wellness|X|prev|||Once every 12 months (11 full months after prior AWV)
99497|Advance care planning, first 30 min|Care Planning|X|anydx|||Min 16 min; voluntary; document who/what/time. Medicare covers; AWV: use modifier 33 and no cost share
99498|Advance care planning, each add'l 30 min|Care Planning|X|anydx|||Add-on to 99497
99483|Cognitive assessment & care plan|Care Planning|X|cog||| 60 min typical; Medicare
99495|Transitional care mgmt, moderate MDM, visit <=14 days|Care Mgmt|X|anydx||| Contact within 2 business days of discharge; bill once per 30 days
99496|Transitional care mgmt, high MDM, visit <=7 days|Care Mgmt|X|anydx|||
99490|Chronic care mgmt, clinical staff, first 20 min/mo|Care Mgmt|X|hcc|||2+ chronic conditions expected to last 12+ months; consent; care plan
99439|CCM, each add'l 20 min staff time|Care Mgmt|X|hcc|||Add-on to 99490 (max 2/mo Medicare)
99487|Complex CCM, first 60 min staff time|Care Mgmt|X|hcc|||Moderate/high MDM establishment or substantial revision of care plan
99489|Complex CCM, each add'l 30 min|Care Mgmt|X|hcc||| 
99491|CCM, physician/QHP personally, first 30 min|Care Mgmt|X|hcc|||
99437|CCM, physician/QHP, each add'l 30 min|Care Mgmt|X|hcc|||
99424|Principal care mgmt, physician/QHP, first 30 min|Care Mgmt|X|hcc|||Single high-risk chronic condition
99425|PCM physician/QHP, each add'l 30 min|Care Mgmt|X|hcc||| 
99426|PCM clinical staff, first 30 min|Care Mgmt|X|hcc||| 
99427|PCM clinical staff, each add'l 30 min|Care Mgmt|X|hcc||| 
G0556|Advanced primary care mgmt (APCM) level 1|Care Mgmt|X|hcc|||Medicare 2025+ monthly bundled primary care; check eligibility and overlap rules
G0557|APCM level 2|Care Mgmt|X|hcc||| 
G0558|APCM level 3 (QMB)|Care Mgmt|X|hcc||| 
99453|Remote physiologic monitoring - device setup/education|Care Mgmt|X|hcc,htn,dm|||One-time per episode
99454|RPM device supply, 30-day (16+ days data)|Care Mgmt|X|hcc,htn,dm||| 
99457|RPM treatment mgmt, first 20 min/mo|Care Mgmt|X|hcc,htn,dm||| Interactive communication required
99458|RPM treatment mgmt, each add'l 20 min|Care Mgmt|X|hcc,htn,dm||| 
99484|Behavioral health integration, 20+ min/mo|Care Mgmt|X|psych|||
99492|Psychiatric CoCM, first month (70 min)|Care Mgmt|X|psych||| 
99493|Psychiatric CoCM, subsequent month (60 min)|Care Mgmt|X|psych||| 
99494|Psychiatric CoCM, each add'l 30 min|Care Mgmt|X|psych||| 
99421|Online digital E/M, 5-10 min / 7 days|Virtual|X|anydx|||Patient-initiated portal message with clinician time
99422|Online digital E/M, 11-20 min|Virtual|X|anydx||| 
99423|Online digital E/M, 21+ min|Virtual|X|anydx||| 
98016|Brief virtual check-in (Medicare, 2025+)|Virtual|X|anydx|||Replaces/overlaps G2012 on many fee schedules; verify payer
G2012|Brief virtual check-in 5-10 min|Virtual|X|anydx|||Not if from an E/M within 7 days or leading to E/M within 24 h
99221|Initial hospital care, straightforward/low|Hospital|X|anydx|||POS 21/22/19
99222|Initial hospital care, moderate|Hospital|X|anydx||| 
99223|Initial hospital care, high|Hospital|X|anydx||| 
99231|Subsequent hospital care, straightforward/low|Hospital|X|anydx||| 
99232|Subsequent hospital care, moderate|Hospital|X|anydx||| 
99233|Subsequent hospital care, high|Hospital|X|anydx||| 
99238|Hospital discharge day mgmt <=30 min|Hospital|X|anydx||| 
99239|Hospital discharge day mgmt >30 min|Hospital|X|anydx||| 
99304|Initial nursing facility care, low|SNF/Home|X|anydx|||POS 31/32
99305|Initial nursing facility care, moderate|SNF/Home|X|anydx||| 
99306|Initial nursing facility care, high|SNF/Home|X|anydx||| 
99307|Subsequent NF care, straightforward|SNF/Home|X|anydx||| 
99308|Subsequent NF care, low|SNF/Home|X|anydx||| 
99309|Subsequent NF care, moderate|SNF/Home|X|anydx||| 
99310|Subsequent NF care, high|SNF/Home|X|anydx||| 
99341|Home/residence visit, new pt, straightforward|SNF/Home|X|anydx|||POS 12/13/14 etc
99342|Home/residence visit, new pt, low|SNF/Home|X|anydx||| 
99344|Home/residence visit, new pt, moderate|SNF/Home|X|anydx||| 
99345|Home/residence visit, new pt, high|SNF/Home|X|anydx||| 
99347|Home/residence visit, est pt, straightforward|SNF/Home|X|anydx||| 
99348|Home/residence visit, est pt, low|SNF/Home|X|anydx||| 
99349|Home/residence visit, est pt, moderate|SNF/Home|X|anydx||| 
99350|Home/residence visit, est pt, high|SNF/Home|X|anydx||| 
10060|I&D abscess, simple|Procedure|10|abscess|||
10061|I&D abscess, complicated or multiple|Procedure|10|abscess||| 
10120|Remove foreign body, subcutaneous, simple|Procedure|10|abscess||| 
11055|Paring/cutting benign hyperkeratotic lesion, single|Procedure|0|nail||| Medicare: needs systemic condition for coverage (routine foot care rules)
11056|Paring benign hyperkeratotic lesions, 2-4|Procedure|0|nail||| 
11057|Paring benign hyperkeratotic lesions, >4|Procedure|0|nail||| 
11102|Tangential skin biopsy, single lesion|Procedure|0|skin|||Pathology 88305 billed by lab; each lesion
11103|Tangential skin biopsy, each add'l lesion|Procedure|X|skin||| 
11104|Punch skin biopsy, single lesion|Procedure|0|skin||| 
11105|Punch skin biopsy, each add'l lesion|Procedure|X|skin||| 
11106|Incisional skin biopsy, single lesion|Procedure|0|skin||| 
11107|Incisional skin biopsy, each add'l lesion|Procedure|X|skin||| 
11200|Removal of skin tags, up to 15|Procedure|10|wart|||Often cosmetic - payers need symptomatic documentation (bleeding, irritation)
11201|Removal of skin tags, each add'l 10|Procedure|X|wart||| 
11300|Shave epidermal/dermal lesion trunk/arms/legs <=0.5 cm|Procedure|0|skin||| Size is the lesion diameter, not margin
11301|Shave lesion trunk/arms/legs 0.6-1.0 cm|Procedure|0|skin||| 
11302|Shave lesion trunk/arms/legs 1.1-2.0 cm|Procedure|0|skin||| 
11305|Shave lesion scalp/neck/hands/feet/genitalia <=0.5 cm|Procedure|0|skin||| 
11400|Excision benign lesion trunk/arms/legs <=0.5 cm|Procedure|10|skin||| 
11401|Excision benign lesion trunk/arms/legs 0.6-1.0 cm|Procedure|10|skin||| 
11402|Excision benign lesion trunk/arms/legs 1.1-2.0 cm|Procedure|10|skin||| 
11719|Trimming of nondystrophic nails|Procedure|X|nail|||Usually non-covered/routine foot care
11720|Debridement of nails, 1-5|Procedure|0|nail||| Medicare needs class findings (Q7/Q8/Q9) and systemic dx
11721|Debridement of nails, 6 or more|Procedure|0|nail||| 
11730|Avulsion nail plate, single|Procedure|0|nail||| 
11765|Wedge excision skin of nail fold (ingrown nail)|Procedure|10|nail||| 
11900|Intralesional injection, up to 7 lesions|Procedure|0|skin||| 
11901|Intralesional injection, >7 lesions|Procedure|0|skin||| 
11981|Insert drug-delivery implant (e.g., contraceptive)|Procedure|X|contra|||Bill implant supply separately (J7307)
11982|Remove drug-delivery implant|Procedure|X|contra||| 
11983|Remove with reinsertion of implant|Procedure|X|contra||| 
12001|Simple repair superficial wound <=2.5 cm|Procedure|0|wound||| Total length of same-complexity repairs in same anatomic group
12002|Simple repair 2.6-7.5 cm|Procedure|0|wound||| 
12004|Simple repair 7.6-12.5 cm|Procedure|0|wound||| 
12011|Simple repair face/ears/lips <=2.5 cm|Procedure|0|wound||| 
12031|Intermediate repair (layered) <=2.5 cm trunk/extremities|Procedure|10|wound||| Requires layered closure documentation
12032|Intermediate repair 2.6-7.5 cm|Procedure|10|wound||| 
12051|Intermediate repair face/ears <=2.5 cm|Procedure|10|wound||| 
17000|Destruction premalignant lesion (e.g., AK), first|Procedure|10|wart|||
17003|Destruction premalignant lesions, 2-14, each|Procedure|X|wart||| Add-on; report 17000 + 17003 x (n-1)
17004|Destruction premalignant lesions, 15+|Procedure|10|wart||| 
17110|Destruction benign lesions (warts), up to 14|Procedure|10|wart||| 
17111|Destruction benign lesions (warts), 15+|Procedure|10|wart||| 
17250|Chemical cauterization of granulation tissue|Procedure|0|wound||| 
20550|Injection tendon sheath/ligament/aponeurosis (e.g., plantar fascia)|Procedure|0|inj||| 
20551|Injection tendon origin/insertion|Procedure|0|inj||| 
20552|Trigger point injection, 1-2 muscles|Procedure|0|inj||| 
20553|Trigger point injection, 3+ muscles|Procedure|0|inj||| 
20600|Arthrocentesis/injection small joint (no US)|Procedure|0|inj||| 
20604|Arthrocentesis/injection small joint with US guidance|Procedure|0|inj||| Needs permanent image + report
20605|Arthrocentesis/injection intermediate joint (no US)|Procedure|0|inj||| 
20606|Arthrocentesis/injection intermediate joint with US|Procedure|0|inj||| 
20610|Arthrocentesis/injection major joint (no US) e.g., knee/shoulder|Procedure|0|inj|||Bill drug separately (J-code). Bilateral = 50 or RT/LT x2 lines per payer
20611|Arthrocentesis/injection major joint with US guidance|Procedure|0|inj||| 
29125|Short arm splint, static|Procedure|0|msk||| 
29130|Finger splint, static|Procedure|0|msk||| 
29515|Short leg splint (calf to foot)|Procedure|0|msk||| 
29540|Strapping, ankle and/or foot|Procedure|0|msk||| 
30901|Control anterior nosebleed, simple|Procedure|0|resp,ear||| 
36415|Venipuncture, routine|Lab|X|anydx|||Usually bundled for some payers; Medicare pays a collection fee
36416|Capillary blood collection|Lab|X|anydx||| 
46083|Incise thrombosed external hemorrhoid|Procedure|10|gi||| 
51701|Insert non-indwelling bladder catheter|Procedure|X|uti||| 
51798|Post-void residual by bladder scan|Procedure|X|uti||| 
58300|Insertion of IUD|Procedure|X|contra|||Bill device separately (J7296-J7298, J7300, J7301); pair with Z30.430
58301|Removal of IUD|Procedure|X|contra|||Z30.432
69200|Remove foreign body, external auditory canal|Procedure|0|ear||| 
69210|Removal of impacted cerumen, instrumentation, unilateral|Procedure|0|ear|||Dx H61.2-; bilateral = modifier 50 (or per payer 69210 x1 with 50)
76536|Ultrasound soft tissues head & neck (thyroid)|Imaging/Diag|X|thyroid||| 
76705|Ultrasound abdomen limited|Imaging/Diag|X|gi||| 
76881|Ultrasound extremity joint complete|Imaging/Diag|X|msk||| 
76882|Ultrasound extremity limited|Imaging/Diag|X|msk||| 
71045|Chest X-ray single view|Imaging/Diag|X|resp|||Global; -26/-TC split depends on POS
71046|Chest X-ray 2 views|Imaging/Diag|X|resp||| 
73030|X-ray shoulder, min 2 views|Imaging/Diag|X|msk||| 
73560|X-ray knee, 1-2 views|Imaging/Diag|X|msk||| 
73610|X-ray ankle, min 3 views|Imaging/Diag|X|msk||| 
72100|X-ray lumbosacral spine, 2-3 views|Imaging/Diag|X|msk||| 
93000|ECG, 12-lead with interpretation and report|Imaging/Diag|X|ecg|||Global. Use 93005 (tracing) or 93010 (interp) when split
93005|ECG tracing only|Imaging/Diag|X|ecg||| 
93010|ECG interpretation and report only|Imaging/Diag|X|ecg||| 
93784|Ambulatory BP monitoring, 24 h, complete|Imaging/Diag|X|htn|||
94010|Spirometry|Imaging/Diag|X|spiro|||
94060|Bronchodilation responsiveness spirometry pre/post|Imaging/Diag|X|spiro||| Includes 94010 - do not bill together
94640|Nebulizer treatment / aerosol|Imaging/Diag|X|asthma||| Drug supply J-code separately (e.g., J7613 albuterol)
94664|Demonstration/eval of inhaler technique|Imaging/Diag|X|asthma||| 
94760|Pulse oximetry, single|Imaging/Diag|X|resp|||Bundled into E/M for most payers - do not bill separately
94761|Pulse oximetry, multiple|Imaging/Diag|X|resp||| Bundled for most payers
96110|Developmental screening with scoring (e.g., ASQ, M-CHAT)|Screening|X|devscreen|||Per instrument; Medicaid EPSDT commonly pays
96127|Brief emotional/behavioral assessment with scoring (PHQ-9, GAD-7)|Screening|X|depress|||Per instrument; units are number of instruments administered
96160|Patient-focused health risk assessment instrument|Screening|X|prev,depress||| 
96161|Caregiver-focused health risk assessment instrument|Screening|X|prev,depress,devscreen|||E.g., maternal depression screening at infant visits (Z13.32 / baby chart)
99173|Visual acuity screening, quantitative|Screening|X|vision||| 
92551|Hearing screen, pure tone air only|Screening|X|hearing||| 
99188|Topical fluoride varnish application|Screening|X|prev|0-5||Typically age <=5 (payer dependent); Z29.3 with Z00.12-
96372|Therapeutic/prophylactic/diagnostic injection IM or SQ|Procedure|X|anydx|||Not for vaccines. Bill drug supply separately
96365|IV infusion for therapy, first hour|Procedure|X|anydx||| 
96374|IV push, single/initial drug|Procedure|X|anydx||| 
J3420|Vitamin B-12 injection, up to 1000 mcg|Drug|X|b12|||Dx must support deficiency / malabsorption, not 'fatigue'
J3301|Triamcinolone acetonide (Kenalog), per 10 mg|Drug|X|inj,skin,asthma||| 40 mg = 4 units
J1030|Methylprednisolone acetate 40 mg|Drug|X|inj,asthma,skin|||
J1040|Methylprednisolone acetate 80 mg|Drug|X|inj,asthma,skin||| 
J0702|Betamethasone acetate/sodium phosphate, up to 3 mg|Drug|X|inj,asthma,skin|||
J0696|Ceftriaxone sodium, per 250 mg|Drug|X|resp,uti,ear,skin|||250 mg/unit: 1 g = 4 units
J1885|Ketorolac tromethamine, per 15 mg|Drug|X|msk,gi||| 
J1100|Dexamethasone sodium phosphate, 1 mg|Drug|X|asthma,resp,skin||| 
J2550|Promethazine HCl, up to 50 mg|Drug|X|gi||| 
J7296|Levonorgestrel IUD (Kyleena)|Drug|X|contra||| 
J7297|Levonorgestrel IUD 52 mg (Liletta, 3 yr)|Drug|X|contra||| 
J7298|Levonorgestrel IUD 52 mg (Mirena, 8 yr)|Drug|X|contra||| 
J7300|Copper IUD (ParaGard)|Drug|X|contra||| 
J7307|Etonogestrel implant (Nexplanon)|Drug|X|contra||| 
J1050|Medroxyprogesterone acetate 1 mg (Depo-Provera CI 150 mg = 150 units)|Drug|X|contra||| Pair with 96372
90460|Immunization admin <=18 y with counseling, first component|Vaccine|X|vacc|0-18||Requires physician/QHP counseling; 90461 each add'l component
90461|Immunization admin <=18 y with counseling, each add'l component|Vaccine|X|vacc|0-18|| 
90471|Immunization admin, 1 vaccine (IM/SQ)|Vaccine|X|vacc|||Report with the vaccine product code; Medicare flu/pneumo/hepB use G0008/9/10
90472|Immunization admin, each additional vaccine|Vaccine|X|vacc||| 
90473|Immunization admin, intranasal/oral, 1 vaccine|Vaccine|X|vacc||| 
90474|Immunization admin, intranasal/oral, each additional|Vaccine|X|vacc||| 
G0008|Admin of influenza vaccine (Medicare)|Vaccine|X|vacc|||Pair with flu product code, Z23
G0009|Admin of pneumococcal vaccine (Medicare)|Vaccine|X|vacc||| 
G0010|Admin of hepatitis B vaccine (Medicare)|Vaccine|X|vacc||| 
90686|Influenza vaccine, quadrivalent (IIV4), preservative-free, 6 mo+|Vaccine|X|vacc|||Product code - no E/M implied
90694|Influenza vaccine, adjuvanted (IIV4)|Vaccine|X|vacc|65-120||65+ 
90662|Influenza vaccine, high-dose|Vaccine|X|vacc|65-120||65+ 
90715|Tdap vaccine, age 7+|Vaccine|X|vacc|7-120||
90714|Td vaccine, preservative-free, age 7+|Vaccine|X|vacc|7-120||
90732|Pneumococcal polysaccharide vaccine (PPSV23)|Vaccine|X|vacc||| 
90677|Pneumococcal conjugate vaccine 20-valent (PCV20)|Vaccine|X|vacc|||
90750|Zoster vaccine recombinant (Shingrix)|Vaccine|X|vacc|18-120||Medicare Part D covered - often billed via pharmacy; Part B if not
90651|HPV vaccine, 9-valent|Vaccine|X|vacc|9-45||
90670|Pneumococcal conjugate vaccine 13-valent|Vaccine|X|vacc||| 
90707|MMR vaccine|Vaccine|X|vacc||| 
90716|Varicella vaccine|Vaccine|X|vacc||| 
90633|Hepatitis A vaccine, pediatric/adolescent, 2 dose|Vaccine|X|vacc|0-18||
90636|Hepatitis A/B combined vaccine, adult|Vaccine|X|vacc|18-120||
90746|Hepatitis B vaccine, adult|Vaccine|X|vacc|18-120||
90744|Hepatitis B vaccine, pediatric/adolescent|Vaccine|X|vacc|0-19||
90700|DTaP vaccine, <7 yrs|Vaccine|X|vacc|0-6||
90710|MMRV vaccine|Vaccine|X|vacc|1-12||
90713|Poliovirus vaccine (IPV)|Vaccine|X|vacc||| 
90734|Meningococcal conjugate vaccine (MenACWY)|Vaccine|X|vacc|2-120||
90678|RSV vaccine (adult)|Vaccine|X|vacc|50-120||Age/risk criteria follow current ACIP guidance
90679|RSV vaccine (adult, adjuvanted)|Vaccine|X|vacc|50-120||Age/risk criteria follow current ACIP guidance
81002|Urinalysis, non-automated, no microscopy|Lab|X|uti,renal|||CLIA-waived; no QW required
81003|Urinalysis, automated, no microscopy|Lab|X|uti,renal|||CLIA-waived (QW)
81025|Urine pregnancy test, visual color comparison|Lab|X|preg|||CLIA-waived; no QW required
82270|Fecal occult blood, guaiac, 1-3 cards (screening)|Lab|X|colon||| 
82962|Glucose, blood, by glucose monitoring device (fingerstick)|Lab|X|dm||| CLIA-waived; not for screening
82947|Glucose, quantitative blood|Lab|X|dm|||
82948|Glucose, blood, reagent strip|Lab|X|dm||| 
82465|Cholesterol, total|Lab|X|lipid||| 
83036|Hemoglobin A1c|Lab|X|dm||| QW if waived POC analyzer. Medicare: dx of diabetes or prediabetes monitoring/screening
84443|TSH|Lab|X|thyroid||| 
85018|Hemoglobin|Lab|X|anemia||| QW if waived
85025|CBC with automated differential|Lab|X|anemia||| 
80053|Comprehensive metabolic panel|Lab|X|renal,dm,htn,lipid||| 
80048|Basic metabolic panel|Lab|X|renal,dm,htn||| 
80061|Lipid panel|Lab|X|lipid|||Medicare screening: Z13.220 frequency rules (every 5 yrs)
86580|TB skin test (PPD) intradermal|Lab|X|lead|||Needs read visit documentation
86308|Heterophile antibody (mono) screen|Lab|X|strep||| 
86701|HIV-1 antibody|Lab|X|stis||| 
86803|Hepatitis C antibody|Lab|X|stis|||Screen: Z11.59
87389|HIV-1 Ag/Ab combo|Lab|X|stis|||Screen Z11.4
87491|Chlamydia amplified probe|Lab|X|stis||| 
87591|Gonorrhea amplified probe|Lab|X|stis||| 
87804|Influenza A/B rapid antigen|Lab|X|flu|||QW
87811|SARS-CoV-2 rapid antigen|Lab|X|covid|||QW; screening vs diagnostic dx matter to payer
87880|Strep A rapid antigen|Lab|X|strep|||QW
87086|Urine culture, colony count|Lab|X|uti|||
81099|Unlisted urinalysis|Lab|X|uti||| 
81528|Colorectal cancer screening, stool DNA (Cologuard)|Lab|X|colon|45-85||Z12.11; Medicare ages 45-85; every 3 yrs
G0328|Fecal immunoassay colorectal screening (FIT)|Lab|X|colon|45-120||Medicare annual
G0105|Colorectal screening colonoscopy, high risk|Imaging/Diag|X|colon||| 
77067|Screening mammography, bilateral|Imaging/Diag|X|mammo|40-120|F| Z12.31
77080|DXA bone density, axial|Imaging/Diag|X|anydx|||Z13.820 screening
Q0091|Pap smear specimen collection / screening pelvic|Procedure|X|gyn||F|Z01.411 / Z01.419 / Z12.4
G0101|Cervical/vaginal cancer screening, pelvic and breast exam|Procedure|X|gyn||F|Medicare every 24 months (12 if high risk)
G0123|Cervical cytology screening, thin layer, physician interp|Lab|X|gyn||F|
88142|Cervical cytology, thin layer prep, automated|Lab|X|gyn||F|
88175|Cervical cytology with computer screening|Lab|X|gyn||F|
87624|HPV high-risk types, amplified probe|Lab|X|gyn||F|
88305|Surgical pathology, gross and microscopic (level IV)|Lab|X|skin|||Billed by pathologist/lab - not by FM unless in-house path
59400|Routine OB care incl. antepartum, vaginal delivery, postpartum|OB|X|ob||F|Global OB. FM must provide the delivery to use
59425|Antepartum care only, 4-6 visits|OB|X|ob||F|If not delivering
59426|Antepartum care only, 7+ visits|OB|X|ob||F|
59430|Postpartum care only|OB|X|ob||F|
3074F|Most recent systolic BP <130 (CPT II quality)|Quality|X||||Report with BP value in same encounter; $0.01 charge typical
3075F|Most recent systolic BP 130-139|Quality|X|||| 
3077F|Most recent systolic BP >=140|Quality|X|||| 
3078F|Most recent diastolic BP <80|Quality|X|||| 
3079F|Most recent diastolic BP 80-89|Quality|X|||| 
3080F|Most recent diastolic BP >=90|Quality|X|||| 
3044F|Most recent HbA1c <7.0%|Quality|X|||| 
3051F|Most recent HbA1c 7.0-7.9%|Quality|X|||| 
3052F|Most recent HbA1c 8.0-9.0%|Quality|X|||| 
3046F|Most recent HbA1c >9.0%|Quality|X|||| 
2022F|Dilated retinal exam with interpretation by eye specialist, documented|Quality|X|||| 
3066F|Documentation of treatment for nephropathy|Quality|X|||| 
G8431|Positive depression screen with documented follow-up plan|Quality|X|||| 
G8510|Negative depression screen, no follow-up needed|Quality|X|||| 
`;

  CI.CPT = {};
  ROWS.split('\n').forEach(function (line) {
    line = line.trim();
    if (!line) return;
    const f = line.split('|');
    const age = (f[5] || '').trim().split('-');
    CI.CPT[f[0]] = {
      code: f[0],
      desc: f[1],
      cat: f[2],
      global: f[3],
      fam: f[4] ? f[4].split(',') : [],
      age: age.length === 2 && age[0] !== '' ? [parseInt(age[0], 10), parseInt(age[1], 10)] : null,
      sex: (f[6] || '').trim() || null,
      note: (f.slice(7).join('|') || '').trim()
    };
  });

  /* Convenience code groups used by the rules engine */
  CI.G = {
    newEM: ['99202', '99203', '99204', '99205'],
    estEM: ['99211', '99212', '99213', '99214', '99215'],
    prevNew: ['99381', '99382', '99383', '99384', '99385', '99386', '99387'],
    prevEst: ['99391', '99392', '99393', '99394', '99395', '99396', '99397'],
    hospital: ['99221', '99222', '99223', '99231', '99232', '99233', '99238', '99239'],
    nf: ['99304', '99305', '99306', '99307', '99308', '99309', '99310'],
    home: ['99341', '99342', '99344', '99345', '99347', '99348', '99349', '99350'],
    awv: ['G0402', 'G0438', 'G0439'],
    vaccAdmin: ['90460', '90461', '90471', '90472', '90473', '90474', 'G0008', 'G0009', 'G0010'],
    fluProd: ['90630', '90653', '90654', '90656', '90658', '90660', '90661', '90662', '90672', '90673', '90674', '90682', '90685', '90686', '90687', '90688', '90694', '90756'],
    pneumoProd: ['90669', '90670', '90671', '90677', '90732'],
    hepBProd: ['90739', '90740', '90743', '90744', '90746', '90747', '90748'],
    qwCodes: ['81003', '83036', '85018', '82465', '82947', '82948', '80061', '86308', '87804', '87811', '87880'],
    bundledNoPay: ['94760', '94761', '99000', '99002', '99070'],
    adminOnlyPreventiveMcareExcl: ['99381', '99382', '99383', '99384', '99385', '99386', '99387', '99391', '99392', '99393', '99394', '99395', '99396', '99397'],
    drugAdmin: ['96372', '96365', '96374', '20550', '20551', '20552', '20553', '20600', '20604', '20605', '20606', '20610', '20611', '11900', '11901', '94640']
  };
  CI.G.fluProd.concat(CI.G.pneumoProd, CI.G.hepBProd).forEach(function (c) {
    if (!CI.CPT[c]) CI.CPT[c] = { code: c, desc: 'Vaccine product code', cat: 'Vaccine', global: 'X', fam: ['vacc'], age: null, sex: null, note: '' };
  });
  CI.G.prevAll = CI.G.prevNew.concat(CI.G.prevEst);
  CI.G.em = CI.G.newEM.concat(CI.G.estEM);
  CI.G.prevOrAwv = CI.G.prevAll.concat(CI.G.awv);
})(typeof window !== 'undefined' ? window : globalThis);
