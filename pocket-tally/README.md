# Pocket Tally

Say what you received and what you spent. Pocket Tally keeps the two columns, your month and your events, all on your own phone.

It is an installable web app that goes on the home screen of **both Android and iPhone** from one codebase. It takes only what you tell it: no bank access, no account, no server. Entries stay on the device; a backup is a file you keep wherever you like.

## How it works

1. **Received.** At the start of the month (or whenever money comes in) say **"received 69000"** or **"salary 69000"**. It goes in the Received column.
2. **Set aside.** Say **"set aside 10000"** for savings, bills you pay later, anything you don't want counted as spendable. Your month's budget is what you received minus this.
3. **Spent.** Say **"coffee 40"**, **"cab 85"**, **"kids 330 on shoes and 40 on lunch"**. Each becomes an entry with a name, amount and group. The home screen shows what's left this month.
4. **Note it down.** Tap any entry to change the name, amount, date, group or event, and to add a note. Changing a group teaches it: the same item goes there next time.
5. **Events.** A trip, a wedding, a client project. Tap **+ Event**, give it a name and, if you like, a budget. Two kinds:
   - **Part of my month**: its spending counts in your month and the event keeps its own subtotal (a Goa trip with a ₹20,000 budget).
   - **Separate money**: its own pot, never touching your month (a client gives you ₹30,000 for a project and wants to see where it went). Leave the budget empty to just keep track.
   
   While an event chip is selected, everything you say goes there. From Everyday you can also say **"cab 85 for the Goa trip"** and it finds the event by name. Say **"received 5000"** inside an event to add money to its pot.
6. **History** lists every entry by day. **Insights** shows the month's plan (received, set aside, budget, spent, left), the split by group, day by day, and your most repeated entries.

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
| `parser.js` | Turns "kids spent 330 on shoes for the Goa trip" into kind, item, amount, currency, group, date and event |
| `parser.test.mjs` | Tests for the parser: `node --test pocket-tally/parser.test.mjs` |
| `sw.js` | Service worker so the app opens with no connection |
| `manifest.webmanifest`, `icons/` | What makes it installable |

## Your data

Entries and events are stored in the browser's local storage on the device. Use **Settings → Download backup** now and then, and **Restore backup** (or **Paste a backup**) on a new phone. **Download CSV** gives a spreadsheet-friendly export. Sync through the person's own Google Drive is the planned next step; it needs a one-time Google Cloud setup to issue the app an OAuth client.

## Running locally

```sh
npx http-server pocket-tally -p 8080
# open http://localhost:8080
```

Voice input needs HTTPS or localhost.
