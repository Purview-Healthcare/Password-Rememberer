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
      "waiter", "tip", "booze", "liquor", "whisky", "vodka", "cigarette", "cigarettes", "smokes", "smoke",
      "grocery", "groceries", "supermarket", "walmart", "costco", "kroger", "aldi", "lidl", "tesco",
      "sainsbury", "sainsburys", "asda", "safeway", "publix", "wegmans", "whole foods", "trader joes",
      "trader joe's", "bigbasket", "big basket", "dmart", "d mart", "reliance fresh", "blinkit", "zepto",
      "instamart", "vegetables", "veggies", "fruits", "fruit", "rice", "flour", "atta", "dal", "produce",
      "market", "sabzi", "provisions", "ration"
    ] },
    { id: "transport", label: "Travel & Transport", keywords: [
      "hotel", "hotels", "resort", "airbnb", "hostel", "lodge", "oyo", "homestay", "stay", "booking", "makemytrip",
      "goibibo", "agoda", "visa", "luggage", "suitcase", "trip", "travel", "holiday", "vacation", "sightseeing",
      "uber", "lyft", "ola", "taxi", "cab", "cab ride", "auto", "rickshaw", "bus", "train", "metro", "subway fare",
      "tram", "fuel", "gas", "gasoline", "petrol", "diesel", "parking", "toll", "tolls", "flight",
      "flights", "airfare", "airline", "rapido", "car wash", "carwash", "bike", "scooter", "rental car",
      "car rental", "fastag", "commute", "ticket to", "railway", "irctc", "indigo", "ryanair", "transit"
    ] },
    { id: "bills", label: "Bills & Home", keywords: [
      "electricity", "electric", "power bill", "water bill", "internet", "wifi", "wi-fi", "broadband",
      "phone bill", "mobile bill", "recharge", "recharged", "top up", "topped up", "rent", "insurance", "premium", "subscription", "tax",
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
      "stadium", "festival", "amusement", "hobby", "entertainment", "gambling", "gambled", "bet", "bets",
      "betting", "casino", "lottery", "poker", "rummy", "teen patti", "dream11", "fantasy league"
    ] },
    { id: "health", label: "Health", keywords: [
      "pharmacy", "chemist", "medicine", "medicines", "meds", "tablets", "doctor", "dentist", "dental",
      "hospital", "clinic", "gym", "yoga", "vitamins", "supplements", "protein", "apollo", "cvs",
      "walgreens", "boots", "medplus", "1mg", "pharmeasy", "checkup", "check-up", "lab test", "blood test",
      "therapy", "physio", "optician", "glasses", "contact lenses", "health", "haircut", "salon", "barber",
      "spa", "grooming", "massage", "parlour", "parlor"
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
    { id: "income", label: "Received", keywords: [] },
    { id: "aside", label: "Set aside", keywords: [] }
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

      var total = 0, current = 0, j = i, consumed = false, lastUnit = false;
      while (j < tokens.length) {
        var t = tokens[j];
        // "one fifty" -> 150, "two thirty five" -> 235, "one fifteen" -> 115 (spoken hundreds)
        if (lastUnit && current >= 1 && current <= 9 && total === 0 && (TENS.hasOwnProperty(t) || (SMALL.hasOwnProperty(t) && SMALL[t] >= 10))) {
          current = current * 100 + (TENS[t] || SMALL[t]); lastUnit = false; j++; consumed = true; continue;
        }
        lastUnit = SMALL.hasOwnProperty(t) && SMALL[t] >= 1 && SMALL[t] <= 9 && current === 0;
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
      if (j < tokens.length && tokens[j] === "k") { value = value * 1000; j++; }
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
      // the word before the amount phrase and the word after it (for "spent 330 on shoes" -> "shoes")
      var beforeM = text.slice(0, removeStart).match(/([^\s]+)\s*$/);
      var afterM = text.slice(removeEnd).match(/^\s*([^\s]+)/);
      candidates.push({
        value: value, currency: currency, start: removeStart, end: removeEnd, score: score, order: candidates.length,
        beforeWord: beforeM ? beforeM[1].toLowerCase() : "", beforeStart: beforeM ? removeStart - beforeM[0].length : removeStart,
        afterWord: afterM ? afterM[1].toLowerCase() : "", afterEnd: afterM ? removeEnd + afterM[0].length : removeEnd
      });
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
  var LEAD_FILLER = ["i", "i've", "ive", "i'd", "we", "just", "spent", "spend", "paid", "payed", "pay", "bought", "buy", "purchased", "got", "get", "picked", "up", "ordered", "booked", "took", "had", "have", "grabbed", "for", "on", "at", "a", "an", "the", "some", "my", "our", "about", "around", "approximately", "roughly", "it", "its", "it's", "was", "were", "is", "cost", "costs", "costed", "me", "us", "of", "to", "and", "worth", "total", "today", "then", "also", "another", "add", "please", "okay", "ok", "so", "um", "uh", "like", "went", "gave", "sent", "transferred", "transfer", "repaid", "charged", "received", "credited", "earned", "threw", "blew", "wasted", "burned", "burnt", "dropped", "splurged", "shelled", "forked", "coughed", "dumped", "poured", "lost", "put", "all", "into", "onto", "towards", "filled", "recharged", "topped", "tipped", "donated", "lent", "borrowed", "won", "sold", "took", "collected", "cleared", "settled", "moved", "deposited", "invested", "withdrew", "back", "returned", "literally", "basically", "actually", "honestly", "we've", "weve", "he", "she", "today's", "yesterday's", "bro", "yaar", "man", "dude", "hey", "hi", "hello", "add", "log", "record", "write", "down", "enter", "owe", "owed", "in", "from", "with", "this", "that", "there", "here", "note", "expense", "spending", "purchase", "payment", "rs", "rupees", "dollars", "bucks", "euros", "pounds", "cents", "each", "per", "only", "again", "yesterday", "tonight", "morning", "evening", "afternoon", "night"];
  var TRAIL_FILLER = ["for", "on", "at", "of", "to", "a", "an", "the", "was", "were", "is", "cost", "costs", "costed", "each", "total", "in", "and", "about", "around", "approximately", "roughly", "rs", "rupees", "dollars", "bucks", "euros", "pounds", "only", "today", "yesterday", "tonight", "from", "with", "me", "us", "it", "please", "okay", "ok", "then", "worth", "per", "spent", "paid", "bought", "got", "this", "morning", "evening", "afternoon", "night", "last", "there", "here", "just", "so", "um", "uh", "like", "that", "received", "credited", "earned", "came", "sent", "gave", "paid", "refunded", "back", "me", "us", "altogether", "overall", "roughly", "approx", "approximately", "bro", "yaar", "man", "dude", "thanks", "ok", "okay", "done", "basically", "literally", "actually", "honestly", "in", "into", "onto", "towards", "as"];
  var LEAD_SET = {}, TRAIL_SET = {};
  LEAD_FILLER.forEach(function (w) { LEAD_SET[w] = 1; });
  TRAIL_FILLER.forEach(function (w) { TRAIL_SET[w] = 1; });

  var DATE_HINTS = [
    [/\bday before yesterday\b/, -2],
    [/\byesterday\b/, -1],
    [/\blast night\b/, -1],
    [/\blast week\b/, -7],
    [/\bthis morning\b/, 0], [/\btonight\b/, 0], [/\btoday\b/, 0], [/\bjust now\b/, 0], [/\bearlier\b/, 0]
  ];
  var WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  // "on monday" -> the most recent Monday (today if it is Monday); "3 days ago" -> -3
  function dateHint(text, now) {
    for (var d = 0; d < DATE_HINTS.length; d++) if (DATE_HINTS[d][0].test(text)) return { offset: DATE_HINTS[d][1], text: text.replace(DATE_HINTS[d][0], " ") };
    var m = text.match(/\b(\d{1,2})\s+days?\s+(?:ago|back|before)\b/);
    if (m) return { offset: -parseInt(m[1], 10), text: text.replace(m[0], " ") };
    m = text.match(/\b(?:on\s+|last\s+|this\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (m) {
      var today = (now || new Date()).getDay(), target = WEEKDAYS.indexOf(m[1]);
      var back = (today - target + 7) % 7;
      if (/\blast\s+/.test(m[0]) && back === 0) back = 7;
      return { offset: back ? -back : 0, text: text.replace(m[0], " ") };
    }
    return null;
  }

  // "3 coffees", "3 x coffee", "coffee x3" -> quantity 3 and the item without the count
  function extractQty(words) {
    var qty = 1, m;
    if (words.length > 1 && /^\d{1,3}$/.test(words[0]) && /^[x×]$/i.test(words[1]) && words.length > 2) { qty = parseInt(words[0], 10); words = words.slice(2); }
    else if (words.length > 1 && (m = words[0].match(/^(\d{1,3})[x×]$/i))) { qty = parseInt(m[1], 10); words = words.slice(1); }
    else if (words.length > 1 && /^\d{1,3}$/.test(words[0]) && /^[a-z]/i.test(words[1]) && !CURRENCY_WORDS[words[1].toLowerCase()]) { qty = parseInt(words[0], 10); words = words.slice(1); }
    else if (words.length > 1 && (m = words[words.length - 1].match(/^[x×](\d{1,3})$/i))) { qty = parseInt(m[1], 10); words = words.slice(0, -1); }
    else if (words.length > 2 && /^[x×]$/i.test(words[words.length - 2]) && /^\d{1,3}$/.test(words[words.length - 1])) { qty = parseInt(words[words.length - 1], 10); words = words.slice(0, -2); }
    return { qty: qty >= 1 ? qty : 1, words: words };
  }

  function cleanItem(text, wantQty) {
    var s = text.replace(/[$₹€£¥]/g, " ").replace(/[^\w\s'&.×-]/g, " ").replace(/\s+/g, " ").trim();
    var words = s.split(" ").filter(Boolean);
    while (words.length && LEAD_SET[words[0].toLowerCase().replace(/[.,]+$/, "")]) words.shift();
    while (words.length && TRAIL_SET[words[words.length - 1].toLowerCase().replace(/[.,]+$/, "")]) words.pop();
    var qty = 1;
    if (wantQty) { var q = extractQty(words); qty = q.qty; words = q.words; }
    while (words.length && LEAD_SET[words[0].toLowerCase().replace(/[.,]+$/, "")]) words.shift();
    var item = words.join(" ").replace(/^[.\-&\s]+|[.\-&\s]+$/g, "");
    item = item ? item.charAt(0).toUpperCase() + item.slice(1) : "";
    return wantQty ? { item: item, qty: qty } : item;
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
  var ASIDE_RE = /\b(?:set|keep|put|setting|keeping|putting)\s+aside\b|\bsav(?:e|ing)\b/;
  var SPEND_VERBS = { spent: 1, spend: 1, spending: 1, spends: 1, paid: 1, pay: 1, payed: 1, paying: 1, cost: 1, costs: 1, costed: 1, was: 1, is: 1, were: 1, "for": 1, of: 1, worth: 1, charged: 1, gave: 1, give: 1, sent: 1, transferred: 1, owe: 1, owed: 1, "=": 1, around: 1, about: 1, approx: 1, approximately: 1, roughly: 1, nearly: 1, almost: 1, to: 1, me: 1, us: 1, threw: 1, blew: 1, wasted: 1, burned: 1, burnt: 1, dropped: 1, splurged: 1, out: 1, dumped: 1, poured: 1, lost: 1, put: 1, tipped: 1, donated: 1, lent: 1, deposited: 1, invested: 1, withdrew: 1, collected: 1, won: 1, earned: 1, received: 1, got: 1, borrowed: 1, returned: 1, another: 1, extra: 1, like: 1, some: 1, only: 1, just: 1, total: 1, totalling: 1, totaling: 1 };
  var POST_PREP = { on: 1, "for": 1, at: 1, to: 1, towards: 1, "in": 1, into: 1, onto: 1, with: 1, as: 1 };
  var EVENT_STOP = { the: 1, a: 1, an: 1, of: 1, "for": 1, and: 1, my: 1, our: 1, with: 1, to: 1, "in": 1, on: 1, at: 1 };

  /**
   * Find which event (by name) a sentence refers to: "cab 85 for the goa trip".
   * events: [{id, name}]. Returns { id, text } with the mention removed, or null.
   */
  function matchEvent(text, events) {
    if (!events || !events.length) return null;
    var words = text.split(/\s+/);
    var lower = words.map(function (w) { return w.toLowerCase().replace(/[^a-z0-9]/g, ""); });
    var best = null;
    events.forEach(function (ev, idx) {
      var nameWords = normalizeKey(ev.name).split(" ").filter(function (w) { return w && !EVENT_STOP[w]; });
      if (!nameWords.length) return;
      var hits = [];
      nameWords.forEach(function (nw) {
        var i = lower.indexOf(nw);
        if (i >= 0 && hits.indexOf(i) < 0) hits.push(i);
      });
      if (!hits.length) return;
      var score = hits.length + (hits.length === nameWords.length ? 2 : 0);
      if (!best || score > best.score || (score === best.score && idx < best.idx)) best = { id: ev.id, score: score, hits: hits, idx: idx };
    });
    if (!best) return null;
    // also drop "for the"/"on the" right before the first matched word
    var drop = {};
    best.hits.forEach(function (i) { drop[i] = 1; });
    var first = Math.min.apply(null, best.hits);
    var j = first - 1;
    if (j >= 0 && (lower[j] === "the" || lower[j] === "my" || lower[j] === "our")) { drop[j] = 1; j--; }
    if (j >= 0 && (POST_PREP[lower[j]] || lower[j] === "during" || lower[j] === "from" || lower[j] === "of")) { drop[j] = 1; }
    var kept = words.filter(function (w, i) { return !drop[i]; });
    return { id: best.id, text: kept.join(" ").replace(/\s+/g, " ").trim() };
  }

  var INCOME_RE = /\b(salary|salaries|payday|pay day|received|receive|got paid|paid me|paid us|pays me|gave me|gave us|sent me|sent us|handed me|came in|credited|income|refund|refunded|cashback|cash back|bonus|incentive|cash (?:on|in) hand|opening balance|starting balance|brought forward|earned|reimbursed|reimbursement|stipend|dividend|interest received|interest credited|sold|won|borrowed|took a loan|loan came|got a loan|collected|found|gift from|pocket money from|returned|got (?:it |the money |my money )?back|got (?:rs\.?|₹|\$)?\s*\d[\d,.]*k?\s+(?:back|from))\b/;
  // "returned 500 to ravi" is money out, "ravi returned 500" is money in
  var RETURN_OUT_RE = /\breturned\s+(?:rs\.?|₹|\$)?\s*\d[\d,.]*k?\s+(?:to|back to)\b/;
  // words used when the item was only a verb: "tipped 50" -> Tip
  var VERB_NOUN = { tipped: "Tip", tip: "Tip", donated: "Donation", donation: "Donation", gambled: "Gambling", gambling: "Gambling", lost: "Lost", withdrew: "Cash withdrawal", withdrawal: "Cash withdrawal", atm: "ATM withdrawal", recharged: "Recharge", recharge: "Recharge", topped: "Top-up", refuelled: "Fuel", refueled: "Fuel", fuel: "Fuel", borrowed: "Borrowed", lent: "Lent", invested: "Investment", deposited: "Deposit", salary: "Salary", payday: "Salary", wasted: "Wasted", blew: "Blown", splurged: "Splurge", commission: "Commission", cashback: "Cashback", refund: "Refund", bonus: "Bonus", interest: "Interest", dividend: "Dividend", won: "Winnings", found: "Found money" };

  // ---------- forgiving spelling for the words that decide in vs out ----------
  var FUZZ_TARGETS = [["received", 2], ["credited", 2], ["cashback", 2], ["borrowed", 2], ["returned", 2], ["refunded", 2], ["salary", 1], ["refund", 2], ["aside", 1], ["spent", 1], ["lakh", 1]];
  var KNOWN = null;
  function knownWords() {
    if (KNOWN) return KNOWN;
    KNOWN = {};
    function add(w) { String(w).toLowerCase().split(/[^a-z']+/).forEach(function (x) { if (x) KNOWN[x] = 1; }); }
    LEAD_FILLER.forEach(add); TRAIL_FILLER.forEach(add);
    Object.keys(SPEND_VERBS).forEach(add); Object.keys(POST_PREP).forEach(add); Object.keys(CURRENCY_WORDS).forEach(add); Object.keys(SUBUNIT_WORDS).forEach(add);
    Object.keys(SMALL).forEach(add); Object.keys(TENS).forEach(add); Object.keys(SCALES).forEach(add); Object.keys(TIME_WORDS).forEach(add); Object.keys(VERB_NOUN).forEach(add);
    CATEGORIES.forEach(function (c) { c.keywords.forEach(add); });
    WEEKDAYS.forEach(add); Object.keys(EVENT_STOP).forEach(add);
    ["recent", "recently", "receipt", "receipts", "recipe", "recipes", "salad", "salads", "scent", "spelt", "spend", "sent", "scene", "return", "returns", "refine", "refuel", "reside", "beside", "inside", "outside", "sided", "asides", "aside", "spent", "spend", "spending", "spends", "crediting", "credits", "credit", "borrow", "borrowing", "refuse", "refused", "refuses", "refined", "refill", "refills", "round", "rebound", "resend", "refer", "referred", "lakhs", "lake", "lamp", "lack", "lash", "latch", "lady", "cash", "cashier", "cashew", "cashews"].forEach(add);
    return KNOWN;
  }
  function editDistance(a, b) {
    if (a === b) return 0;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 2) return 3;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= lb; j++) prev[j] = j;
    for (i = 1; i <= la; i++) {
      cur[0] = i;
      for (j = 1; j <= lb; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[lb];
  }
  function fuzzWord(w) {
    if (w.length < 5 || !/^[a-z]+$/.test(w) || knownWords()[w]) return w;
    for (var i = 0; i < FUZZ_TARGETS.length; i++) {
      var t = FUZZ_TARGETS[i][0], max = FUZZ_TARGETS[i][1];
      if (Math.abs(t.length - w.length) <= max && editDistance(w, t) <= max) return t;
    }
    return w;
  }
  function fuzzText(text) { return text.split(/(\s+)/).map(function (tok) { return /\s/.test(tok) ? tok : fuzzWord(tok); }).join(""); }

  function preclean(raw) {
    return fuzzText(String(raw || "")
      .toLowerCase()
      .replace(/\bset\s*a\s*side\b/g, "set aside")
      .replace(/\brecie?ve?d?\b/g, function (m) { return m.length >= 6 ? "received" : m; })
      .replace(/\brs\.\s*/g, "rs ")
      .replace(/\/-/g, " ")
      .replace(/([$₹€£¥])\s+(?=\d)/g, "$1")
      .replace(/(\d)\s*(?:dollars?|bucks)\s+(\d{1,2})\s*cents?\b/g, "$1 dollars and $2 cents")
      .replace(/\bkharch(?:a|e)?\s*(?:kiye|kiya|kar\s+diya|ho\s+gaya|hua)?\b/g, " spent ")
      .replace(/\b(?:paise\s+)?(?:mila|mile|aaya|aaye|aa\s+gaya|aa\s+gaye|credit\s+hua|credit\s+hue)\b/g, " received ")
      .replace(/\b(?:de\s+diya|de\s+diye|diya|diye|bheja|bheje|bhej\s+diya)\b/g, " gave ")
      .replace(/\bke\s+liye\b/g, " for ")
      .replace(/\b(?:pe|par|mein)\b/g, " on ")
      .replace(/\b(?:all|half)\s+(?:of\s+)?(?:my|the|our)\s+(?:money|cash|savings)\b/g, " ")
      .replace(/\b(\d+(?:\.\d+)?)\s+k\b/g, "$1k")
      .replace(/\bgrand\b/g, "thousand")
      .replace(/\bper\s+(?:piece|pc|item|unit|head|person|pax|plate|cup|bottle|packet|pack|kg|kilo|litre|liter|dozen)\b/g, "each")
      .replace(/\bapiece\b/g, "each")
      .replace(/[“”"]/g, "")
      .replace(/\s+/g, " ")
      .trim());
  }

  function parseOne(raw, events, now) {
    var text = wordsToDigits(preclean(raw));
    var kind = ASIDE_RE.test(text) ? "aside" : ((INCOME_RE.test(text) && !RETURN_OUT_RE.test(text)) || /(^|\s)\+\s*\d/.test(text)) ? "income" : "expense";
    text = text.replace(/\+\s*(?=\d)/g, " ");
    if (kind === "aside") text = text.replace(ASIDE_RE, " ");
    var eventId = null;
    var ev = matchEvent(text, events);
    if (ev) { eventId = ev.id; text = ev.text; }
    var dayOffset = 0, working = text;
    var dh = dateHint(working, now);
    if (dh) { dayOffset = dh.offset; working = dh.text; }
    var amt = mergeSubunits(working, findAmount(working));
    var itemText = working, perUnit = false;
    if (amt) {
      var s = amt.start, e = amt.end;
      if (SPEND_VERBS[amt.beforeWord]) s = amt.beforeStart;
      if (amt.afterWord === "each") { perUnit = true; e = amt.afterEnd; var after2 = working.slice(e).match(/^\s*(on|for|at|to|in)\b/); if (after2) e += after2[0].length; }
      else if (POST_PREP[amt.afterWord]) e = amt.afterEnd;
      itemText = working.slice(0, s) + " " + working.slice(e);
    }
    var cleaned = cleanItem(itemText, kind === "expense");
    var item = kind === "expense" ? cleaned.item : cleaned;
    var qty = kind === "expense" ? cleaned.qty : 1;
    if (kind === "aside") item = item ? "Set aside · " + item : "Set aside";
    var rawWords = text.toLowerCase().split(/\s+/);
    if (/\bborrowed\b/.test(text) && item && !/^borrowed/i.test(item)) item = "Borrowed from " + item.charAt(0).toLowerCase() + item.slice(1);
    else if (/\blent\b/.test(text) && item && !/^lent/i.test(item)) item = "Lent to " + item.charAt(0).toLowerCase() + item.slice(1);
    if (!item && amt) {
      for (var w = 0; w < rawWords.length && !item; w++) if (VERB_NOUN[rawWords[w]]) item = VERB_NOUN[rawWords[w]];
    }
    if (kind === "income" && !item && amt) item = "Received";
    var unit = amt ? Math.round(amt.value * 100) / 100 : null;
    var total = unit === null ? null : (perUnit ? Math.round(unit * qty * 100) / 100 : unit);
    if (!perUnit && unit !== null && qty > 1) unit = Math.round(total / qty * 100) / 100;
    return {
      raw: String(raw || "").trim(),
      item: item,
      amount: total,
      qty: qty,
      unit: unit,
      currency: amt ? amt.currency : null,
      dayOffset: dayOffset,
      kind: kind,
      eventId: eventId,
      category: null // filled by parse() so learned mappings apply
    };
  }

  var UNDO_RE = /^(?:please\s+)?(?:undo(?:\s+that|\s+last|\s+the\s+last(?:\s+one)?)?|scratch\s+that|cancel(?:\s+that|\s+last)?|delete\s+(?:that|the\s+last(?:\s+one|\s+entry)?|last)|remove\s+(?:that|the\s+last(?:\s+one)?)|never\s*mind|oops)[.!?]?$/;
  var STATUS_RE = /\b(?:how much (?:have i|did i|have we|i've) spent|how much (?:is|do i have) left|what(?:'s| is) (?:my )?(?:balance|left)|where (?:am i|do i stand)|spent (?:so far|today|this month)\?|balance\?|total\?)/;
  function command(text) {
    var t = String(text || "").toLowerCase().trim();
    if (UNDO_RE.test(t)) return "undo";
    if (STATUS_RE.test(t) && !/\d/.test(t)) return "status";
    return null;
  }

  /**
   * parse(text, learned?, events?, now?) -> { entries: [...], command? }
   * Splits "coffee 5 and sandwich 8" into two entries when every part has an amount.
   */
  function parse(raw, learned, events, now) {
    var cmd = command(raw);
    if (cmd) return { entries: [], command: cmd, normalized: String(raw || "").trim() };
    var text = wordsToDigits(preclean(raw));
    // protect commas inside numbers ("1,200") from the list split
    var guarded = text.replace(/(\d),(\d)/g, "$1\u0001$2");
    var parts = guarded.split(/\s*(?:,|;|\band\b|\bplus\b|\balso\b|\bthen\b)\s*/)
      .map(function (p) { return p.replace(/\u0001/g, ","); })
      .filter(function (p) { return p.trim(); });
    var entries;
    if (parts.length >= 2 && parts.every(function (p) { return findAmount(p) !== null; })) {
      entries = parts.map(function (p) { return parseOne(p, events, now); });
      // "4 dollars and 50 cents" style false split: both parts parsed but second is subunits
      if (entries.length === 2 && /^\s*\d{1,2}\s*(cents?|paise|paisa|pence|p)\b/.test(parts[1])) entries = [parseOne(text, events, now)];
      // one event mention covers every part of the sentence
      var shared = null;
      entries.forEach(function (e) { if (e.eventId) shared = e.eventId; });
      if (shared) entries.forEach(function (e) { if (!e.eventId) e.eventId = shared; });
    } else {
      entries = [parseOne(text, events, now)];
    }
    entries.forEach(function (e) { e.category = e.kind === "income" ? "income" : e.kind === "aside" ? "aside" : categorize((e.item || "") + " " + e.raw, learned); });
    return { entries: entries, normalized: text };
  }

  return {
    parse: parse,
    parseOne: parseOne,
    command: command,
    dateHint: dateHint,
    fuzzWord: fuzzWord,
    matchEvent: matchEvent,
    wordsToDigits: wordsToDigits,
    categorize: categorize,
    normalizeKey: normalizeKey,
    CATEGORIES: CATEGORIES,
    CATEGORY_BY_ID: CATEGORY_BY_ID,
    LEGACY_CATEGORY: LEGACY_CATEGORY,
    CURRENCY_WORDS: CURRENCY_WORDS
  };
});
