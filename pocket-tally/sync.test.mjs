// Run with: node --test pocket-tally/sync.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const S = require("./sync.js");

const NOW = 1_800_000_000_000;

test("merge keeps the newer copy of a record and unions the rest", () => {
  const local = { entries: [{ id: "a", item: "Coffee", amount: 40, mod: 10 }, { id: "b", item: "Cab", amount: 85, mod: 5 }], events: [], tombstones: {}, learned: { chai: "food" } };
  const remote = { entries: [{ id: "a", item: "Coffee (edited)", amount: 45, mod: 20 }, { id: "c", item: "Lunch", amount: 120, mod: 7 }], events: [{ id: "ev1", name: "Goa trip", mod: 1 }], tombstones: {}, learned: { chai: "bills", cab: "transport" } };
  const m = S.merge(local, remote, NOW);
  const byId = Object.fromEntries(m.entries.map(e => [e.id, e]));
  assert.equal(byId.a.item, "Coffee (edited)");
  assert.equal(byId.b.item, "Cab");
  assert.equal(byId.c.item, "Lunch");
  assert.equal(m.events.length, 1);
  assert.deepEqual(m.learned, { chai: "food", cab: "transport" }); // local wins on the same key
});

test("a deletion on one device removes the record on the other", () => {
  const local = { entries: [{ id: "a", item: "Coffee", amount: 40, mod: NOW - 2000 }], events: [], tombstones: {} };
  const remote = { entries: [], events: [], tombstones: { a: NOW - 1000 } };
  const m = S.merge(local, remote, NOW);
  assert.equal(m.entries.length, 0);
  assert.equal(m.tombstones.a, NOW - 1000);
});

test("an edit made after the deletion brings the record back", () => {
  const local = { entries: [{ id: "a", item: "Coffee", amount: 40, mod: NOW - 500 }], events: [], tombstones: {} };
  const remote = { entries: [], events: [], tombstones: { a: NOW - 1000 } };
  const m = S.merge(local, remote, NOW);
  assert.equal(m.entries.length, 1);
});

test("old tombstones are pruned", () => {
  const m = S.merge({ entries: [], events: [], tombstones: { old: NOW - 200 * 86400000, fresh: NOW - 1000 } }, null, NOW);
  assert.deepEqual(Object.keys(m.tombstones), ["fresh"]);
});

test("records without mod fall back to ts/createdAt", () => {
  const m = S.merge({ entries: [{ id: "a", ts: 5 }], events: [{ id: "v", createdAt: 9 }], tombstones: {} }, { entries: [{ id: "a", ts: 6, item: "newer" }], events: [], tombstones: {} }, NOW);
  assert.equal(m.entries[0].item, "newer");
  assert.equal(m.events[0].id, "v");
});

test("fingerprint changes only when records change", () => {
  const a = { entries: [{ id: "a", mod: 1 }], events: [], tombstones: {}, learned: {} };
  const b = { entries: [{ id: "a", mod: 1 }], events: [], tombstones: {}, learned: {} };
  const c = { entries: [{ id: "a", mod: 2 }], events: [], tombstones: {}, learned: {} };
  assert.equal(S.fingerprint(a), S.fingerprint(b));
  assert.notEqual(S.fingerprint(a), S.fingerprint(c));
});

test("auth url and hash parsing", () => {
  const url = S.authUrl("123.apps.googleusercontent.com", "https://example.github.io/app/", "xyz", true);
  assert.ok(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth?"));
  assert.ok(url.includes("client_id=123.apps.googleusercontent.com"));
  assert.ok(url.includes("redirect_uri=https%3A%2F%2Fexample.github.io%2Fapp%2F"));
  assert.ok(url.includes("response_type=token"));
  assert.ok(url.includes("prompt=none"));
  const r = S.parseHash("#access_token=ya29.abc&token_type=Bearer&expires_in=3599&state=xyz");
  assert.equal(r.access_token, "ya29.abc");
  assert.equal(r.expires_in, 3599);
  assert.equal(r.state, "xyz");
  assert.equal(S.parseHash("#error=interaction_required&state=xyz").error, "interaction_required");
  assert.equal(S.parseHash("#insights"), null);
  assert.equal(S.parseHash(""), null);
});
