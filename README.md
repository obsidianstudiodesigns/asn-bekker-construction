# ASN Bekker Construction — website

Static site. No build step, no framework, no database. Upload the contents of
this `site/` folder to any web host and it runs.

```
site/
  index.html
  css/style.css
  js/main.js         nav, scroll reveals, gallery filters, lightbox, quote form
  js/blueprint.js    three.js build-sequence in the "How we build" section
  assets/img/        logo + project photos (webp with jpg fallback)
  assets/video/      hero video (mp4 + webm) and poster frame
```

## Before it goes live — two links need filling in

Both are in `index.html`, in the contact section. They currently point at the
service homepages because the real profile URLs weren't supplied:

| Line | What to replace |
|---|---|
| `<a href="https://www.facebook.com/" ... data-needs-url="Facebook page URL">` | the real ASN Bekker Facebook page URL |
| `<a href="https://www.snupit.co.za/" ... data-needs-url="Snupit profile URL">` | the real Snupit profile URL |

Search the file for `data-needs-url` to find them. Remove that attribute once
the real URL is in — it exists only as a marker.

## Content notes

Everything on the page comes from the supplied flyer and the `workdone` photos.
Nothing was invented: no testimonials, no "years in business", no project
counts, no service-area list. If you want any of those, they need to come from
the client and be added deliberately.

The **"Why choose us"** pillars, the eleven services, the taglines and all
contact details are lifted directly from the flyer.

## How the quote form works

There is no server. The form validates in the browser, then opens WhatsApp with
a pre-filled message to **+27 72 480 1647**. That means it works on any static
host with zero backend, and enquiries land where the client already works.

If a real emailed form is wanted later, the submit handler is the only thing
that changes (`js/main.js`, the `#quoteForm` submit listener).

## Assets — what was done to them

- **Hero video**: cropped from 1280×720 to **1120×720**, taking 160px off the
  right edge to remove the white star watermark that sat at x≈1140–1185.
  Re-encoded to H.264 mp4 (faststart) and VP9 webm, audio stripped.
- **Project photos**: "Galaxy Note20 Ultra 5G" watermarks cropped off (`1.jpg`,
  `2.jpg`); the two before/after composites split into separate frames with the
  blue Before/After badges cropped out; two dark shots brightened. Everything
  exported to webp with a jpg fallback via `<picture>`.

## Third-party dependencies

- **Google Fonts** (Archivo + Inter) — loaded from `fonts.googleapis.com`.
- **three.js 0.161** — loaded from `unpkg.com` via the import map in `index.html`.

Both are CDN loads, so the site needs internet access to look its best. If
three.js fails to load, or WebGL is unavailable, or the screen is under 900px
wide, the 3D section falls back to a styled gradient automatically — nothing
breaks. The 3D is deliberately **not** loaded on phones, to save the download.

### Opening it locally

Double-clicking `index.html` works — every link, button, filter, the lightbox
and the quote form all function. The one difference is the 3D build sequence:
browsers block JavaScript modules on `file://` URLs for security, so that
section shows its fallback gradient instead. Put the folder on a web host (or
serve it locally) and the 3D appears. This is a browser rule, not a fault in
the site.

If you'd rather self-host three.js, download `three.module.js` into `js/` and
change the import map path in `index.html`.

## Accessibility / behaviour

- Full keyboard support, visible focus rings, skip link.
- Lightbox traps focus and closes on Escape; arrow keys navigate.
- `prefers-reduced-motion` is respected — reveals, the hero video and the 3D
  parallax all stand down.
- Images carry width/height so the page doesn't shift while loading.
