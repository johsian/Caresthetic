# Caresthetic Phone Number Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active Caresthetic phone and WhatsApp number with `(939) 223-7413` across every page and machine-readable contact reference served from `new-site/`.

**Architecture:** This is a scoped static-content update. Preserve each contact channel's required representation—formatted display text, `tel:` URI, Schema.org value, LLM contact text, and international WhatsApp destination—while leaving archived site copies and all layout code unchanged.

**Tech Stack:** Static HTML, JavaScript embedded in HTML, plain text SEO/LLM metadata, Vercel rewrites.

## Global Constraints

- Modify only files under `new-site/`.
- Display the phone number as `(939) 223-7413`.
- Use `tel:9392237413` for telephone links.
- Use `+1-939-223-7413` for the Schema.org telephone value.
- Use `+1 939-223-7413` in `new-site/llms.txt`, preserving that file's existing presentation style.
- Use `https://wa.me/19392237413` for WhatsApp destinations.
- Preserve every existing TiZO WhatsApp `?text=` query exactly.
- Do not change layout, styling, copy unrelated to the phone number, or historical files outside `new-site/`.

---

## File Structure

- `new-site/index.html`: Main-page structured data, visible contact information, call link, and concierge response.
- `new-site/gracias.html`: Confirmation-page emergency contact text and call link.
- `new-site/llms.txt`: Machine-readable clinic contact information.
- `new-site/tizo.html`: TiZO WhatsApp purchase destinations plus visible clinic phone and call link.
- `new-site/tizo/index.html`: TiZO fallback call-to-clinic links.

### Task 1: Update and verify the active contact number

**Files:**

- Modify: `new-site/index.html:40,1027,1058,1385`
- Modify: `new-site/gracias.html:92`
- Modify: `new-site/llms.txt:8`
- Modify: `new-site/tizo.html:871,882,893,904,915,926,945`
- Modify: `new-site/tizo/index.html:156,186`
- Test: shell assertions against the five modified files

**Interfaces:**

- Consumes: Existing static contact strings, `tel:` links, Schema.org JSON-LD, and TiZO WhatsApp URLs.
- Produces: Consistent active-site phone references using `9392237413` and WhatsApp references using `19392237413`.

- [ ] **Step 1: Run the regression assertion and verify the current site fails it**

```bash
set -eu
! rg -n '787[ .()\-]*468[ .()\-]*8050|17874688050' \
  new-site/index.html \
  new-site/gracias.html \
  new-site/llms.txt \
  new-site/tizo.html \
  new-site/tizo/index.html
```

Expected: exit status `1`, because the old phone and WhatsApp values are still present.

- [ ] **Step 2: Apply the exact representation changes**

Use `apply_patch` to make only these substitutions in the listed files:

```text
+1-787-468-8050   -> +1-939-223-7413
787.468.8050      -> (939) 223-7413
tel:7874688050    -> tel:9392237413
+1 787-468-8050   -> +1 939-223-7413
wa.me/17874688050 -> wa.me/19392237413
```

Do not alter text following any TiZO WhatsApp `?text=` delimiter.

- [ ] **Step 3: Run exact post-change assertions**

```bash
set -eu
active_files='new-site/index.html new-site/gracias.html new-site/llms.txt new-site/tizo.html new-site/tizo/index.html'

! rg -n '787[ .()\-]*468[ .()\-]*8050|17874688050' $active_files

test "$(rg -F -o '(939) 223-7413' $active_files | wc -l | tr -d ' ')" -eq 5
test "$(rg -F -o 'tel:9392237413' $active_files | wc -l | tr -d ' ')" -eq 5
test "$(rg -F -o '+1-939-223-7413' $active_files | wc -l | tr -d ' ')" -eq 1
test "$(rg -F -o '+1 939-223-7413' $active_files | wc -l | tr -d ' ')" -eq 1
test "$(rg -F -o 'wa.me/19392237413?text=' new-site/tizo.html | wc -l | tr -d ' ')" -eq 6

printf 'All active phone references are consistent.\n'
```

Expected: exit status `0` and `All active phone references are consistent.`

- [ ] **Step 4: Review the patch for scope and formatting errors**

```bash
git diff --check
git diff -- \
  new-site/index.html \
  new-site/gracias.html \
  new-site/llms.txt \
  new-site/tizo.html \
  new-site/tizo/index.html
```

Expected: `git diff --check` reports no errors. The diff contains only the specified phone-number substitutions; all TiZO encoded product messages remain unchanged.

- [ ] **Step 5: Commit the implementation**

```bash
git add -- \
  new-site/index.html \
  new-site/gracias.html \
  new-site/llms.txt \
  new-site/tizo.html \
  new-site/tizo/index.html
git commit -m "Update Caresthetic contact phone number"
```
