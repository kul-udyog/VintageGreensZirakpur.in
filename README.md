# Vintage Greens Zirakpur — Website (v2)

Production-ready static site for **vintagegreenszirakpur.in**, built from the official Vintage Greens brochures (Vintage Buildtech). Pure HTML/CSS/JS — no build step, deploys straight to GitHub Pages + Cloudflare.

## What changed in this update
- **Home page is now a focused landing page** — new aerial hero (clubhouse, pool, sports courts), streamlined single-scroll flow, form appears twice (hero + final CTA) instead of being buried in a generic layout.
- **Every form site-wide is now the same single form** — just Name + Phone Number. No more separate callback/price/brochure/site-visit forms with different fields. Each instance carries a `data-source` attribute (`hero`, `final_cta`, `contact_page`, `price_page`) so you can still tell them apart in GTM without different UI.
- **New brochure content folded in**: clubhouse, swimming pool, modern gym, tennis court, basketball court, mini theater, banquet hall, kids' play area, EV charging points, pet park, library, 5-tier security — all now in Amenities and reflected on the home page.
- **Tower H corrected** — it's the one tower offering all three configurations (3 BHK / 3 BHK+1 / 4 BHK+1) across different inserts. Updated on Floor Plans and in the FAQ.
- **Confirmed office addresses** now in the footer, Contact and Location pages:
  - Corporate Office: First Floor, SCO 4, Near Affinity Greens, Ramgarh Bhudda, Zirakpur – 140603
  - Site Office: PR-7, International Airport Road, Ramgarh Bhudda, Zirakpur – 140603
- **Airport distance corrected**: 10 minutes (was showing 5 minutes from the earlier brochure version).
- Images re-cropped from the new gatefold brochure + the aerial render you sent over WhatsApp (used as the new hero/OG image, letterboxing and UI arrow artifact cropped out).

## Structure
```
index.html            Home — now a single-scroll landing page
about.html             About the project
amenities.html         Amenities (tabbed: Lifestyle / Sports & Fitness / Kids & Pets / Security / Convenience)
floor-plans.html       Tower-wise configuration table + unit plan images, incl. Tower H's 3 inserts
price.html             Price on request + EMI calculator + single form
gallery.html           Photo gallery (masonry grid)
location.html          Distances + confirmed office addresses
builder.html           Vintage Buildtech profile
contact.html           Single name+phone lead form
faq.html                FAQ accordion + FAQPage schema
privacy-policy.html
blog/index.html         Blog index with 5 post outlines (write full posts before publishing)
thank-you/index.html    One shared thank-you page for every form (conversion tracking)
assets/css/styles.css   Design tokens + all component styles, incl. .quick-form
assets/js/partials.js   Injects shared header/footer/mobile nav on every page
assets/js/script.js     Forms, FAQ, tabs, EMI calculator, testimonials, lazy-fade
assets/img/             Images cropped from the brochure PDFs — one file per image; only the home hero has a JPEG+WebP pair
robots.txt, sitemap.xml
```

## Before you go live — placeholders to replace
- `PASTE_YOUR_WEB_APP_URL_HERE` in `assets/js/script.js` — see "Lead capture to Google Sheet" below. This is the only remaining placeholder; phone number and address are already filled in with real values.
- `Contact for Details` — possession date, parking allocation, exact CCTV spec, etc. — only replace once the developer confirms these.

## Lead capture to Google Sheet
Every form submit, every Call button tap, and every WhatsApp button tap across the site now sends a row to a Google Sheet — no server needed, just a free Google Apps Script Web App acting as the endpoint.

**One-time setup (you do this once, takes about 5 minutes):**
1. Open `google-apps-script-lead-capture.gs` in this project — it has full step-by-step instructions in the comment at the top.
2. Create a new Google Sheet, paste that script into its Extensions → Apps Script editor, and deploy it as a Web App ("Execute as: Me", "Who has access: Anyone").
3. Copy the deployed Web App URL (ends in `/exec`).
4. Open `assets/js/script.js`, find `const SHEET_WEBAPP_URL = "PASTE_YOUR_WEB_APP_URL_HERE";` near the top, and paste your URL in between the quotes.

That's it. Once that URL is set, the Sheet will get a new row for:
- **Form submits** — Name, Phone, which form (`hero`, `final_cta`, `contact_page`, `price_page`), and which page.
- **Call button taps** — no name/phone (nothing was typed), but a timestamp, "Call Button", and which page/button it was.
- **WhatsApp button taps** — same, logged as "WhatsApp Button".

Until you paste in a real URL, `sendToSheet()` silently does nothing — the site works exactly as before, nothing breaks.

Technically, tracking uses `navigator.sendBeacon()` (falling back to `fetch(...,{keepalive:true})` on very old browsers) rather than a plain `fetch()` call, specifically because forms redirect to the thank-you page immediately after submitting — a plain fetch can get cancelled mid-flight when the browser navigates away before the request finishes sending. `sendBeacon` is built for exactly this "log this, then leave the page" pattern.

## Conversion tracking (GTM / dataLayer, separate from the Sheet)
Every form on the site shares the same markup: `data-form-type="quick_lead"`, a `data-source` tag, and `data-redirect="thank-you/index.html"`. On submit, `script.js` pushes a `lead_form_submit` event to `dataLayer` with `form_source` telling you where on the site it came from, then redirects to the single `/thank-you/index.html` page, which fires `conversion_thank_you`. Call and WhatsApp taps push `call_button_click` / `whatsapp_button_click` events the same way. Build a GTM trigger listening for whichever of these events you want to turn into a Google Ads conversion action.

This `dataLayer` tracking and the Google Sheet capture above run independently of each other — you can use either, both, or neither without touching the other.

## Performance notes
- Home hero uses `<picture>` with WebP + JPEG fallback, `fetchpriority="high"`, and is preloaded.
- Every other image is `loading="lazy" decoding="async"` plain JPEG — kept to one file per image to avoid unused-asset clutter.

## Content accuracy
All copy is rewritten in original language from the brochures, not copied verbatim. Anything not stated in the brochure (possession date, exact price, parking allocation) is marked **"Contact for Details"** rather than invented.
