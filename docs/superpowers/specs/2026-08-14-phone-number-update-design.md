# Caresthetic Phone Number Update

## Objective

Replace Caresthetic's active public phone and WhatsApp number from `(787) 468-8050` to `(939) 223-7413` everywhere served from `new-site/`, without changing the site's visual design or historical copies.

## Scope

Update every applicable reference in the active deployment:

- Visible phone text: `(939) 223-7413`
- Telephone links: `tel:9392237413`
- Schema.org/SEO telephone value: `+1-939-223-7413`
- WhatsApp destinations: `https://wa.me/19392237413`
- Concierge responses and machine-readable contact content

The expected files are:

- `new-site/index.html`
- `new-site/gracias.html`
- `new-site/llms.txt`
- `new-site/tizo.html`
- `new-site/tizo/index.html`

Files outside `new-site/`, including `public_html/`, saved browser snapshots, contact-card exports, reports, and archived site copies, remain unchanged.

## Behavior

All visible contact references display the new formatted number. Clicking a telephone link starts a call to `9392237413`. TiZO purchase buttons open WhatsApp conversations with `19392237413` while preserving their existing prefilled product messages. Structured data and concierge responses return the same new contact number.

## Verification

1. Search `new-site/` and confirm no active reference to `7874688050`, `787.468.8050`, `787-468-8050`, or `17874688050` remains.
2. Confirm the new number exists in all required formats.
3. Confirm every TiZO WhatsApp link retains its existing encoded message and uses `19392237413`.
4. Review the diff to ensure only phone-number values changed and no unrelated content or layout was modified.
