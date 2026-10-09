// Run with: node --test pocket-tally/parser.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const P = require("./parser.js");

function one(text, learned) {
  const r = P.parse(text, learned);
  assert.equal(r.entries.length, 1, `expected one entry for "${text}", got ${JSON.stringify(r.entries)}`);
  return r.entries[0];
}

const cases = [
  // [spoken text, item, amount, category, currency?, dayOffset?]
  ["coffee 4.50", "Coffee", 4.5, "food"],
  ["4.50 coffee", "Coffee", 4.5, "food"],
  ["spent 120 on groceries at walmart", "Groceries at walmart", 120, "groceries"],
  ["I paid 45 for uber to the airport", "Uber to the airport", 45, "transport"],
  ["paid twenty five dollars for lunch", "Lunch", 25, "food", "USD"],
  ["lunch was twenty five bucks", "Lunch", 25, "food", "USD"],
  ["two hundred and fifty rupees for petrol", "Petrol", 250, "transport", "INR"],
  ["rs. 500 for medicines", "Medicines", 500, "health", "INR"],
  ["₹1,200 rent", "Rent", 1200, "bills", "INR"],
  ["$20 at the pharmacy", "Pharmacy", 20, "health", "USD"],
  ["bought 2 tickets for 30", "2 tickets", 30, "fun"],
  ["2 coffees for 8 dollars", "2 coffees", 8, "food", "USD"],
  ["netflix subscription 15.99", "Netflix subscription", 15.99, "bills"],
  ["1.5k on new shoes", "New shoes", 1500, "shopping"],
  ["electricity bill one thousand two hundred", "Electricity bill", 1200, "bills"],
  ["gave 50 to the plumber yesterday", "Plumber", 50, "home", null, -1],
  ["movie tickets last night 24", "Movie tickets", 24, "fun", null, -1],
  ["four dollars and fifty cents for a donut", "Donut", 4.5, "food", "USD"],
  ["50 cents parking", "Parking", 0.5, "transport"],
  ["parking at 5 pm cost 12", "Parking at 5 pm", 12, "transport"],
  ["a hundred bucks groceries", "Groceries", 100, "groceries", "USD"],
  ["Uber 12.3", "Uber", 12.3, "transport"],
  ["dinner at olive garden 86.40", "Dinner at olive garden", 86.4, "food"],
  ["three lakh for the car", "Car", 300000, "other"],
  ["gym membership 1,20,000", "Gym membership", 120000, "health"],
  ["cab 4,50", "Cab", 4.5, "transport"],
  ["spent four point five on chai", "Chai", 4.5, "food"],
  ["headphones from amazon 2999", "Headphones from amazon", 2999, "shopping"],
  ["ice cream 3", "Ice cream", 3, "food"],
  ["fish and chips 12", "Fish and chips", 12, "other"],
  ["paid 100 for groceries and vegetables", "Groceries and vegetables", 100, "groceries"],
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
  const e = one("chai", { chai: "home" });
  assert.equal(e.category, "home");
  const e2 = one("morning chai at the stall 20", { chai: "home" });
  assert.equal(e2.category, "home");
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
