# 🧵 Everything Embroidered — The Website

**Your one-stop-shop for all things custom — now on the internet, without the monthly Squarespace tax.**

---

## What is this?

A blazing-fast, zero-backend, *shockingly* cheap-to-run website for a family-owned custom embroidery and printing shop that's been slinging monogrammed towels and holiday stockings out of Paramus Park Mall for 18+ years.

No database. No server to patch at 2am. No "your subscription is about to renew" emails ever again.

## ✨ Features

- **7 fully custom pages** — Home, About, Our Work, Testimonials, Bulk & Corporate, FAQs, Contact — hand-built, not templated
- **Live photo gallery** that updates itself the moment a new photo gets uploaded, no redeploy required
- **One-tap photo uploads** for non-technical staff — genuinely one click, works from a phone, no files or folders involved
- **Real quote request form** that lands in an actual inbox, reply-to already set to the customer, confirmation toast included — no mailto links, no "did that even send?"
- **Quietly gated staff tools** tucked into the footer, invisible to customers, one password away for whoever's in charge
- **Fully responsive**, phone to desktop, with a sticky call button that shows up exactly when someone's thumb needs it
- **Hand-picked design system** — Fraunces + Inter, a navy/terracotta palette, and a hand-stitched dashed-thread motif because a craft business deserves a site that looks handmade too

## 🛠️ Built with

- Plain HTML, CSS, and vanilla JS — no framework, no build step, no `node_modules` folder eating your hard drive
- [Cloudinary](https://cloudinary.com) for photo hosting and the live gallery feed
- [Formspree](https://formspree.io) for the contact form, because reinventing email is a bad Tuesday
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com) / [Netlify](https://netlify.com) — pick one, both are free, both are great

## 💸 What it costs to run

**$0/month.** Hosting: free. Photo storage: free tier. Contact form: free tier. The only recurring cost is whatever you're paying for a domain name — and that's optional too.

## 🚀 Getting it live

1. Fill in `gallery-config.js` with your Cloudinary details (see `SETUP.md`)
2. Drop your Formspree form ID into `contact.html`
3. Drag the whole folder onto Netlify, or push it to Cloudflare Pages
4. Done. Tell your grandma she can start uploading photos.

## 📁 What's in here

```
index.html          → Home
about.html           → About
work.html             → Our Work (live gallery)
testimonials.html     → Testimonials
bulk.html             → Bulk & Corporate
faq.html               → FAQs
contact.html           → Contact + quote form
upload.html            → One-tap photo uploader (staff only)
admin.html              → Full gallery editor (optional, keep local)
style.css                → Every color, font, and stitch you see
site.js / gallery.js / gallery-config.js  → The parts that make it feel alive
SETUP.md                  → The 10-minute setup you do once
```

---

*Built for a family business that's been doing this longer than most websites have existed. Everything Embroidered — if you can dream it, they can stitch it.*
