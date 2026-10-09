/*
 * Pocket Tally parser
 * Turns a spoken or typed sentence like "spent 120 on groceries at walmart"
 * into { item, amount, currency, category, dayOffset }.
 * Plain script: defines window.PocketTallyParser in the browser and
 * module.exports under Node (for the tests).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PocketTallyParser = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------- categories (8 colored groups + Other; Income is a kind, not a spend group) ----------
  var CATEGORIES = [
    { id: "food", label: "Food & Groceries", keywords: [
      "coffee", "tea", "chai", "latte", "cappuccino", "espresso", "lunch", "dinner", "breakfast", "brunch",
      "restaurant", "pizza", "burger", "burgers", "sandwich", "snack", "snacks", "starbucks", "mcdonalds",
      "mcdonald's", "subway", "kfc", "dominos", "domino's", "cafe", "café", "canteen", "takeout", "takeaway",
      "swiggy", "zomato", "doordash", "ubereats", "uber eats", "grubhub", "deliveroo", "drinks", "beer",
      "wine", "bar", "pub", "biryani", "dosa", "idli", "samosa", "thali", "noodles", "sushi", "tacos",
      "food", "meal", "meals", "juice", "smoothie", "dessert", "ice cream", "cake", "chocolate", "bakery",
      "donut", "donuts", "boba", "bubble tea", "water bottle", "soda", "cola", "poori", "puri", "bonda",
      "vada", "shawarma", "horlicks", "bournvita", "maggi", "roti", "chapati", "paratha", "curry", "tiffin",
      "biscuits", "chips", "protein shake", "protein shakes", "shake", "pasta", "eggs", "milk", "bread",
      "grocery", "groceries", "supermarket", "walmart", "costco", "kroger", "aldi", "lidl", "tesco",
      "sainsbury", "sainsburys", "asda", "safeway", "publix", "wegmans", "whole foods", "trader joes",
      "trader joe's", "bigbasket", "big basket", "dmart", "d mart", "reliance fresh", "blinkit", "zepto",
      "instamart", "vegetables", "veggies", "fruits", "fruit", "rice", "flour", "atta", "dal", "produce",
      "market", "sabzi", "provisions", "ration"
    ] },
    { id: "transport", label: "Transport", keywords: [
      "uber", "lyft", "ola", "taxi", "cab", "cab ride", "auto", "rickshaw", "bus", "train", "metro", "subway fare",
      "tram", "fuel", "gas", "gasoline", "petrol", "diesel", "parking", "toll", "tolls", "flight",
      "flights", "airfare", "airline", "rapido", "car wash", "carwash", "bike", "scooter", "rental car",
      "car rental", "fastag", "commute", "ticket to", "railway", "irctc", "indigo", "ryanair", "transit"
    ] },
    { id: "bills", label: "Bills & Home", keywords: [
      "electricity", "electric", "power bill", "water bill", "internet", "wifi", "wi-fi", "broadband",
      "phone bill", "mobile bill", "recharge", "rent", "insurance", "premium", "subscription", "tax",
      "taxes", "bill", "bills", "utility", "utilities", "maintenance fee", "society maintenance", "gas bill",
      "tuition", "school fees", "fees", "icloud", "google one", "dropbox", "chatgpt", "claude", "netflix",
      "spotify", "prime", "hotstar", "disney", "hulu", "youtube premium", "apple music",
      "cleaning", "cleaner", "maid", "repair", "repairs", "plumber", "electrician", "carpenter", "laundry",
      "dry cleaning", "detergent", "soap", "shampoo", "toilet paper", "tissues", "household", "kitchen",
      "cookware", "appliance", "appliances", "garden", "gardening", "plants", "paint", "painting",
      "hardware", "home depot", "lowes", "lowe's", "pest control", "curtains", "bedsheet", "pillow",
      "mattress", "lightbulb", "bulb", "candles", "home"
    ] },
    { id: "shopping", label: "Shopping & Fun", keywords: [
      "amazon", "flipkart", "myntra", "ajio", "ebay", "etsy", "clothes", "clothing", "shirt", "t-shirt",
      "tshirt", "shoes", "sneakers", "dress", "jeans", "jacket", "mall", "target", "ikea", "furniture",
      "electronics", "headphones", "earbuds", "charger", "cable", "gift", "gifts", "toy", "toys", "book",
      "books", "stationery", "watch", "bag", "backpack", "cosmetics", "makeup", "perfume", "shopping",
      "best buy", "apple store", "phone case", "decathlon", "nike", "adidas", "zara", "h&m", "uniqlo",
      "movie", "movies", "cinema", "film", "pvr", "inox", "amc", "concert", "gig", "game", "games",
      "gaming", "steam", "playstation", "xbox", "nintendo", "tickets", "show", "theatre", "theater",
      "museum", "zoo", "park entry", "bowling", "arcade", "club", "party", "karaoke", "comedy", "match",
      "stadium", "festival", "amusement", "hobby", "entertainment"
    ] },
    { id: "health", label: "Health", keywords: [
      "pharmacy", "chemist", "medicine", "medicines", "meds", "tablets", "doctor", "dentist", "dental",
      "hospital", "clinic", "gym", "yoga", "vitamins", "supplements", "protein", "apollo", "cvs",
      "walgreens", "boots", "medplus", "1mg", "pharmeasy", "checkup", "check-up", "lab test", "blood test",
      "therapy", "physio", "optician", "glasses", "contact lenses", "health"
    ] },
    { id: "payments", label: "Payments & Loans", keywords: [
      "lazypay", "lazy pay", "lazypay bill", "xpresscash", "xpress cash", "navi", "navi emi", "cred", "cred bill", "cred payment", "onecard", "one card", "onecard bill", "credit card",
      "card payment", "card bill", "emi", "loan", "bnpl", "simpl", "slice", "postpaid", "paytm postpaid",
      "pay later", "moneyview", "kreditbee", "zestmoney", "repayment", "repaid", "installment", "instalment",
      "mortgage", "overdraft", "debt", "borrowed", "lent", "due payment", "minimum due"
    ] },
    { id: "savings", label: "Savings & Investments", keywords: [
      "mutual fund", "mutual funds", "mf", "sip", "savings", "saving", "investment", "invest", "invested",
      "fd", "fixed deposit", "rd", "recurring deposit", "ppf", "nps", "stocks", "shares", "etf", "zerodha",
      "groww", "kuvera", "sgb", "crypto", "bitcoin", "emergency fund", "allocation", "piggy bank"
    ] },
    { id: "family", label: "Family", keywords: [
      "dad", "mom", "mum", "papa", "mummy", "amma", "appa", "father", "mother", "parents", "brother",
      "sister", "bro", "sis", "wife", "husband", "son", "daughter", "kids", "family", "grandma", "grandpa",
      "home money", "pocket money"
    ] },
    { id: "other", label: "Other", keywords: [] },
    { id: "income", label: "Income", keywords: [] }
  ];

  // ids from the first release, folded into the groups above
  var LEGACY_CATEGORY = { groceries: "food", home: "bills", fun: "shopping" };

  var CATEGORY_BY_ID = {};
  CATEGORIES.forEach(function (c) { CATEGORY_BY_ID[c.id] = c; });

  // ---------- currencies ----------
  var CURRENCY_WORDS = {
    "$": "USD", "dollar": "USD", "dollars": "USD", "buck": "USD", "bucks": "USD", "usd": "USD",
    "₹": "INR", "rupee": "INR", "rupees": "INR", "rs": "INR", "inr": "INR",
    "€": "EUR", "euro": "EUR", "euros": "EUR", "eur": "EUR",
    "£": "GBP", "pound": "GBP", "pounds": "GBP", "quid": "GBP", "gbp": "GBP",
    "¥": "JPY", "yen": "JPY", "jpy": "JPY",
    "dirham": "AED", "dirhams": "AED", "aed": "AED",
    "riyal": "SAR", "riyals": "SAR", "sar": "SAR",
    "ringgit": "MYR", "myr": "MYR",
    "peso": "PHP", "pesos": "PHP",
    "taka": "BDT", "rand": "ZAR", "naira": "NGN", "shilling": "KES", "shillings": "KES",
    "franc": "CHF", "francs": "CHF", "chf": "CHF",
    "cad": "CAD", "aud": "AUD", "sgd": "SGD"
  };
  var SUBUNIT_WORDS = { "cent": 1, "cents": 1, "paise": 1, "paisa": 1, "pence": 1, "p": 1 };
  var SYMBOLS = "$₹€£¥";

  // ---------- number words ----------
  var SMALL = {
    zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19
  };
  var TENS = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  var SCALES = { hundred: 100, thousand: 1000, grand: 1000, k: 1000, lakh: 100000, lakhs: 100000, lac: 100000, lacs: 100000, million: 1000000, crore: 10000000, crores: 10000000 };

  function isDigits(tok) { return /^\d+(?:\.\d+)?$/.test(tok); }
  function isNumberWord(tok) {
    return SMALL.hasOwnProperty(tok) || TENS.hasOwnProperty(tok) || SCALES.hasOwnProperty(tok);
  }

  /**
   * Replace spoken numbers ("twenty five", "two hundred and fifty", "four point five",
   * "2 hundred", "a hundred") with digits. Leaves everything else alone.
   */
  function wordsToDigits(text) {
    var tokens = text.replace(/-/g, " ").split(/\s+/).filter(Boolean);
    var out = [];
    var i = 0;
    while (i < tokens.length) {
      var tok = tokens[i];
      var startsNumber = isNumberWord(tok) && !SCALES.hasOwnProperty(tok) ||
        (isDigits(tok) && tokens[i + 1] === "point" && i + 2 < tokens.length && (SMALL.hasOwnProperty(tokens[i + 2]) || TENS.hasOwnProperty(tokens[i + 2]) || /^\d+$/.test(tokens[i + 2]))) ||
        (isDigits(tok) && i + 1 < tokens.length && SCALES.hasOwnProperty(tokens[i + 1]) && tokens[i + 1] !== "k") ||
        ((tok === "a" || tok === "an") && i + 1 < tokens.length && (tokens[i + 1] === "hundred" || tokens[i + 1] === "thousand" || tokens[i + 1] === "grand" || tokens[i + 1] === "million"));
      if (!startsNumber) { out.push(tok); i++; continue; }

      var total = 0, current = 0, j = i, consumed = false;
      while (j < tokens.length) {
        var t = tokens[j];
        if (t === "a" || t === "an") {
          if (j + 1 < tokens.length && SCALES.hasOwnProperty(tokens[j + 1]) && tokens[j + 1] !== "k") { current = 1; j++; continue; }
          break;
        }
        if (t === "and") {
          // only glue "hundred and twenty" style
          var prev = tokens[j - 1], next = tokens[j + 1];
          if (prev && SCALES.hasOwnProperty(prev) && next && (SMALL.hasOwnProperty(next) || TENS.hasOwnProperty(next))) { j++; continue; }
          break;
        }
        if (SMALL.hasOwnProperty(t)) { current += SMALL[t]; j++; consumed = true; continue; }
        if (TENS.hasOwnProperty(t)) { current += TENS[t]; j++; consumed = true; continue; }
        if (isDigits(t) && j === i) { current += parseFloat(t); j++; consumed = true; continue; }
        if (SCALES.hasOwnProperty(t) && t !== "k") {
          if (t === "hundred") { current = (current || 1) * 100; }
          else { total += (current || 1) * SCALES[t]; current = 0; }
          j++; consumed = true; continue;
        }
        break;
      }
      if (!consumed) { out.push(tok); i++; continue; }
      var value = total + current;
      // decimals: "four point five", "four point ninety nine", "four point five zero"
      if (j < tokens.length && tokens[j] === "point") {
        var k = j + 1, frac = "";
        while (k < tokens.length) {
          var ft = tokens[k];
          if (SMALL.hasOwnProperty(ft)) { frac += String(SMALL[ft]); k++; }
          else if (TENS.hasOwnProperty(ft)) {
            var tv = TENS[ft];
            if (k + 1 < tokens.length && SMALL.hasOwnProperty(tokens[k + 1]) && SMALL[tokens[k + 1]] < 10 && SMALL[tokens[k + 1]] > 0) { tv += SMALL[tokens[k + 1]]; k++; }
            frac += String(tv); k++;
          }
          else if (/^\d+$/.test(ft)) { frac += ft; k++; }
          else break;
        }
        if (frac) { value = parseFloat(String(value) + "." + frac); j = k; }
      }
      out.push(String(value));
      i = j;
    }
    return out.join(" ");
  }

  // ---------- amount extraction ----------
  function parseNumberString(s) {
    // "1,200" / "1,20,000" -> thousands grouping; "4,50" -> decimal comma
    var str = s;
    if (/^\d{1,3}(,\d{2,3})+(\.\d+)?$/.test(str)) {
      var parts = str.split(",");
      var lastGroup = parts[parts.length - 1].split(".")[0];
      if (parts.length === 2 && lastGroup.length === 2) str = parts[0] + "." + parts[1];
      else str = str.replace(/,/g, "");
    } else {
      str = str.replace(/,/g, "");
    }
    var n = parseFloat(str);
    return isFinite(n) ? n : null;
  }

  var SPEND_CUES = { paid: 3, pay: 2, payed: 3, spent: 3, spend: 2, cost: 3, costs: 3, costed: 3, "for": 2, was: 2, is: 1, about: 2, around: 2, approximately: 2, roughly: 2, total: 2, worth: 2, of: 1, owe: 2, owed: 2, gave: 2, charged: 3, charge: 2, bill: 1, "=": 3 };
  var TIME_WORDS = { am: 1, pm: 1, "o'clock": 1, oclock: 1, hours: 1, hour: 1, minutes: 1, mins: 1, days: 1, weeks: 1, months: 1, years: 1, people: 1, persons: 1, guests: 1, kg: 1, kgs: 1, kilo: 1, kilos: 1, grams: 1, g: 1, litre: 1, litres: 1, liters: 1, liter: 1, ml: 1, km: 1, miles: 1, percent: 1, "%": 1, st: 1, nd: 1, rd: 1, th: 1, x: 1, times: 1, pieces: 1, pcs: 1, pack: 1, packs: 1, dozen: 1 };

  function findAmount(text) {
    // returns { value, currency, start, end, score } or null
    var re = /(?:([$₹€£¥])\s*)?(\d+(?:[.,]\d+)*)(k)?(?:\s*([$₹€£¥]))?/g;
    var m, candidates = [];
    var words = text;
    while ((m = re.exec(text)) !== null) {
      var numStr = m[2];
      var start = m.index, end = start + m[0].length;
      // skip numbers glued to letters (e.g. "mp3", "1mg", "2nd")
      var before = text[start - 1], after = text[end];
      if (before && /[a-z]/i.test(before) && !m[1]) continue;
      if (after && /[a-z]/i.test(after)) {
        var trail = (text.slice(end).match(/^[a-z]+/i) || [""])[0];
        if (!TIME_WORDS[trail]) continue;
      }
      var value = parseNumberString(numStr);
      if (value === null) continue;
      if (m[3]) value *= 1000;
      var currency = null, score = 0;
      if (m[1] || m[4]) { currency = CURRENCY_WORDS[m[1] || m[4]]; score += 5; }
      var prevWord = (text.slice(0, start).match(/([^\s]+)\s*$/) || ["", ""])[1].toLowerCase().replace(/[.,!?]+$/, "");
      var nextWord = (text.slice(end).match(/^\s*([^\s]+)/) || ["", ""])[1].toLowerCase().replace(/[.,!?]+$/, "");
      var nextWord2 = (text.slice(end).match(/^\s*[^\s]+\s+([^\s]+)/) || ["", ""])[1].toLowerCase().replace(/[.,!?]+$/, "");
      var consumeNext = 0, subunit = false;
      if (CURRENCY_WORDS[nextWord]) { currency = currency || CURRENCY_WORDS[nextWord]; score += 5; consumeNext = 1; }
      else if (SUBUNIT_WORDS[nextWord]) { value = value / 100; subunit = true; score += 4; consumeNext = 1; }
      else if (CURRENCY_WORDS[prevWord]) { currency = currency || CURRENCY_WORDS[prevWord]; score += 5; }
      if (!consumeNext && !subunit && SUBUNIT_WORDS[nextWord2] && /^\d+$/.test(nextWord)) {
        // "4 dollars 50 cents" handled by the next candidate; "4 50 cents" -> 4.50
        value = value + parseInt(nextWord, 10) / 100; consumeNext = 2; score += 3;
      }
      if (SPEND_CUES[prevWord]) score += SPEND_CUES[prevWord];
      if (prevWord === "x" || prevWord === "times" || TIME_WORDS[nextWord]) score -= 6;
      if (/\./.test(numStr)) score += 2;
      if (value === 0) score -= 4;
      // small integer followed by a plain noun is probably a quantity ("2 coffees")
      if (!currency && Number.isInteger(value) && value <= 12 && nextWord && /^[a-z]/.test(nextWord) && !SPEND_CUES[nextWord] && !CURRENCY_WORDS[nextWord]) score -= 2;
      var removeStart = start, removeEnd = end;
      if (CURRENCY_WORDS[prevWord] && !m[1]) {
        removeStart = text.slice(0, start).lastIndexOf(prevWord);
        if (removeStart < 0) removeStart = start;
      }
      if (consumeNext) {
        var tail = text.slice(end).match(consumeNext === 2 ? /^\s*[^\s]+\s+[^\s]+/ : /^\s*[^\s]+/);
        if (tail) removeEnd = end + tail[0].length;
      }
      candidates.push({ value: value, currency: currency, start: removeStart, end: removeEnd, score: score, order: candidates.length });
    }
    if (!candidates.length) return null;
    candidates.sort(function (a, b) { return (b.score - a.score) || (b.order - a.order); });
    return candidates[0];
  }

  // "4 dollars and 50 cents" -> merge if the leftover is a subunit amount
  function mergeSubunits(text, amt) {
    if (!amt) return amt;
    var rest = text.slice(amt.end);
    var m = rest.match(/^\s*(?:and\s+)?(\d{1,2})\s*(cents?|paise|paisa|pence|p)\b/i);
    if (m && Number.isInteger(amt.value)) {
      amt.value = amt.value + parseInt(m[1], 10) / 100;
      amt.end = amt.end + m[0].length;
    }
    return amt;
  }

  // ---------- item cleanup ----------
  var LEAD_FILLER = ["i", "i've", "ive", "i'd", "we", "just", "spent", "spend", "paid", "payed", "pay", "bought", "buy", "purchased", "got", "get", "picked", "up", "ordered", "booked", "took", "had", "have", "grabbed", "for", "on", "at", "a", "an", "the", "some", "my", "our", "about", "around", "approximately", "roughly", "it", "its", "it's", "was", "were", "is", "cost", "costs", "costed", "me", "us", "of", "to", "and", "worth", "total", "today", "then", "also", "another", "add", "please", "okay", "ok", "so", "um", "uh", "like", "went", "gave", "sent", "transferred", "transfer", "repaid", "charged", "received", "credited", "earned", "owe", "owed", "in", "from", "with", "this", "that", "there", "here", "note", "expense", "spending", "purchase", "payment", "rs", "rupees", "dollars", "bucks", "euros", "pounds", "cents", "each", "per", "only", "again", "yesterday", "tonight", "morning", "evening", "afternoon", "night"];
  var TRAIL_FILLER = ["for", "on", "at", "of", "to", "a", "an", "the", "was", "were", "is", "cost", "costs", "costed", "each", "total", "in", "and", "about", "around", "approximately", "roughly", "rs", "rupees", "dollars", "bucks", "euros", "pounds", "only", "today", "yesterday", "tonight", "from", "with", "me", "us", "it", "please", "okay", "ok", "then", "worth", "per", "spent", "paid", "bought", "got", "this", "morning", "evening", "afternoon", "night", "last", "there", "here", "just", "so", "um", "uh", "like", "that", "received", "credited", "earned"];
  var LEAD_SET = {}, TRAIL_SET = {};
  LEAD_FILLER.forEach(function (w) { LEAD_SET[w] = 1; });
  TRAIL_FILLER.forEach(function (w) { TRAIL_SET[w] = 1; });

  var DATE_HINTS = [
    [/\bday before yesterday\b/, -2],
    [/\byesterday\b/, -1],
    [/\blast night\b/, -1],
    [/\bthis morning\b/, 0], [/\btonight\b/, 0], [/\btoday\b/, 0], [/\bjust now\b/, 0]
  ];

  function cleanItem(text) {
    var s = text.replace(/[$₹€£¥]/g, " ").replace(/[^\w\s'&.-]/g, " ").replace(/\s+/g, " ").trim();
    var words = s.split(" ").filter(Boolean);
    while (words.length && LEAD_SET[words[0].toLowerCase().replace(/[.,]+$/, "")]) words.shift();
    while (words.length && TRAIL_SET[words[words.length - 1].toLowerCase().replace(/[.,]+$/, "")]) words.pop();
    var item = words.join(" ").replace(/^[.\-&\s]+|[.\-&\s]+$/g, "");
    if (!item) return "";
    return item.charAt(0).toUpperCase() + item.slice(1);
  }

  function normalizeKey(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  // ---------- categories ----------
  function categorize(text, learned) {
    var key = normalizeKey(text);
    if (!key) return "other";
    if (learned) {
      if (learned[key]) return learned[key];
      var bestLen = 0, best = null;
      Object.keys(learned).forEach(function (k) {
        if (k && k.length > bestLen && (" " + key + " ").indexOf(" " + k + " ") >= 0) { bestLen = k.length; best = learned[k]; }
      });
      if (best) return best;
    }
    var padded = " " + key + " ";
    var bestCat = "other", bestKw = 0;
    CATEGORIES.forEach(function (cat) {
      cat.keywords.forEach(function (kw) {
        var k = normalizeKey(kw);
        if (!k) return;
        var hit = padded.indexOf(" " + k + " ") >= 0 || padded.indexOf(" " + k + "s ") >= 0 || padded.indexOf(" " + k + "es ") >= 0;
        if (hit && k.length > bestKw) { bestKw = k.length; bestCat = cat.id; }
      });
    });
    return bestCat;
  }

  // ---------- main ----------
  var INCOME_RE = /\b(salary|salaries|received|got paid|paid me|income|credited|refund|refunded|cashback|cash back|bonus|cash (?:on|in) hand|opening balance|starting balance|brought forward|earned|reimbursed|reimbursement|stipend|dividend|interest received|sold|won)\b/;

  function preclean(raw) {
    return String(raw || "")
      .toLowerCase()
      .replace(/\brs\.\s*/g, "rs ")
      .replace(/\/-/g, " ")
      .replace(/([$₹€£¥])\s+(?=\d)/g, "$1")
      .replace(/(\d)\s*(?:dollars?|bucks)\s+(\d{1,2})\s*cents?\b/g, "$1 dollars and $2 cents")
      .replace(/[“”"]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseOne(raw) {
    var text = wordsToDigits(preclean(raw));
    var kind = (INCOME_RE.test(text) || /(^|\s)\+\s*\d/.test(text)) ? "income" : "expense";
    text = text.replace(/\+\s*(?=\d)/g, " ");
    var dayOffset = 0, working = text;
    for (var d = 0; d < DATE_HINTS.length; d++) {
      if (DATE_HINTS[d][0].test(working)) { dayOffset = DATE_HINTS[d][1]; working = working.replace(DATE_HINTS[d][0], " "); break; }
    }
    var amt = mergeSubunits(working, findAmount(working));
    var itemText = amt ? (working.slice(0, amt.start) + " " + working.slice(amt.end)) : working;
    var item = cleanItem(itemText);
    return {
      raw: String(raw || "").trim(),
      item: item,
      amount: amt ? Math.round(amt.value * 100) / 100 : null,
      currency: amt ? amt.currency : null,
      dayOffset: dayOffset,
      kind: kind,
      category: null // filled by parse() so learned mappings apply
    };
  }

  /**
   * parse(text, learned?) -> { entries: [...] }
   * Splits "coffee 5 and sandwich 8" into two entries when every part has an amount.
   */
  function parse(raw, learned) {
    var text = wordsToDigits(preclean(raw));
    // protect commas inside numbers ("1,200") from the list split
    var guarded = text.replace(/(\d),(\d)/g, "$1\u0001$2");
    var parts = guarded.split(/\s*(?:,|;|\band\b|\bplus\b|\balso\b|\bthen\b)\s*/)
      .map(function (p) { return p.replace(/\u0001/g, ","); })
      .filter(function (p) { return p.trim(); });
    var entries;
    if (parts.length >= 2 && parts.every(function (p) { return findAmount(p) !== null; })) {
      entries = parts.map(parseOne);
      // "4 dollars and 50 cents" style false split: both parts parsed but second is subunits
      if (entries.length === 2 && /^\s*\d{1,2}\s*(cents?|paise|paisa|pence|p)\b/.test(parts[1])) entries = [parseOne(text)];
    } else {
      entries = [parseOne(text)];
    }
    entries.forEach(function (e) { e.category = e.kind === "income" ? "income" : categorize((e.item || "") + " " + e.raw, learned); });
    return { entries: entries, normalized: text };
  }

  return {
    parse: parse,
    parseOne: parseOne,
    wordsToDigits: wordsToDigits,
    categorize: categorize,
    normalizeKey: normalizeKey,
    CATEGORIES: CATEGORIES,
    CATEGORY_BY_ID: CATEGORY_BY_ID,
    LEGACY_CATEGORY: LEGACY_CATEGORY,
    CURRENCY_WORDS: CURRENCY_WORDS
  };
});
