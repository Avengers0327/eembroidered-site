# One-time setup (about 10 minutes)

Do this once. After that, adding photos is genuinely one click and never
involves files, folders, or re-uploading anything.

## Why this exists

Plain HTML files have no server, so a web page can't save an uploaded photo
anywhere. Cloudinary is a free image host that accepts uploads straight from a
browser. Photos live there; the Our Work page reads the list live on each visit.

---

## Step 1 — Make a free Cloudinary account

Go to **cloudinary.com** and sign up. The free tier is far more than a photo
gallery will ever use.

On your dashboard, find your **Cloud name** (top left, something like
`dxyz123ab`). Copy it.

## Step 2 — Create an unsigned upload preset

This is what lets the browser upload without a password or server.

1. **Settings** (gear icon) → **Upload** → scroll to **Upload presets**
2. Click **Add upload preset**
3. Set **Signing Mode** to **Unsigned**
4. Give it a name you'll remember, e.g. `embroidery_uploads`
5. Save, and copy the preset name

While you're in the preset, worth setting:

- **Max file size** — around 10 MB stops accidental huge uploads
- **Incoming transformation** — resize to max width 2000px to save space
- **Allowed formats** — `jpg, png, heic, webp` so only images get through

## Step 3 — Turn on the photo list

The gallery needs permission to read the list of photos.

**Settings → Security** → find **Restricted media types** and make sure
**Resource list** is *not* restricted (unchecked).

Without this the Our Work page silently falls back to the photos already
bundled in the `images` folder, so nothing breaks — the new ones just won't
appear.

## Step 4 — Fill in the config file

Open **gallery-config.js** and replace the placeholders:

```js
cloudName:    "dxyz123ab",            // from Step 1
uploadPreset: "embroidery_uploads",   // from Step 2
tag:          "ourwork",              // leave as-is
password:     "pick-something-here"   // for the footer button
```

Save. Done — that's the whole setup.

## Step 5 — Test it yourself first

1. Open the site, click the small `···` at the bottom of any page
2. Enter your password → an orange **Add Photos** button appears
3. Click it, pick a photo, wait for the green checkmark
4. Open **Our Work** — your photo should be at the top within a minute

If it appears, you're finished.

---

## What Grandma does

1. Opens the website
2. Taps the orange **Add Photos** button
3. Taps **Choose Photos**, picks them from her phone
4. Waits for green checkmarks

That's it. No files, no folders, no re-uploading the site. Newest photos show
up first on Our Work.

She only needs the password once per device — after that the button is just
always there.

## Getting her set up

Easiest path: on her phone, open the site, tap the `···`, enter the password
for her, then **add the site to her home screen** so it opens like an app.

---

## Things worth knowing

**Deleting photos.** Uploading is one-click; deleting is not. To remove a
photo, log into Cloudinary and delete it from the Media Library. It disappears
from the site within a minute. Unsigned uploads deliberately can't delete
anything, which is what keeps the upload page safe to leave public.

**The upload preset is visible in the page source.** Anyone who views the
source could technically upload an image to your Cloudinary account, and
because the gallery lists by tag, it could appear on the page. For a small
local business site this is a low risk, but it's real. Options if you want to
close it:

- Turn on **manual moderation** in the preset — uploads wait for your approval
  in Cloudinary before going live. Safest, but adds a step for you.
- If junk ever appears, change the preset name in Cloudinary and in
  `gallery-config.js`. That instantly invalidates the old one.

**The password is also in the source.** It keeps customers from wandering in;
it is not real security. Nothing sensitive sits behind it — worst case someone
finds the upload page, which the paragraph above already covers.

**Existing photos are safe.** The 48 images in your `images` folder still ship
with the site and show automatically if Cloudinary is unreachable or empty.
The page never comes up blank.

**Cost.** Free tier covers a gallery like this comfortably. Cloudinary emails
you long before any limit matters.

---

## Setting up the contact form (Formspree)

The quote form on the Contact page needs one more setup step so it actually
sends a proper email instead of relying on the visitor's own email app.

### Step 1 — Make a free Formspree account

Go to **formspree.io** and sign up. Free tier covers up to 50 submissions a
month, which is plenty for a quote form.

### Step 2 — Create a form

1. Click **New Form**
2. Name it something like "Website Quote Requests"
3. Set the email it should deliver to — **everythingembroidered@hotmail.com**
4. Formspree gives you a form endpoint that looks like:
   `https://formspree.io/f/abcdwxyz`
   Copy it.

### Step 3 — Paste it into contact.html

Open **contact.html**, find this line near the top of the form:

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

Replace `YOUR_FORM_ID` with the code Formspree gave you, so it reads something
like:

```html
<form action="https://formspree.io/f/abcdwxyz" method="POST">
```

Save, replace the file in your site folder. Done.

### Step 4 — Confirm the first submission

Formspree requires one real submission to activate a new form. Fill out the
quote form on your live site once yourself — you'll get an email asking you to
confirm the form is legitimate (this is Formspree preventing spam forms, not
an error). Click confirm, and it's live from then on.

### What the email looks like

Every submission arrives as a normal email in the inbox, with the customer's
own address set as **Reply-To** — so replying goes straight to them, no
copying and pasting an address. The email lists each field (name, phone,
email, category, quantity, deadline, project details) as plain readable text.

After submitting, visitors see a small confirmation toast slide up at the
bottom of the page — no reload, no redirect, they just stay right where they
are.
---

## Admin page (delete photos)

`/admin` lets staff log in, add photos, and delete photos from the Our Work page.
Deleting needs Cloudinary's secret key, so it runs through a small Cloudflare
Pages Function (`functions/api/photos.js`). The secret stays on Cloudflare,
never in the browser.

One-time setup: Cloudflare dashboard → Workers & Pages → **eembroidered** →
**Settings → Variables and Secrets** → add these for **Production**, type **Secret**:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | the admin password (make it long) |
| `CLOUDINARY_API_KEY` | Cloudinary → Settings → API Keys |
| `CLOUDINARY_API_SECRET` | same place |

Then **Deployments → Retry deployment** on the latest one so it picks them up.
