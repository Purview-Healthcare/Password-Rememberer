# Pocket Tally

Say what you bought. Pocket Tally works out the item and the amount, saves it, and shows where your money goes.

It is a small web app that installs to the home screen on **both Android and iPhone** from one codebase. Nothing is sent to a server: purchases stay on your phone.

## How it works

1. Open it from your home screen.
2. Tap the mic and say something like **"coffee 4.50"**, **"spent 120 on groceries at Walmart"**, **"uber 15 yesterday"** or **"lunch 12 and parking 5"**.
3. It saves the item, the amount and a category straight away. A toast shows what it saved, with Undo.
4. If it only caught the amount (or only the item), it asks for the missing half.
5. **History** lists every purchase by day. Tap one to change the name, amount, category, date or note. Changing a category teaches it: next time the same item goes there automatically.
6. **Insights** shows the total for the week, month, last 30 days or all time, the split by category, a day-by-day chart, and your most repeated purchases.

Amounts can be digits or words ("two hundred and fifty", "1.5k", "four dollars fifty"). Saying "rupees" or "dollars" the first time sets the currency; you can also pick it in Settings.

## Put it on your phone

The app has to be served over HTTPS for the microphone and for installing. The simplest free option is GitHub Pages:

1. Turn Pages on once: **Settings → Pages**, and under **Build and deployment** set **Source** to **GitHub Actions**. (The workflow cannot do this itself; its token is not allowed to create the Pages site.)
2. Run the **Deploy to GitHub Pages** workflow from the Actions tab, or push to the default branch. It runs the parser tests and publishes the repository.
3. The app is then at `https://<your-github-user-or-org>.github.io/Password-Rememberer/pocket-tally/`.

Then on the phone:

- **Android (Chrome):** open the link, tap **Install** on the card the app shows, or use the browser menu → **Add to Home screen**.
- **iPhone (Safari):** open the link, tap **Share** (square with an arrow) → **Add to Home Screen**.

### Voice on each platform

- **Android:** the mic button listens directly (Chrome's speech recognition, which needs a connection while you speak).
- **iPhone:** Safari supports voice in the browser tab, but iOS does not give home-screen web apps access to the mic. The app handles this: tap the text box and press the **microphone key on the keyboard**, dictate, then tap Save. The result is the same.
- Anywhere else, or offline, you can type it: `groceries 120`.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app: layout, styles and logic |
| `parser.js` | Turns "spent 120 on groceries" into item, amount, currency, category and date |
| `parser.test.mjs` | Tests for the parser: `node --test pocket-tally/parser.test.mjs` |
| `sw.js` | Service worker so the app opens with no connection |
| `manifest.webmanifest`, `icons/` | What makes it installable |

## Your data

Purchases are stored in the browser's local storage on the device. Use **Settings → Download backup** now and then, and **Restore backup** on a new phone. **Download CSV** gives a spreadsheet-friendly export.

## Running locally

```sh
npx http-server pocket-tally -p 8080
# open http://localhost:8080
```

Voice input needs HTTPS or localhost.
