# Caresthetic — Prioritized Action Plan

## 🔴 Critical — do this week

### 1. Fix the booking form (every lead is currently lost)
The form posts to `send-consulta.php` → **403 on Vercel** (PHP never runs there). Options, best first:

- **A. Formspree / Web3Forms / FormSubmit (fastest, ~15 min):** free form-to-email service; point `action` at their endpoint with `booking@carestheticpr.com`; set redirect to `/gracias.html` (already built). No code needed beyond one attribute.
- **B. Vercel Function + Resend (cleanest):** small `/api/consulta` function emailing via Resend (free tier 100/day). Needs a Resend account + API key in Vercel env.
- **C. Calendly/Squarespace Scheduling embed:** replaces the form entirely with real self-service booking — actually best for conversions ("Reservar" → picks a slot), and syncs to the clinic calendar.

Tell me which and I'll wire it up (A and B I can code immediately; you provide the account/API key for B/C).

### 2. Deploy this branch
The fixes in this branch (broken sitemap URL, OG image, redirects, headers, 43 MB→progressive loading) only help once merged and deployed.

### 3. Set up measurement (can't grow what you can't see)
- **Google Search Console:** verify `carestheticpr.com` (DNS TXT record), submit sitemap.
- **Vercel Web Analytics** (one click in dashboard, no cookie banner needed) and/or **GA4**. Give me the GA4 measurement ID and I'll add the tag.
- **Google Business Profile:** claim/verify the listing at 1064 Ave Ponce de León Suite 205 — this is the #1 lever for local reach, more than the website itself.

## 🟠 High — next 2–4 weeks (reach expansion)

### 4. Treatment landing pages (the actual SEO growth engine)
One page each for Bótox, Xeomin, Rellenos Dérmicos, Ácido Hialurónico, Anti-Edad — targeting "«tratamiento» San Juan / Puerto Rico". Each: procedure explanation, candidacy, before/after expectations, aftercare, FAQ (with FAQPage schema), CTA. This turns 1 indexable page into 6+ and is where rankings for commercial queries come from.

### 5. Dr. Cardona bio section/page (E-E-A-T)
Credentials, licencia, formación, foto, filosofía. Feeds the Physician schema already in place. For a medical site this is a trust requirement, not a nice-to-have.

### 6. English version + hreflang
`/en/` mirror of key pages. San Juan tourism + English-speaking residents double the addressable search demand.

### 7. Reviews & social proof
- Add testimonials section + `aggregateRating` schema (only with real reviews).
- Print/QR "review us on Google" flow at the clinic; review velocity drives map-pack rankings.

## 🟡 Medium — this quarter

8. **Replace Tailwind CDN** with a compiled CSS file (build step or standalone CLI) — removes ~110 KB render-blocking runtime JS.
9. **Responsive hero frames** — serve 1080×1080 frames to mobile (≈75% bandwidth cut on phones).
10. **FAQ section** on homepage + FAQPage schema (also the biggest AI-citation/GEO win).
11. **WhatsApp contact button** — in Puerto Rico WhatsApp converts better than forms; add `wa.me/17874688050` CTA.
12. **Branded 404 page.**
13. **Instagram content loop** — the site links out to Instagram; embed recent posts or before/after gallery on-site so the traffic flows both ways.

## Low / backlog

- Vanity Facebook URL; unify social handles.
- Blog/education hub ("¿Bótox o Xeomin?", "Qué esperar en tu primera consulta") — long-tail + AI-search authority.
- Video schema (`VideoObject`) for the treatment clips.
- Consider `carestheticpr.com/reservar` deep link for ad campaigns (Meta ads → dedicated landing).

## Already fixed in this branch ✅

Progressive frame loading (43 MB → ~0.4 MB initial), OG/Twitter share image (1200×630), www→apex redirect, security headers, cache headers, sitemap 404 removed, gracias.html created, Physician/OfferCatalog schema, llms.txt, richer meta description, theme-color, first-frame preload.
