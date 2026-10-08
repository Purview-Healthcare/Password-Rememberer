/* ICD-10-CM subset focused on family medicine + documentation/specificity coaching.
   Row: code|description|chapter|flags|tip
   flags: H = typically risk-adjusting (HCC-relevant; model version matters - verify), U = "unspecified/low specificity", P = cannot be first-listed */
(function (root) {
  'use strict';
  const CI = (root.CI = root.CI || {});

  const ROWS = `
I10|Essential (primary) hypertension|Circulatory||If CKD present use I12.-, with heart failure I11.-, both I13.- (ICD-10-CM presumes the link)
I11.0|Hypertensive heart disease with heart failure|Circulatory|H|Add I50.- to specify HF type/acuity
I11.9|Hypertensive heart disease without heart failure|Circulatory||
I12.9|Hypertensive CKD, stage 1-4 or unspecified CKD|Circulatory||Add N18.1-N18.4 / N18.9
I13.10|Hypertensive heart and CKD, no HF, stage 1-4|Circulatory||Add N18.-
I13.0|Hypertensive heart and CKD with HF, stage 1-4|Circulatory|H|Add I50.- and N18.-
I25.10|Atherosclerotic heart disease of native coronary artery, no angina|Circulatory||
I48.91|Unspecified atrial fibrillation|Circulatory|HU|Specify: I48.0 paroxysmal, I48.11/I48.19 persistent, I48.20 chronic unspec., I48.21 permanent
I48.0|Paroxysmal atrial fibrillation|Circulatory|H|Add Z79.01 if on anticoagulant
I48.21|Permanent atrial fibrillation|Circulatory|H|
I50.9|Heart failure, unspecified|Circulatory|HU|Specify systolic / diastolic / combined AND acuity (I50.22, I50.32, I50.42 chronic)
I50.22|Chronic systolic (congestive) heart failure|Circulatory|H|
I50.32|Chronic diastolic (congestive) heart failure|Circulatory|H|
I73.9|Peripheral vascular disease, unspecified|Circulatory|HU|Specify I70.2-, atherosclerosis of native arteries, if documented
I87.2|Venous insufficiency (chronic)(peripheral)|Circulatory||
E11.9|Type 2 diabetes mellitus without complications|Endocrine|H|Document any complications (CKD, neuropathy, retinopathy, hyperglycemia) so they can be coded. Add Z79.4 / Z79.84 / Z79.85 for therapy
E11.65|Type 2 DM with hyperglycemia|Endocrine|H|Use when documented 'uncontrolled/poorly controlled, hyperglycemia'. 'Uncontrolled' alone is not codable
E11.22|Type 2 DM with diabetic chronic kidney disease|Endocrine|H|Add N18.- stage. 'With' convention links DM + CKD automatically
E11.21|Type 2 DM with diabetic nephropathy|Endocrine|H|
E11.40|Type 2 DM with diabetic neuropathy, unspecified|Endocrine|HU|Specify polyneuropathy E11.42, mononeuropathy E11.41, autonomic E11.43
E11.42|Type 2 DM with diabetic polyneuropathy|Endocrine|H|
E11.319|Type 2 DM with unspecified diabetic retinopathy without macular edema|Endocrine|HU|Specify severity (mild/moderate/severe NPDR, PDR)
E11.51|Type 2 DM with diabetic peripheral angiopathy without gangrene|Endocrine|H|
E11.621|Type 2 DM with foot ulcer|Endocrine|H|Add L97.- for site/depth
E11.649|Type 2 DM with hypoglycemia without coma|Endocrine|H|
E10.9|Type 1 diabetes mellitus without complications|Endocrine|H|Z79.4 if on insulin
E10.65|Type 1 DM with hyperglycemia|Endocrine|H|
E13.9|Other specified diabetes mellitus without complications|Endocrine|H|
R73.03|Prediabetes|Symptoms||
R73.01|Impaired fasting glucose|Symptoms||
R73.09|Other abnormal glucose|Symptoms||
E66.9|Obesity, unspecified|Endocrine|U|FY2025+: E66.811 / E66.812 / E66.813 = obesity class 1 / 2 / 3. Add Z68.- BMI. BMI alone cannot be coded without a provider-documented weight diagnosis
E66.811|Obesity, class 1|Endocrine||Add Z68.30-Z68.34 (BMI 30-34.9)
E66.812|Obesity, class 2|Endocrine||Add Z68.35-Z68.39
E66.813|Obesity, class 3|Endocrine|H|Add Z68.41-Z68.45
E66.01|Morbid (severe) obesity due to excess calories|Endocrine|H|Add Z68.35+ / Z68.41+
E66.3|Overweight|Endocrine||Add Z68.25-Z68.29
Z68.1|BMI 19.9 or less, adult|Factors|P|BMI codes are secondary only - need an associated weight dx
Z68.25|BMI 25.0-25.9, adult|Factors|P|
Z68.30|BMI 30.0-30.9, adult|Factors|P|
Z68.35|BMI 35.0-35.9, adult|Factors|P|
Z68.41|BMI 40.0-44.9, adult|Factors|HP|
Z68.54|BMI pediatric, >=95th percentile for age|Factors|P|
E78.5|Hyperlipidemia, unspecified|Endocrine|U|Specify: E78.00 pure hypercholesterolemia, E78.2 mixed, E78.1 hypertriglyceridemia, E78.49 other
E78.00|Pure hypercholesterolemia, unspecified|Endocrine||
E78.2|Mixed hyperlipidemia|Endocrine||
E78.1|Pure hyperglyceridemia|Endocrine||
E78.49|Other hyperlipidemia|Endocrine||
E03.9|Hypothyroidism, unspecified|Endocrine|U|If Hashimoto's E06.3; post-ablative E89.0; add Z79.899 for levothyroxine monitoring
E03.8|Other specified hypothyroidism|Endocrine||
E06.3|Autoimmune thyroiditis|Endocrine||
E05.90|Thyrotoxicosis, unspecified, without crisis|Endocrine|U|
E04.1|Nontoxic single thyroid nodule|Endocrine||
E55.9|Vitamin D deficiency, unspecified|Endocrine|U|
E53.8|Deficiency of other specified B group vitamins (incl. B12)|Endocrine||Supports J3420 / B12 labs
E61.1|Iron deficiency|Endocrine||
E87.6|Hypokalemia|Endocrine||
E87.1|Hypo-osmolality and hyponatremia|Endocrine||
E79.0|Hyperuricemia without inflammatory arthritis|Endocrine||
E28.2|Polycystic ovarian syndrome|Endocrine||
D50.9|Iron deficiency anemia, unspecified|Blood|U|Document cause: D50.0 blood loss, D50.8 other
D50.0|Iron deficiency anemia secondary to blood loss (chronic)|Blood||
D51.0|Vitamin B12 deficiency anemia due to intrinsic factor deficiency|Blood||Pernicious anemia
D51.9|Vitamin B12 deficiency anemia, unspecified|Blood|U|
D64.9|Anemia, unspecified|Blood|U|Work up and specify type (iron, B12, chronic disease D63.-, CKD D63.1)
D63.1|Anemia in chronic kidney disease|Blood||Code first N18.-
D72.829|Elevated white blood cell count, unspecified|Blood|U|
D69.6|Thrombocytopenia, unspecified|Blood|U|
N18.30|CKD stage 3 unspecified|Genitourinary|HU|Specify 3a (N18.31) or 3b (N18.32); invalid 3-5 character N18.3 since FY2021
N18.31|CKD stage 3a|Genitourinary|H|
N18.32|CKD stage 3b|Genitourinary|H|
N18.4|CKD stage 4|Genitourinary|H|
N18.5|CKD stage 5|Genitourinary|H|
N18.6|End stage renal disease|Genitourinary|H|Add Z99.2 dialysis status
N18.1|CKD stage 1|Genitourinary||
N18.2|CKD stage 2 (mild)|Genitourinary||
N18.9|CKD, unspecified|Genitourinary|U|Stage it: eGFR + albuminuria
N17.9|Acute kidney failure, unspecified|Genitourinary|H|
N39.0|Urinary tract infection, site not specified|Genitourinary|U|Add organism (B96.20 E. coli). If site known, N30.- cystitis or N10 pyelonephritis
N30.00|Acute cystitis without hematuria|Genitourinary||
N30.01|Acute cystitis with hematuria|Genitourinary||
N10|Acute pyelonephritis|Genitourinary||
N20.0|Calculus of kidney|Genitourinary||
R30.0|Dysuria|Symptoms||Don't report with N39.0/N30.- if definitive dx established
R35.0|Frequency of micturition|Symptoms||
R31.9|Hematuria, unspecified|Symptoms|U|Gross R31.0, microscopic R31.2-
R31.21|Asymptomatic microscopic hematuria|Symptoms||
N40.0|Benign prostatic hyperplasia without LUTS|Genitourinary||
N40.1|Benign prostatic hyperplasia with LUTS|Genitourinary||Add R35.-, R39.1- as manifestations
R97.20|Elevated PSA|Symptoms||
N52.9|Male erectile dysfunction, unspecified|Genitourinary|U|
N95.1|Menopausal and female climacteric states|Genitourinary||
N76.0|Acute vaginitis|Genitourinary||
N94.6|Dysmenorrhea, unspecified|Genitourinary|U|
N92.1|Excessive and frequent menstruation with irregular cycle|Genitourinary||
N93.9|Abnormal uterine and vaginal bleeding, unspecified|Genitourinary|U|
B37.31|Acute candidiasis of vulva and vagina|Infectious||
N63.0|Unspecified lump in unspecified breast|Genitourinary|U|Use laterality/quadrant: N63.1x-N63.4x
N64.4|Mastodynia|Genitourinary||
J06.9|Acute upper respiratory infection, unspecified|Respiratory|U|
J02.0|Streptococcal pharyngitis|Respiratory||Needs positive strep test/culture
J02.9|Acute pharyngitis, unspecified|Respiratory|U|
J03.90|Acute tonsillitis, unspecified|Respiratory|U|
J01.90|Acute sinusitis, unspecified|Respiratory|U|Specify sinus (maxillary J01.00, frontal J01.10, etc.) and recurrence
J20.9|Acute bronchitis, unspecified|Respiratory|U|
J18.9|Pneumonia, unspecified organism|Respiratory|U|
J45.909|Unspecified asthma, uncomplicated|Respiratory|U|Specify severity/persistence: J45.20, J45.30, J45.40, J45.50
J45.901|Unspecified asthma with (acute) exacerbation|Respiratory|U|
J45.20|Mild intermittent asthma, uncomplicated|Respiratory||
J45.30|Mild persistent asthma, uncomplicated|Respiratory||
J45.40|Moderate persistent asthma, uncomplicated|Respiratory||
J44.9|COPD, unspecified|Respiratory|H|
J44.1|COPD with (acute) exacerbation|Respiratory|H|
J44.0|COPD with acute lower respiratory infection|Respiratory|H|Code first the infection (J20.-, J18.-)
J30.9|Allergic rhinitis, unspecified|Respiratory|U|Seasonal J30.2, other seasonal J30.1 (pollen) ... specify trigger
J30.2|Other seasonal allergic rhinitis|Respiratory||
J30.89|Other allergic rhinitis|Respiratory||
R05.1|Acute cough|Symptoms||R05 alone is invalid since FY2022
R05.2|Subacute cough|Symptoms||
R05.3|Chronic cough|Symptoms||
R05.9|Cough, unspecified|Symptoms|U|
R06.02|Shortness of breath|Symptoms||
R06.2|Wheezing|Symptoms||
R09.81|Nasal congestion|Symptoms||
U07.1|COVID-19|Infectious||Confirmed (test or provider dx). Add J12.82 if pneumonia
U09.9|Post COVID-19 condition, unspecified|Infectious||Use with the specific condition code
J10.1|Influenza due to other identified influenza virus with other respiratory manifestations|Respiratory||Needs lab confirmation (J09-J10); otherwise J11.1
J11.1|Influenza due to unidentified influenza virus with other respiratory manifestations|Respiratory||
B34.9|Viral infection, unspecified|Infectious|U|
G47.33|Obstructive sleep apnea (adult)(pediatric)|Nervous||
G47.00|Insomnia, unspecified|Nervous|U|
F51.01|Primary insomnia|Mental||
R06.83|Snoring|Symptoms||
H66.90|Otitis media, unspecified, unspecified ear|Ear|U|Specify type and laterality (H66.001...). Use bilateral/right/left when documented
H61.20|Impacted cerumen, unspecified ear|Ear|U|Use H61.21 right, H61.22 left, H61.23 bilateral for 69210 lines
H61.21|Impacted cerumen, right ear|Ear||
H61.22|Impacted cerumen, left ear|Ear||
H61.23|Impacted cerumen, bilateral|Ear||
H10.9|Unspecified conjunctivitis|Eye|U|
H91.90|Unspecified hearing loss, unspecified ear|Ear|U|
H93.19|Tinnitus, unspecified ear|Ear|U|
H81.10|Benign paroxysmal vertigo, unspecified ear|Ear|U|
K21.9|Gastro-esophageal reflux disease without esophagitis|Digestive||
K21.00|GERD with esophagitis, without bleeding|Digestive||
K29.70|Gastritis, unspecified, without bleeding|Digestive|U|
K59.00|Constipation, unspecified|Digestive|U|
K58.9|Irritable bowel syndrome without diarrhea|Digestive||
K58.0|Irritable bowel syndrome with diarrhea|Digestive||
K52.9|Noninfective gastroenteritis and colitis, unspecified|Digestive|U|
A09|Infectious gastroenteritis and colitis, unspecified|Infectious||
K64.9|Unspecified hemorrhoids|Digestive|U|
K76.0|Fatty (change of) liver, not elsewhere classified|Digestive||NAFLD / MASLD
K57.30|Diverticulosis of large intestine without perforation or abscess or bleeding|Digestive||
K80.20|Calculus of gallbladder without cholecystitis without obstruction|Digestive||
K92.1|Melena|Digestive||
K62.5|Hemorrhage of anus and rectum|Digestive||
R10.9|Unspecified abdominal pain|Symptoms|U|Specify location R10.1x-R10.3x
R10.13|Epigastric pain|Symptoms||
R10.30|Lower abdominal pain, unspecified|Symptoms|U|
R11.2|Nausea with vomiting, unspecified|Symptoms||
R11.0|Nausea|Symptoms||
R19.7|Diarrhea, unspecified|Symptoms||
R14.0|Abdominal distension (gaseous)|Symptoms||
F32.A|Depression, unspecified|Mental|U|Document severity/episode: F32.0-F32.5, F33.-
F32.9|Major depressive disorder, single episode, unspecified|Mental|U|Specify severity: F32.0 mild, F32.1 moderate, F32.2 severe. Moderate/severe are risk-adjusting
F32.0|MDD, single episode, mild|Mental||
F32.1|MDD, single episode, moderate|Mental|H|
F32.2|MDD, single episode, severe without psychotic features|Mental|H|
F33.0|MDD, recurrent, mild|Mental||
F33.1|MDD, recurrent, moderate|Mental|H|
F33.2|MDD, recurrent, severe without psychotic features|Mental|H|
F33.9|MDD, recurrent, unspecified|Mental|U|
F41.1|Generalized anxiety disorder|Mental||
F41.9|Anxiety disorder, unspecified|Mental|U|
F43.10|Post-traumatic stress disorder, unspecified|Mental|U|
F43.20|Adjustment disorder, unspecified|Mental|U|
F43.23|Adjustment disorder with mixed anxiety and depressed mood|Mental||
F90.0|ADHD, predominantly inattentive type|Mental||
F90.2|ADHD, combined type|Mental||
F90.9|ADHD, unspecified type|Mental|U|
F10.20|Alcohol dependence, uncomplicated|Mental|H|
F10.10|Alcohol abuse, uncomplicated|Mental||
F11.20|Opioid dependence, uncomplicated|Mental|H|
F17.210|Nicotine dependence, cigarettes, uncomplicated|Mental||Supports 99406/99407
F17.290|Nicotine dependence, other tobacco product, uncomplicated|Mental||
F17.211|Nicotine dependence, cigarettes, in remission|Mental||
Z72.0|Tobacco use|Factors||Use F17.- when dependence is documented
Z87.891|Personal history of nicotine dependence|Factors||
F03.90|Unspecified dementia, unspecified severity, without behavioral disturbance|Mental|HU|Specify type + severity (mild/moderate/severe) + behavior
G30.9|Alzheimer's disease, unspecified|Nervous|HU|Specify early/late onset G30.0/G30.1 + F02.-
G31.84|Mild cognitive impairment, so stated|Nervous||
R41.3|Other amnesia|Symptoms||
G43.909|Migraine, unspecified, not intractable, without status migrainosus|Nervous|U|Specify with/without aura: G43.009, G43.109
G43.009|Migraine without aura, not intractable, without status migrainosus|Nervous||
R51.9|Headache, unspecified|Symptoms|U|
G44.209|Tension-type headache, unspecified, not intractable|Nervous|U|
R42|Dizziness and giddiness|Symptoms||
G62.9|Polyneuropathy, unspecified|Nervous|U|
G56.00|Carpal tunnel syndrome, unspecified upper limb|Nervous|U|Right G56.01, left G56.02
G56.01|Carpal tunnel syndrome, right upper limb|Nervous||
G89.29|Other chronic pain|Nervous||
G89.4|Chronic pain syndrome|Nervous||
R20.2|Paresthesia of skin|Symptoms||
R55|Syncope and collapse|Symptoms||
M54.50|Low back pain, unspecified|MSK|U|M54.5 alone is invalid since FY2022. M54.51 vertebrogenic, M54.59 other
M54.51|Vertebrogenic low back pain|MSK||
M54.59|Other low back pain|MSK||
M54.2|Cervicalgia|MSK||
M54.6|Pain in thoracic spine|MSK||
M54.16|Radiculopathy, lumbar region|MSK||
M54.17|Radiculopathy, lumbosacral region|MSK||
M51.26|Other intervertebral disc displacement, lumbar region|MSK||
M47.816|Spondylosis without myelopathy or radiculopathy, lumbar region|MSK||
M17.11|Unilateral primary osteoarthritis, right knee|MSK||Supports 20610 (right) and viscosupplementation; use 17.12 for left
M17.12|Unilateral primary osteoarthritis, left knee|MSK||
M17.0|Bilateral primary osteoarthritis of knee|MSK||Bilateral injections: modifier 50 or RT+LT per payer
M17.9|Osteoarthritis of knee, unspecified|MSK|U|
M19.90|Unspecified osteoarthritis, unspecified site|MSK|U|
M15.0|Primary generalized (osteo)arthritis|MSK||
M16.11|Unilateral primary osteoarthritis, right hip|MSK||
M25.561|Pain in right knee|MSK||
M25.562|Pain in left knee|MSK||
M25.511|Pain in right shoulder|MSK||
M25.512|Pain in left shoulder|MSK||
M25.50|Pain in unspecified joint|MSK|U|
M75.100|Unspecified rotator cuff tear or rupture of unspecified shoulder, not traumatic|MSK|U|
M77.10|Lateral epicondylitis, unspecified elbow|MSK|U|
M72.2|Plantar fascial fibromatosis|MSK||Plantar fasciitis
M70.61|Trochanteric bursitis, right hip|MSK||
M79.7|Fibromyalgia|MSK||
M79.10|Myalgia, unspecified site|MSK|U|
M62.830|Muscle spasm of back|MSK||
M81.0|Age-related osteoporosis without current pathological fracture|MSK||
M06.9|Rheumatoid arthritis, unspecified|MSK|HU|
M10.9|Gout, unspecified|MSK|U|
M65.30|Trigger finger, unspecified finger|MSK|U|Specify finger and side (M65.31x-M65.34x)
S93.401A|Sprain of unspecified ligament of right ankle, initial encounter|Injury||7th character A = active treatment; D routine healing; S sequela
S93.402A|Sprain of unspecified ligament of left ankle, initial encounter|Injury||
S39.012A|Strain of muscle, fascia and tendon of lower back, initial encounter|Injury||
S13.4XXA|Sprain of ligaments of cervical spine, initial encounter|Injury||
S61.411A|Laceration without foreign body of right hand, initial encounter|Injury||Pair with 12001-12007 / 12031-12037 by length + layers
S61.412A|Laceration without foreign body of left hand, initial encounter|Injury||
S01.01XA|Laceration without foreign body of scalp, initial encounter|Injury||
S81.811A|Laceration without foreign body, right lower leg, initial encounter|Injury||
S91.311A|Laceration without foreign body, right foot, initial encounter|Injury||
L70.0|Acne vulgaris|Skin||
L20.9|Atopic dermatitis, unspecified|Skin|U|
L30.9|Dermatitis, unspecified|Skin|U|
L23.9|Allergic contact dermatitis, unspecified cause|Skin|U|
L21.9|Seborrheic dermatitis, unspecified|Skin|U|
L40.0|Psoriasis vulgaris|Skin||
L50.9|Urticaria, unspecified|Skin|U|
L57.0|Actinic keratosis|Skin||Supports 17000/17003/17004
L82.1|Other seborrheic keratosis|Skin||Often cosmetic - remove only if symptomatic/inflamed (L82.0)
L72.0|Epidermal cyst|Skin||
L03.90|Cellulitis, unspecified|Skin|U|Specify site: L03.115 right lower limb, L03.116 left lower limb
L03.115|Cellulitis of right lower limb|Skin||
L03.116|Cellulitis of left lower limb|Skin||
L02.91|Cutaneous abscess, unspecified|Skin|U|Specify site: L02.2- trunk, L02.4- limb, etc.
L60.0|Ingrowing nail|Skin||
L91.8|Other hypertrophic disorders of skin (skin tag)|Skin||
L29.9|Pruritus, unspecified|Skin|U|
L64.9|Androgenic alopecia, unspecified|Skin|U|
B35.1|Tinea unguium (onychomycosis)|Infectious||
B35.3|Tinea pedis|Infectious||
B35.4|Tinea corporis|Infectious||
B07.0|Plantar wart|Infectious||
B07.8|Other viral warts|Infectious||
B07.9|Viral wart, unspecified|Infectious|U|
B02.9|Zoster without complications|Infectious||
B00.9|Herpesviral infection, unspecified|Infectious|U|
D22.9|Melanocytic nevi, unspecified|Neoplasm|U|Specify site: D22.5 trunk, D22.61 right upper limb, etc.
D23.9|Other benign neoplasm of skin, unspecified|Neoplasm|U|
D48.5|Neoplasm of uncertain behavior of skin|Neoplasm||Don't use before path results; use symptom code until then
Z85.828|Personal history of other malignant neoplasm of skin|Factors||
R21|Rash and other nonspecific skin eruption|Symptoms||
R50.9|Fever, unspecified|Symptoms|U|
R53.83|Other fatigue|Symptoms||
R53.1|Weakness|Symptoms||
R63.4|Abnormal weight loss|Symptoms||
R63.5|Abnormal weight gain|Symptoms||
R60.0|Localized edema|Symptoms||
R06.00|Dyspnea, unspecified|Symptoms|U|
R07.9|Chest pain, unspecified|Symptoms|U|Specify R07.89 other chest pain, R07.1 on breathing, R07.2 precordial
R07.89|Other chest pain|Symptoms||
R00.0|Tachycardia, unspecified|Symptoms||
R00.2|Palpitations|Symptoms||
R03.0|Elevated blood-pressure reading, without diagnosis of hypertension|Symptoms||
R94.31|Abnormal electrocardiogram [ECG] [EKG]|Symptoms||
R80.9|Proteinuria, unspecified|Symptoms|U|
R59.0|Localized enlarged lymph nodes|Symptoms||
G47.9|Sleep disorder, unspecified|Nervous|U|
Z00.00|Encounter for general adult medical exam without abnormal findings|Factors||Age 18+. No 'chronic problems' listed under this code
Z00.01|Encounter for general adult medical exam with abnormal findings|Factors||Requires an additional dx for the abnormal finding(s)
Z00.121|Encounter for routine child health exam with abnormal findings|Factors||Age <18; code the finding too
Z00.129|Encounter for routine child health exam without abnormal findings|Factors||Age <18
Z00.110|Health examination for newborn under 8 days old|Factors||
Z00.111|Health examination for newborn 8 to 28 days old|Factors||
Z02.5|Encounter for examination for participation in sport|Factors||Sports physicals are often non-covered - patient responsibility
Z02.0|Encounter for examination for admission to educational institution|Factors||
Z02.1|Encounter for pre-employment examination|Factors||
Z02.89|Encounter for other administrative examinations|Factors||
Z01.411|Encounter for gynecological exam (general)(routine) with abnormal findings|Factors||
Z01.419|Encounter for gynecological exam (general)(routine) without abnormal findings|Factors||
Z01.810|Encounter for preprocedural cardiovascular examination|Factors||
Z01.818|Encounter for other preprocedural examination|Factors||
Z01.00|Encounter for examination of eyes and vision without abnormal findings|Factors||
Z01.10|Encounter for examination of ears and hearing without abnormal findings|Factors||
Z12.11|Encounter for screening for malignant neoplasm of colon|Factors||If findings/polyps lead to therapeutic: modifier 33/PT with colonoscopy
Z12.12|Encounter for screening for malignant neoplasm of rectum|Factors||
Z12.31|Encounter for screening mammogram for malignant neoplasm of breast|Factors||
Z12.4|Encounter for screening for malignant neoplasm of cervix|Factors||
Z12.5|Encounter for screening for malignant neoplasm of prostate|Factors||
Z12.83|Encounter for screening for malignant neoplasm of skin|Factors||
Z12.2|Encounter for screening for malignant neoplasm of respiratory organs|Factors||Lung cancer LDCT screening
Z13.1|Encounter for screening for diabetes mellitus|Factors||
Z13.220|Encounter for screening for lipoid disorders|Factors||
Z13.31|Encounter for screening for depression|Factors||Pairs with 96127 / G0444
Z13.39|Encounter for screening examination for other mental health and behavioral disorders|Factors||Anxiety, substance, etc.
Z13.41|Encounter for autism screening|Factors||
Z13.42|Encounter for screening for global developmental delays|Factors||
Z13.49|Encounter for screening for other developmental disorders|Factors||
Z13.5|Encounter for screening for eye and ear disorders|Factors||
Z13.6|Encounter for screening for cardiovascular disorders|Factors||
Z13.820|Encounter for screening for osteoporosis|Factors||
Z13.88|Encounter for screening for disorder due to exposure to contaminants (lead)|Factors||
Z11.3|Encounter for screening for infections with a predominantly sexual mode of transmission|Factors||
Z11.4|Encounter for screening for HIV|Factors||
Z11.51|Encounter for screening for HPV|Factors||
Z11.59|Encounter for screening for other viral diseases (hep C)|Factors||
Z11.52|Encounter for screening for COVID-19|Factors||
Z11.7|Encounter for testing for latent tuberculosis infection|Factors||
Z20.822|Contact with and (suspected) exposure to COVID-19|Factors||
Z20.828|Contact with and (suspected) exposure to other viral communicable diseases|Factors||
Z23|Encounter for immunization|Factors|P|Required with every vaccine product/admin line. Not valid alone to support a problem-oriented E/M
Z28.21|Immunization not carried out because of patient refusal|Factors||
Z71.3|Dietary counseling and surveillance|Factors||
Z71.82|Exercise counseling|Factors||
Z71.89|Other specified counseling|Factors||
Z71.41|Alcohol abuse counseling and surveillance of alcoholic|Factors||
Z71.6|Tobacco abuse counseling|Factors||Use with F17.- or Z72.0
Z71.51|Drug abuse counseling and surveillance of drug abuser|Factors||
Z79.01|Long term (current) use of anticoagulants|Factors|P|
Z79.02|Long term (current) use of antithrombotics/antiplatelets|Factors|P|
Z79.82|Long term (current) use of aspirin|Factors|P|
Z79.4|Long term (current) use of insulin|Factors|P|With E10/E11
Z79.84|Long term (current) use of oral hypoglycemic drugs|Factors|P|
Z79.85|Long-term (current) use of injectable non-insulin antidiabetic drugs|Factors|P|GLP-1 RAs etc.
Z79.891|Long term (current) use of opiate analgesic|Factors|P|
Z79.899|Other long term (current) drug therapy|Factors|P|
Z79.3|Long term (current) use of hormonal contraceptives|Factors|P|
Z79.52|Long term (current) use of systemic steroids|Factors|P|
Z51.81|Encounter for therapeutic drug level monitoring|Factors||
Z09|Encounter for follow-up exam after completed treatment for conditions other than malignant neoplasm|Factors||
Z08|Encounter for follow-up exam after completed treatment for malignant neoplasm|Factors||
Z48.02|Encounter for removal of sutures|Factors||
Z48.01|Encounter for change or removal of surgical wound dressing|Factors||
Z76.0|Encounter for issue of repeat prescription|Factors||
Z30.09|Encounter for other general counseling and advice on contraception|Factors||
Z30.011|Encounter for initial prescription of contraceptive pills|Factors||
Z30.41|Encounter for surveillance of contraceptive pills|Factors||
Z30.430|Encounter for insertion of intrauterine contraceptive device|Factors||
Z30.431|Encounter for routine checking of intrauterine contraceptive device|Factors||
Z30.432|Encounter for removal of intrauterine contraceptive device|Factors||
Z30.017|Encounter for initial prescription of implantable subdermal contraceptive|Factors||
Z30.46|Encounter for surveillance of implantable subdermal contraceptive|Factors||
Z30.42|Encounter for surveillance of injectable contraceptive|Factors||
Z32.00|Encounter for pregnancy test, result unknown|Factors||
Z32.01|Encounter for pregnancy test, result positive|Factors||
Z32.02|Encounter for pregnancy test, result negative|Factors||
Z34.00|Encounter for supervision of normal first pregnancy, unspecified trimester|Factors|U|
Z39.2|Encounter for routine postpartum follow-up|Factors||
Z59.41|Food insecurity|Factors||SDOH Z-code; supports G0136, can add to HCC/SDOH capture
Z59.82|Transportation insecurity|Factors||
Z59.86|Financial insecurity|Factors||
Z59.00|Homelessness, unspecified|Factors|U|
Z63.6|Dependent relative needing care at home|Factors||
Z60.2|Problems related to living alone|Factors||
Z91.81|History of falling|Factors||
Z86.010|Personal history of colonic polyps|Factors||
Z87.440|Personal history of urinary (tract) infections|Factors||
Z80.0|Family history of malignant neoplasm of digestive organs|Factors||
Z80.3|Family history of malignant neoplasm of breast|Factors||
Z82.49|Family history of ischemic heart disease and other diseases of the circulatory system|Factors||
Z83.3|Family history of diabetes mellitus|Factors||
Z85.3|Personal history of malignant neoplasm of breast|Factors||
Z88.0|Allergy status to penicillin|Factors||
T78.40XA|Allergy, unspecified, initial encounter|Injury|U|
Z99.89|Dependence on other enabling machines and devices|Factors||
`;

  CI.ICD = {};
  ROWS.split('\n').forEach(function (line) {
    line = line.trim();
    if (!line) return;
    const f = line.split('|');
    CI.ICD[f[0].replace('.', '')] = {
      code: f[0],
      desc: f[1],
      chapter: f[2],
      hcc: /H/.test(f[3] || ''),
      unspecified: /U/.test(f[3] || ''),
      noPrimary: /P/.test(f[3] || ''),
      tip: (f.slice(4).join('|') || '').trim()
    };
  });

  /* Codes that were split/retired - invalid as billed. */
  CI.ICD_INVALID = {
    M545: 'M54.5 was expanded in FY2022: use M54.50 (unspecified), M54.51 (vertebrogenic) or M54.59 (other)',
    R05: 'R05 was expanded in FY2022: use R05.1 acute, R05.2 subacute, R05.3 chronic, R05.4 (tussive syncope), R05.8, R05.9',
    N183: 'N18.3 was expanded in FY2021: use N18.30, N18.31 (3a) or N18.32 (3b)',
    Z000: 'Z00.0 requires a 5th character: Z00.00 (without abnormal findings) or Z00.01 (with)',
    Z001: 'Z00.1 is a category - use Z00.110, Z00.111, Z00.121 or Z00.129',
    E11: 'E11 is a category: use E11.9 (no complications) or a code with the complication documented',
    E10: 'E10 is a category: use E10.9 or a complication-specific code',
    J45: 'J45 is a category: add severity/exacerbation (e.g., J45.909, J45.20, J45.30)',
    N18: 'N18 is a category: specify CKD stage (N18.1-N18.6, N18.9)',
    I50: 'I50 is a category: specify type/acuity (e.g., I50.22, I50.32, I50.9)',
    F32: 'F32 is a category: use F32.A / F32.0-F32.5 / F32.9',
    F33: 'F33 is a category: specify severity (F33.0-F33.3, F33.9)',
    E66: 'E66 is a category: use E66.9 or a class-specific code',
    Z68: 'Z68 is a category: report the exact BMI band (e.g., Z68.30)',
    J44: 'J44 is a category: use J44.9, J44.1 or J44.0',
    M17: 'M17 is a category: add laterality (M17.11, M17.12, M17.0, M17.9)',
    N39: 'N39 is a category: use N39.0 (UTI, site not specified) or another N39.- code'
  };

  /* Sex-specific & age-specific diagnosis rules (prefix on normalized code). */
  CI.DX_SEX = [
    { p: ['N7', 'N8', 'N90', 'N91', 'N92', 'N93', 'N94', 'N95', 'N96', 'N97', 'N98', 'O', 'Z30.0', 'Z30.1', 'Z30.4', 'Z34', 'Z3A', 'Z39', 'Z12.4', 'Z01.41', 'B37.3'], sex: 'F', why: 'female-specific' },
    { p: ['N40', 'N41', 'N42', 'N43', 'N44', 'N45', 'N46', 'N48', 'N49', 'N50', 'N51', 'N52', 'N53', 'C61', 'R97', 'Z12.5'], sex: 'M', why: 'male-specific' }
  ];
  CI.DX_SEX.forEach(function (r) { r.p = r.p.map(function (x) { return x.replace('.', ''); }); });
})(typeof window !== 'undefined' ? window : globalThis);
