# Password Rememberer

A single-file, offline password keeper. Open `index.html` in a browser.

- Set a master password the first time. Everything is encrypted (AES-256-GCM, key from PBKDF2 with 600k iterations) before being saved in your browser's local storage.
- Add entries with **website**, **email/username** and **password**; search, show, copy, edit, delete.
- **Generate** makes a strong random password.
- **Export / Import backup** saves the encrypted vault as a JSON file.

Notes: nothing leaves your device. If you forget the master password the data cannot be recovered. Data is per-browser, so use Export to move it between devices.

---

**Also in this repo:** [`claim-inspector/`](claim-inspector/) - a family-medicine revenue-cycle workbench (claim scrubber, CPT/Dx/taxonomy matching, E/M leveler, denials). Open `claim-inspector/index.html`.
