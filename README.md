# Password Rememberer & Pocket Tally

Two small, offline, single-page web apps. Nothing leaves your device.

## Password Rememberer (`index.html`)

A single-file, offline password keeper. Open `index.html` in a browser.

- Set a master password the first time. Everything is encrypted (AES-256-GCM, key from PBKDF2 with 600k iterations) before being saved in your browser's local storage.
- Add entries with **website**, **email/username** and **password**; search, show, copy, edit, delete.
- **Generate** makes a strong random password.
- **Export / Import backup** saves the encrypted vault as a JSON file.

Notes: nothing leaves your device. If you forget the master password the data cannot be recovered. Data is per-browser, so use Export to move it between devices.

## Pocket Tally (`pocket-tally/`)

Say what you bought ("coffee 4.50", "spent 120 on groceries") and it saves the item, amount and category, then shows where your money goes. Installs to the home screen on Android and iPhone. See [pocket-tally/README.md](pocket-tally/README.md) for setup.

## Hosting

`.github/workflows/pages.yml` publishes this repository to GitHub Pages. Turn it on once under **Settings → Pages → Source: GitHub Actions**.
