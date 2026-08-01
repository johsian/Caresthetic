# Caresthetic — Full SEO & Reach Audit
**Site:** https://carestheticpr.com/ · **Date:** 2026-08-01 · **Business type:** Local medical aesthetics clinic (brick-and-mortar, YMYL/medical category)

## Executive Summary

**SEO Health Score: 56/100 before fixes → ~69/100 after fixes applied in this branch.**

The site is a beautiful single-page Spanish-language site on Vercel. Its biggest problems are not cosmetic — they directly block reach and conversion:

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | 🔴 Critical | **Booking form is broken in production.** It posts to `send-consulta.php`, which returns **HTTP 403** on Vercel (PHP cannot run there). Every consultation request submitted through the site is silently lost. | ⚠️ Needs your decision (see Action Plan) |
| 2 | 🔴 Critical | **~43 MB of hero animation frames loaded eagerly on page open** (121 × 2160×2160 WebP). On mobile/cellular this destroys Core Web Vitals and bounces visitors. | ✅ Fixed — progressive loading |
| 3 | 🔴 Critical | Sitemap listed `gracias.html`, which returned **404** (file was never deployed to `new-site/`). | ✅ Fixed — page created (noindex), removed from sitemap |
| 4 | 🟠 High | **Social share image was the 192×192 logo.** Links shared on Instagram DMs, WhatsApp, Facebook rendered with a tiny/broken preview. | ✅ Fixed — 1200×630 `og-image.jpg` |
| 5 | 🟠 High | `www.carestheticpr.com` served the site with **no redirect** to the apex domain (duplicate-content signal). | ✅ Fixed — 308 redirect in `vercel.json` |
| 6 | 🟠 High | **No analytics or Search Console** — reach cannot be measured at all. | ⚠️ Needs your account (see Action Plan) |
| 7 | 🟠 High | **Single page, thin content for a medical (YMYL) site** — no treatment pages, no doctor bio/credentials, no FAQ, no reviews. This caps rankings for "botox san juan", "xeomin puerto rico", etc. | ⚠️ Roadmap item |
| 8 | 🟡 Medium | No security headers beyond HSTS. | ✅ Fixed — nosniff, frame, referrer, permissions policies |
| 9 | 🟡 Medium | No cache headers → 43 MB re-downloaded on repeat visits. | ✅ Fixed — immutable caching for frames/posters, 30-day for media |
| 10 | 🟡 Medium | Schema lacked physician, specialty, and service catalog. | ✅ Fixed — Physician + OfferCatalog with 6 MedicalProcedures |
| 11 | 🟡 Medium | No `llms.txt` / weak AI-search (GEO) readiness. | ✅ Fixed — llms.txt added |
| 12 | 🟡 Medium | Tailwind loaded via CDN `<script>` (runtime style generation, render-blocking, not production-supported). | ⚠️ Roadmap item |

## Technical SEO (22%)

- **Crawlability:** robots.txt correct, allows all agents, sitemap referenced. HTTPS + HSTS present. HTTP/2. ✅
- **Indexability:** canonical set correctly; `robots` meta `index,follow`. Only 1 indexable page exists.
- **Broken conversion path:** `send-consulta.php` → 403. The reCAPTCHA v2 on the form is also dead weight while the endpoint is broken.
- **www duplicate:** fixed via permanent redirect (redirects run before rewrites in `vercel.json`).
- **Security headers:** were absent; now added (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- **404 handling:** Vercel default 404 (unbranded). Low priority: add a branded 404.

## Performance / Core Web Vitals (10%)

- **Before:** page requested all 121 frames (~43 MB) immediately + Tailwind CDN JS + Google Fonts + Remixicon CSS + reCAPTCHA. Estimated mobile LCP good (text hero) but bandwidth contention and data cost extreme.
- **After:** first frame preloaded (`fetchpriority=high`); 15 keyframes (~5 MB) load after `window.load`; full sequence fills in on idle/first scroll. Repeat visits now hit immutable cache.
- **Remaining:** Tailwind CDN (≈110 KB runtime JS, not for production) — replace with a compiled stylesheet; consider serving 1080×1080 frames to mobile via a viewport check (2160×2160 is wasted on phones).
- Videos are `preload="metadata"` ✅ with posters ✅ — good.

## Content Quality & E-E-A-T (23%) — weakest area

This is a **medical (YMYL) site**, where Google's E-E-A-T bar is highest, and the current content is one page of ~600 words:

- **No doctor bio.** Dr. Cardona is named but has no credentials, license, photo, specialty, or history anywhere. For a medical clinic this is the single most important trust/ranking signal.
- **No treatment detail pages.** "Bótox San Juan", "Xeomin Puerto Rico", "rellenos dérmicos San Juan" are the queries that bring patients; each needs its own page (procedure, candidacy, expectations, aftercare, FAQ, price range).
- **No patient reviews/testimonials** on the site (also feeds review schema → star rich results).
- **No FAQ section** (feeds FAQ schema + AI-search citations).
- **Language:** Spanish-only. San Juan has a large English-speaking/medical-tourism audience — an `/en/` version with hreflang would double addressable queries.
- Odd stat: "205 · Suite" is presented as a metric — replace with something meaningful (years of experience, patients treated).

## On-Page SEO (20%)

- Title (67 chars) and meta description good; description now includes treatment keywords. ✅
- Heading hierarchy valid (single h1 → h2 sections → h3 cards). ✅
- Internal linking: n/a (single page). Anchors work.
- `lang="es"`, `og:locale es_PR` consistent. ✅

## Schema / Structured Data (10%)

- **Before:** valid `MedicalBusiness` + `WebSite` with NAP, geo, hours, sameAs — good foundation.
- **After:** added `medicalSpecialty`, `Physician` entity for Dr. Cardona, and `hasOfferCatalog` with the 6 treatments as `MedicalProcedure` items. JSON parse-validated.
- **Next:** `FAQPage` (once visible FAQ exists), `aggregateRating` (once reviews shown), upgrade `Physician` with `medicalSpecialty` + credentials when bio exists.

## AI Search Readiness / GEO (10%)

- **Before:** no llms.txt; thin content means little for AI engines to cite; no English content for English-language AI queries.
- **After:** `llms.txt` published with clinic facts, treatments, NAP, hours.
- AI crawlers (GPTBot, ClaudeBot, PerplexityBot) are not blocked by robots.txt ✅.
- Structured Q&A-style content (FAQ) is the highest-impact next step for AI citations.

## Images & Media (5%)

- WebP frames ✅, JPEG posters ✅, alt/aria labels on media ✅.
- OG image fixed (was 192px logo → now 1200×630 photo).
- Favicon + apple-touch-icon present ✅.

## Local SEO (critical for this business)

The website is only half of local reach. Not verifiable from code, but essential:

- **Google Business Profile** — claim/optimize; the maps link works but the site should also embed hours/NAP consistently (NAP on site is consistent ✅).
- **Reviews strategy** — Google reviews are the #1 local ranking factor; add a "déjanos tu reseña" link and show testimonials on-site.
- Ensure NAP consistency across Instagram/Facebook bios and any directories (Yelp, Doctoralia, medical directories in PR).
- Facebook link uses the raw `/people/.../100092566654430/` URL — claim a vanity URL (`facebook.com/carestheticpr`).

## What Was Changed In This Branch

| File | Change |
|------|--------|
| `new-site/index.html` | Meta description w/ treatments; theme-color; OG/Twitter cards → new 1200×630 image with dimensions+alt; preload first hero frame; Physician + OfferCatalog + medicalSpecialty schema; progressive frame loading (first frame → keyframes on load → rest on idle/scroll) |
| `new-site/og-image.jpg` | NEW — 1200×630 social share image generated from hero frame |
| `new-site/gracias.html` | NEW — branded thank-you page (noindex), fixes sitemap 404 & ready as form redirect target |
| `new-site/llms.txt` | NEW — AI-search (GEO) site summary |
| `new-site/sitemap.xml` | Removed dead/noindex gracias entry, fresh lastmod |
| `vercel.json` | www→apex 308 redirect; security headers; immutable cache for frames/posters; 30-day cache for videos/images |

Verified locally: page renders, scroll animation works, all 121 frames still load (progressively), JSON-LD parses, gracias.html serves 200.
