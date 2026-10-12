// Run with: node --test pocket-tally/parser.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const P = require("./parser.js");

function one(text, learned, events) {
  const r = P.parse(text, learned, events);
  assert.equal(r.entries.length, 1, `expected one entry for "${text}", got ${JSON.stringify(r.entries)}`);
  return r.entries[0];
}

const cases = [
  // [spoken text, item, amount, category, currency?, dayOffset?]
  ["coffee 4.50", "Coffee", 4.5, "food"],
  ["4.50 coffee", "Coffee", 4.5, "food"],
  ["spent 120 on groceries at walmart", "Groceries at walmart", 120, "food"],
  ["I paid 45 for uber to the airport", "Uber to the airport", 45, "transport"],
  ["paid twenty five dollars for lunch", "Lunch", 25, "food", "USD"],
  ["lunch was twenty five bucks", "Lunch", 25, "food", "USD"],
  ["two hundred and fifty rupees for petrol", "Petrol", 250, "transport", "INR"],
  ["rs. 500 for medicines", "Medicines", 500, "health", "INR"],
  ["₹1,200 rent", "Rent", 1200, "bills", "INR"],
  ["$20 at the pharmacy", "Pharmacy", 20, "health", "USD"],
  ["bought 2 tickets for 30", "Tickets", 30, "shopping"],
  ["2 coffees for 8 dollars", "Coffees", 8, "food", "USD"],
  ["netflix subscription 15.99", "Netflix subscription", 15.99, "bills"],
  ["1.5k on new shoes", "New shoes", 1500, "shopping"],
  ["electricity bill one thousand two hundred", "Electricity bill", 1200, "bills"],
  ["gave 50 to the plumber yesterday", "Plumber", 50, "bills", null, -1],
  ["movie tickets last night 24", "Movie tickets", 24, "shopping", null, -1],
  ["four dollars and fifty cents for a donut", "Donut", 4.5, "food", "USD"],
  ["50 cents parking", "Parking", 0.5, "transport"],
  ["parking at 5 pm cost 12", "Parking at 5 pm", 12, "transport"],
  ["a hundred bucks groceries", "Groceries", 100, "food", "USD"],
  ["Uber 12.3", "Uber", 12.3, "transport"],
  ["dinner at olive garden 86.40", "Dinner at olive garden", 86.4, "food"],
  ["three lakh for the car", "Car", 300000, "other"],
  ["gym membership 1,20,000", "Gym membership", 120000, "health"],
  ["cab 4,50", "Cab", 4.5, "transport"],
  ["spent four point five on chai", "Chai", 4.5, "food"],
  ["headphones from amazon 2999", "Headphones from amazon", 2999, "shopping"],
  ["ice cream 3", "Ice cream", 3, "food"],
  ["fish and chips 12", "Fish and chips", 12, "food"],
  ["paid 100 for groceries and vegetables", "Groceries and vegetables", 100, "food"],
];

for (const [text, item, amount, category, currency, dayOffset] of cases) {
  test(`parse: "${text}"`, () => {
    const e = one(text);
    assert.equal(e.item, item, "item");
    assert.equal(e.amount, amount, "amount");
    assert.equal(e.category, category, "category");
    if (currency !== undefined && currency !== null) assert.equal(e.currency, currency, "currency");
    if (dayOffset !== undefined) assert.equal(e.dayOffset, dayOffset, "dayOffset");
  });
}

test("drops the spend verb and preposition around the amount", () => {
  assert.equal(one("kids spent 330 on shoes").item, "Kids shoes");
  assert.equal(one("spent 500 in the mall").item, "Mall");
  assert.equal(one("the kids 40 for lunch").item, "Kids lunch");
  assert.equal(one("dinner was 860 at olive garden").item, "Dinner olive garden");
});

test("kids spent 330 on shoes and 40 on lunch -> two entries", () => {
  const r = P.parse("kids spent 330 on shoes and 40 on lunch");
  assert.deepEqual(r.entries.map(e => [e.item, e.amount]), [["Kids shoes", 330], ["Lunch", 40]]);
});

test("set aside is its own kind", () => {
  const e = one("set aside 10000");
  assert.equal(e.kind, "aside");
  assert.equal(e.amount, 10000);
  assert.equal(e.item, "Set aside");
  assert.equal(e.category, "aside");
  const e2 = one("keep aside 2000 for rent");
  assert.equal(e2.kind, "aside");
  assert.equal(e2.item, "Set aside · Rent");
});

test("event names are matched and removed", () => {
  const events = [{ id: "ev1", name: "Goa trip" }, { id: "ev2", name: "Client project" }];
  let e = one("cab 85 for the goa trip", undefined, events);
  assert.equal(e.eventId, "ev1");
  assert.equal(e.item, "Cab");
  assert.equal(e.amount, 85);
  e = one("hotel 4500 goa", undefined, events);
  assert.equal(e.eventId, "ev1");
  assert.equal(e.item, "Hotel");
  e = one("printing 300 for the client project", undefined, events);
  assert.equal(e.eventId, "ev2");
  assert.equal(e.item, "Printing");
  e = one("coffee 40", undefined, events);
  assert.equal(e.eventId, null);
  const r = P.parse("lunch 200 and taxi 150 on the goa trip", undefined, events);
  assert.deepEqual(r.entries.map(x => [x.item, x.amount, x.eventId]), [["Lunch", 200, "ev1"], ["Taxi", 150, "ev1"]]);
});

test("quantity and price each", () => {
  let e = one("3 coffees 40 each");
  assert.deepEqual([e.item, e.qty, e.unit, e.amount], ["Coffees", 3, 40, 120]);
  e = one("2 x samosa 15");
  assert.deepEqual([e.item, e.qty, e.unit, e.amount], ["Samosa", 2, 7.5, 15]);
  e = one("coffee x3 120");
  assert.deepEqual([e.item, e.qty, e.unit, e.amount], ["Coffee", 3, 40, 120]);
  e = one("two samosas 15 each");
  assert.deepEqual([e.item, e.qty, e.amount], ["Samosas", 2, 30]);
  e = one("bought 2 tickets for 30");
  assert.deepEqual([e.item, e.qty, e.unit, e.amount], ["Tickets", 2, 15, 30]);
  e = one("4 bottles of water 20 per bottle");
  assert.deepEqual([e.item, e.qty, e.amount], ["Bottles of water", 4, 80]);
  e = one("coffee 40");
  assert.deepEqual([e.qty, e.unit, e.amount], [1, 40, 40]);
  e = one("3 coffees 40 each for the goa trip", undefined, [{ id: "ev1", name: "Goa trip" }]);
  assert.deepEqual([e.item, e.qty, e.amount, e.eventId], ["Coffees", 3, 120, "ev1"]);
  const r = P.parse("3 coffees 40 each and 2 samosas 15 each");
  assert.deepEqual(r.entries.map(x => [x.item, x.qty, x.amount]), [["Coffees", 3, 120], ["Samosas", 2, 30]]);
});

test("splits two purchases said in one breath", () => {
  const r = P.parse("coffee 5 and sandwich 8");
  assert.equal(r.entries.length, 2);
  assert.deepEqual(r.entries.map(e => [e.item, e.amount, e.category]), [["Coffee", 5, "food"], ["Sandwich", 8, "food"]]);
});

test("splits on comma", () => {
  const r = P.parse("milk 3.20, bread 2.80, parking 5");
  assert.deepEqual(r.entries.map(e => [e.item, e.amount]), [["Milk", 3.2], ["Bread", 2.8], ["Parking", 5]]);
});

test("amount only -> item empty, amount set", () => {
  const e = one("20");
  assert.equal(e.item, "");
  assert.equal(e.amount, 20);
});

test("item only -> amount null", () => {
  const e = one("coffee");
  assert.equal(e.item, "Coffee");
  assert.equal(e.amount, null);
});

test("learned categories win over keywords", () => {
  const e = one("chai", { chai: "bills" });
  assert.equal(e.category, "bills");
  const e2 = one("morning chai at the stall 20", { chai: "bills" });
  assert.equal(e2.category, "bills");
});

test("income is detected and categorised as income", () => {
  for (const [text, item, amount] of [
    ["salary received 69000", "Salary", 69000],
    ["received 500 refund from amazon", "Refund from amazon", 500],
    ["+250 cashback", "Cashback", 250],
    ["cash on hand 5000", "Cash on hand", 5000],
    ["received 69000 rupees", "Received", 69000],
    ["received 69000", "Received", 69000],
  ]) {
    const e = one(text);
    assert.equal(e.kind, "income", text);
    assert.equal(e.category, "income", text);
    assert.equal(e.item, item, text);
    assert.equal(e.amount, amount, text);
  }
  assert.equal(one("paid 45 for uber").kind, "expense");
});

test("payments, savings and family categories", () => {
  assert.equal(one("lazypay 6734.02").category, "payments");
  assert.equal(one("paid cred bill 7518").category, "payments");
  assert.equal(one("mutual fund 2500").category, "savings");
  assert.equal(one("sent 4700 to dad").item, "Dad");
  assert.equal(one("sent 4700 to dad").category, "family");
  assert.equal(one("protein shake and pasta 290").category, "food");
  assert.equal(one("laundry 207").category, "bills");
  assert.equal(one("cab ride 85").category, "transport");
});

test("wordsToDigits", () => {
  assert.equal(P.wordsToDigits("twenty five"), "25");
  assert.equal(P.wordsToDigits("two hundred and fifty rupees"), "250 rupees");
  assert.equal(P.wordsToDigits("one thousand two hundred"), "1200");
  assert.equal(P.wordsToDigits("four point ninety nine"), "4.99");
  assert.equal(P.wordsToDigits("4 point 5"), "4.5");
  assert.equal(P.wordsToDigits("2 hundred"), "200");
  assert.equal(P.wordsToDigits("fish and chips"), "fish and chips");
  assert.equal(P.wordsToDigits("one coffee and one tea"), "1 coffee and 1 tea");
  assert.equal(P.wordsToDigits("a hundred bucks"), "100 bucks");
});
