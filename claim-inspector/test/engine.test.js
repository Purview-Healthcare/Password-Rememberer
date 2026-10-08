const assert = require('assert');
global.CI = {};
require('../data/cpt.js'); require('../data/icd.js'); require('../data/modifiers.js');
const CI = require('../engine.js');
const E = CI.engine;
const rules = (c) => E.inspect(c).issues.map((i) => i.rule);
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('data loads', () => { assert(Object.keys(CI.CPT).length > 250); assert(CI.ICD.I10 && CI.ICD.E119); });
t('sick + preventive needs 25', () => {
  const r = rules({ age: 50, sex: 'M', payer: 'commercial', pos: '11', status: 'est', dx: ['Z00.00', 'I10'], lines: [{ cpt: '99396', ptr: 'A' }, { cpt: '99213', ptr: 'B' }] });
  assert(r.includes('MOD-010'));
});
t('25 satisfied removes error', () => {
  const r = rules({ age: 50, sex: 'M', payer: 'commercial', pos: '11', status: 'est', dx: ['Z00.01', 'I10'], lines: [{ cpt: '99396', ptr: 'A' }, { cpt: '99213', mods: ['25'], ptr: 'B' }] });
  assert(!r.includes('MOD-010'));
});
t('injection + E/M', () => {
  const r = rules({ age: 60, sex: 'F', payer: 'commercial', pos: '11', status: 'est', dx: ['M17.11'], lines: [{ cpt: '99213', ptr: 'A' }, { cpt: '20610', ptr: 'A' }, { cpt: 'J3301', ptr: 'A', units: 4 }] });
  assert(r.includes('MOD-013') && r.includes('LAT-001'));
});
t('invalid dx', () => { const r = rules({ dx: ['M54.5', 'R05', 'N18.3', 'E11'], lines: [{ cpt: '99213', ptr: 'A' }] }); assert.strictEqual(r.filter((x) => x === 'DX-001').length, 4); });
t('medicare physical + flu', () => {
  const r = rules({ age: 70, sex: 'F', payer: 'medicare', pos: '11', status: 'est', dx: ['Z00.00', 'Z23'], lines: [{ cpt: '99397', ptr: 'A' }, { cpt: '90662', ptr: 'B' }, { cpt: '90471', ptr: 'B' }] });
  assert(r.includes('MCR-001') && r.includes('VAC-004'));
});
t('new/est mismatch + fix', () => {
  const c = { age: 40, payer: 'commercial', pos: '11', status: 'est', dx: ['I10'], lines: [{ cpt: '99203', ptr: 'A' }] };
  const iss = E.inspect(c).issues.find((i) => i.rule === 'NEW-001');
  assert(iss); assert.strictEqual(E.applyFix(c, iss).lines[0].cpt, '99213');
});
t('dx/cpt mismatch', () => {
  const r = rules({ age: 40, payer: 'commercial', pos: '11', dx: ['J06.9'], lines: [{ cpt: '83036', ptr: 'A' }] });
  assert(r.includes('NEC-001'));
  assert.strictEqual(E.matchCptDx('83036', ['E11.9']).verdict, 'ok');
  assert.strictEqual(E.matchCptDx('83036', ['J06.9']).verdict, 'mismatch');
});
t('sex/age edits', () => {
  const r = rules({ age: 30, sex: 'M', payer: 'commercial', pos: '11', dx: ['N92.1'], lines: [{ cpt: '77067', ptr: 'A' }] });
  assert(r.includes('DX-007') && r.includes('SEX-001') && r.includes('AGE-001'));
});
t('taxonomy', () => {
  const r = rules({ age: 8, payer: 'commercial', pos: '11', taxonomy: '207QG0300X', dx: ['Z00.129'], lines: [{ cpt: '99393', ptr: 'A' }] });
  assert(r.includes('TAX-004'));
});
t('time + mdm', () => {
  assert.strictEqual(E.timeEM('est', 35).code, '99214');
  assert.strictEqual(E.timeEM('est', 55).prolongedCPT, 1);
  assert.strictEqual(E.timeEM('est', 69).prolongedMedicare, 1);
  assert.strictEqual(E.mdmLevel(2, 1, 2), 2);
});
t('clean claim', () => {
  const r = E.inspect({ age: 55, sex: 'M', payer: 'commercial', pos: '11', status: 'est', taxonomy: '207Q00000X', dx: ['E11.65', 'I10'], lines: [{ cpt: '99214', ptr: 'AB' }, { cpt: '83036', mods: ['QW'], ptr: 'A' }] });
  assert.strictEqual(r.errs, 0, JSON.stringify(r.issues));
});
t('batch parser', () => {
  const b = E.parseBatch('# c\nA1 | 52 M | commercial | est | 11 | Z00.01 I10 Z23 | 99396 A, 99214-25 B, 90686 C x1, 90471 C\nbad line');
  assert.strictEqual(b.length, 2); assert.strictEqual(b[0].claim.age, 52); assert.strictEqual(b[0].claim.lines[1].mods, '25');
  assert.strictEqual(b[0].claim.lines.length, 4); assert(b[1].error);
  const short = E.parseBatch('X | 70 F | medicare | G0439 | Z00.00 | G0439');
  assert.strictEqual(short.length, 1);
});
console.log(n + ' tests passed');
