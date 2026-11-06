# MKN Real Estate Point: Website

**One team • Multiple property solutions**
*From planning to property, we help you move forward.*

A static website (HTML, CSS and vanilla JavaScript, with no build step and no paid services) that is ready to publish on GitHub Pages.

```
MKN-Real-Estate-Point/
├── index.html      ← the whole website (HTML + CSS + JS)
├── Code.gs         ← Google Apps Script backend for the enquiry form
├── README.md       ← this file
└── assets/         ← images and videos (currently branded PLACEHOLDERS)
```

## Current status (please read)

| Item | Status |
|---|---|
| Website files | ✅ Built and tested locally |
| Published on GitHub Pages | ❌ **Not published yet.** Needs your manual steps (Part 3) |
| Enquiry form → Google Sheet | ❌ **Not live yet.** The Apps Script has not been deployed, so `FORM_ENDPOINT` in `index.html` is empty (Part 2). Until then the form shows an honest "not switched on, please use WhatsApp/email" message and does **not** claim to have sent anything |
| Images and videos | ⚠️ Branded placeholders. Replace them with your real files (Part 4) |

---

## Part 1: Preview locally

From inside the `MKN-Real-Estate-Point` folder:

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. (Opening `index.html` by double-click also works for most things, but a local server behaves like GitHub Pages.)

---

## Part 2: Connect the form to Google Sheets (manual: about 5 minutes)

The spreadsheet ID is already set in `Code.gs`:
`1pKllHROQ3WZsBoGhUJDXrR_V1zKaMnEoQsUsWbggwkc`

> **You must be signed in to the Google account that owns (or can edit) that spreadsheet.**

1. Open the spreadsheet: <https://docs.google.com/spreadsheets/d/1pKllHROQ3WZsBoGhUJDXrR_V1zKaMnEoQsUsWbggwkc/edit>
2. Menu **Extensions → Apps Script**. A new script project opens.
3. Delete everything in the default `Code.gs` file, then paste the **entire contents** of this project's `Code.gs`. Click **Save** (💾).
4. *(Recommended)* In the function dropdown pick **`testSetup`** and click **Run**. Google will ask for permission:
   **Review permissions → choose your account → Advanced → Go to (project name) (unsafe) → Allow.**
   (The "unsafe" warning appears because it is your own unpublished script.) This creates the **Enquiries** sheet with headers. It does not add an enquiry row.
5. Click **Deploy → New deployment**.
   - Click the ⚙️ gear next to "Select type" → **Web app**.
   - Description: `MKN enquiries v1`
   - **Execute as: Me**
   - **Who has access: Anyone**
   - Click **Deploy** (authorise again if asked).
6. Copy the **Web app URL**. It ends in `/exec`.
7. **Check it is live:** paste the URL into a browser tab. You should see:
   `{"ok":true,"service":"MKN Real Estate Point enquiry endpoint"}`
8. Open `index.html`, find this line near the bottom (search for `FORM_ENDPOINT`), and paste your URL between the quotes:

   ```js
   var FORM_ENDPOINT = 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec';
   ```
9. Save, then test: submit the form on your site and confirm a new row appears in the **Enquiries** sheet.

**If you edit `Code.gs` later:** Deploy → **Manage deployments** → ✏️ edit → Version: **New version** → Deploy. (The URL stays the same. Saving alone does not update the live version.)

### What the backend does
- Creates the **Enquiries** sheet and bold navy header row if missing.
- Columns: `Submitted At` (IST), `Name`, `Phone`, `Requirement`, `Budget`, `Message`, `Source Page`.
- Validates name, phone (Indian mobile or `+countrycode` international) and requirement, on both the browser and the server.
- **Formula-injection protection:** cells are written as plain text, and values starting with `= + - @` get a leading apostrophe.
- **Duplicate protection:** the button is disabled while sending, and the server ignores an identical enquiry (same phone, requirement and message) repeated within 2 minutes.
- A hidden honeypot field quietly discards basic bot submissions.
- Uses a script lock so simultaneous submissions never overwrite each other.

### Troubleshooting
- *Form says "could not confirm"*: check that **Who has access = Anyone** and that you pasted the `/exec` URL (not `/dev`).
- *No row appears*: Apps Script editor → **Executions** (left sidebar) shows errors.
- *Sheet permission error*: the deploying Google account must have edit access to the spreadsheet.

---

## Part 3: Publish on GitHub Pages (manual)

1. Create a free account at <https://github.com> if you do not have one.
2. Click **New repository**. Name it e.g. `mkn-real-estate-point`. Set it to **Public**. Do not add a README (this project has one).
3. Upload the project files:
   - **Easiest:** on the empty repo page click **uploading an existing file**, drag in `index.html`, `README.md`, `Code.gs` and the whole `assets` folder, then **Commit changes**.
   - **Or with git:**
     ```bash
     cd MKN-Real-Estate-Point
     git init && git add . && git commit -m "MKN Real Estate Point website"
     git branch -M main
     git remote add origin https://github.com/<your-username>/mkn-real-estate-point.git
     git push -u origin main
     ```
4. In the repo go to **Settings → Pages**. Under **Build and deployment** choose **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, then **Save**.
5. Wait 1–2 minutes. GitHub shows your live address at the top of the Pages screen, normally `https://<your-username>.github.io/mkn-real-estate-point/`.

All paths are relative, so the site works at that sub-folder address with no changes.

### Finish SEO (after you have your live address)
In `index.html` replace the two `og:image` / `twitter:image` values (marked `PUBLISHED-URL`) with the full address, e.g.
`https://<your-username>.github.io/mkn-real-estate-point/assets/hero-property.jpg`
and optionally add `<link rel="canonical" href="https://…/">` and `<meta property="og:url" content="https://…/">` in the `<head>`. Social platforms need absolute URLs for link previews.

---

## Part 4: Replace the placeholders with your real media

Upload files **with exactly these names** into the `assets/` folder on GitHub (**Add file → Upload files**; same-name files overwrite):

| File | Used for | Suggested size |
|---|---|---|
| `mkn-logo.png` | Header logo (square works best, transparent PNG) | 256×256 px |
| `hero-property.jpg` | Hero background | 1920×1080 px, under ~400 KB |
| `speed-sanarelli-cover.jpg` | Project cover | 1200×900 px |
| `sanarelli-page-01.jpg` … `-08.jpg` | Eight brochure pages | about 1200 px on the long edge |
| `interior-01.mp4` … `-03.mp4` | Interior videos (H.264 MP4) | 720p or 1080p, ideally under ~15 MB each |
| `interior-01-poster.jpg` … `-03-poster.jpg` | Video thumbnails | 1280×800 px |

The current files are small branded placeholders labelled "Placeholder: replace …" so visitors never see broken images. **Replace them before promoting the site.** If a file is ever deleted or fails to load, the page automatically falls back to a styled panel instead of a broken-image icon.

After uploading, hard-refresh the site (Ctrl/Cmd + Shift + R) because browsers cache images.

---

## Notes
- **WhatsApp buttons** open a chat with +91 8466098440; **email buttons** open a message to Krishnanaikm8@gmail.com.
- Content deliberately contains **no testimonials, ratings, prices, addresses or project specifications**, because none were supplied. Add them only when you have verified facts (and, for projects, any required RERA/registration details).
- The enquiry form's "Budget" ranges are generic options. Edit them in `index.html` (`id="f-budget"`) to suit your market.
- The header shows your logo image next to the text "MKN Real Estate Point". If your logo already contains the name, remove the `<span class="logo-text">…</span>` in the header.
- Fonts (Cormorant Garamond and Inter) load free from Google Fonts, with system-font fallbacks if offline.
