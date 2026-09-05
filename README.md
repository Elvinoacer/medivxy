# Medivyx Medical Care — Demo Website

A modern, mobile-first pharmacy & healthcare website for **Medivyx Medical Care (Roysambu, Nairobi)**, built to the demo specification in `research.md`.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui-style components · JSON mock data

---

## UX & flow improvements (this revision)

A focused pass over user flows, data flows and the UI layer. Design rules
extracted from it live in **`docs/ui-guidelines.md`**.

**Bugs fixed**

- `MDX-DEMO` tracking chip resolved to "couldn't find" on fresh clones — the
  demo store is now seeded automatically (and shipped in `data/`).
- The track page's booking card pre-filled a *medicine-request* WhatsApp
  message; it now uses the booking template.
- The admin session cookie was the plain string `"granted"` (forgeable) —
  it is now an HMAC-SHA256 signature compared in constant time.
- Booking window mismatch: the client offered 14 days while the server
  accepted 21 — both now agree on 14.
- "Past slot" disabling froze at page mount — the clock now refreshes
  every 60 s.
- Search analytics fired on **every keystroke** — now debounced (800 ms,
  3+ chars, deduped).
- `not-found.tsx` hardcoded the WhatsApp URL instead of `whatsappLink()`.

**User flows**

- Medicine-request wizard: **drafts persist** (localStorage) across
  refreshes with a "Start over" banner; server-side field errors now map
  onto the form and jump to the right step; honeypot; `maxLength` +
  "N left" counters; onBlur validation; mobile users see the current step
  label, not just dots.
- Booking form: honeypot, character counter, consistent error wiring,
  confirmation toasts.
- Contact form: server (zod) errors map to per-field highlights; "Send
  another message" reset; character counter.
- Track page: network failures during polling no longer look like the
  order vanished (card is kept + toast); "updated Xh ago" rolls to hours.
- Chatbot: **multi-turn context** — "yes" resolves to the last suggested
  topic, and "how much is it?" re-resolves against the last mentioned
  product.
- Toast system (sonner) wired up everywhere (success, network errors,
  rate limits with "try again in Xs", admin actions, copy-to-clipboard).

**Navigation**

- Book & Track join the desktop nav (core set visible from `lg`, full set
  from `xl` — previously 1024–1279 px had no desktop nav at all).
- Mobile bottom bar now carries the flagship actions: Home · Request ·
  Book · Track · Call (WhatsApp stays on the FAB).
- `/admin` is linked ("Staff") from the footer instead of being orphaned.

**Admin dashboard**

- Status changes are reversible (Undo) and confirmed with toasts; failed
  actions surface errors instead of silently keeping stale UI.
- Queues are searchable (reference / name / medicine / consult) with a
  clear-filter empty state; a load-error banner with Retry.

**Data flows**

- JSON stores write **atomically** (temp file + rename) and return
  success/failure — API routes now tell the customer when a submission
  wasn't saved instead of losing it silently.
- Rate-limited responses send `Retry-After` headers + friendly copy.
- Shared validators (`lib/validation.ts`) — one phone regex and one set of
  field lengths for every form and route.
- Contact API maps zod issues to per-field errors (same shape the client
  uses).

**UI**

- Dark mode repaired: ~45 hardcoded `bg-white` usages replaced with theme
  tokens; the WhatsApp brand button is one shared `.wa-cta` class instead
  of eight hand-copied hex utilities.
- Added `app/error.tsx` (friendly error boundary with reset + contact
  actions) and `app/loading.tsx` (layout-stable skeletons).

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build: `npm run build && npm start`. Lint: `npm run lint`.

---

## What's inside

| Area | Details |
| --- | --- |
| **Pages** | Home, About, Services, Pharmacy, Products, Product detail, Health Information (+ articles), Contact, Request Medicine, `/admin` (analytics demo) |
| **Signature feature** | **Ask Medivyx** chatbot in the header — answers from a self-contained knowledge base with strict safety guardrails (never diagnoses/prescribes), context-aware WhatsApp CTAs and suggested questions |
| **Medicine request flow** | 4-step wizard: what you need (+ optional prescription upload) → your details → pickup/delivery → review → confirmation with reference code and WhatsApp/Call CTAs |
| **Imagery** | 44 AI-generated demo photos — hero collage, quick-action tiles, per-category imagery, service cards, consultation photos, one photo per product (webp, ~3 MB total) |
| **Catalogue & shop** | 27 demo products across 5 categories with product photography, KES prices, pack sizes, search, filters, category tiles, availability indicators and "Prescription Required" flags |
| **WhatsApp integration** | Floating button + context-aware pre-filled messages on products, prescriptions, directions and requests |
| **Mobile** | Sticky bottom bar (Home · Services · Products · WhatsApp · Call), one-hand friendly, safe-area aware |
| **SEO** | Per-page metadata, canonical URLs, Open Graph/Twitter cards, `sitemap.xml`, `robots.txt`, JSON-LD (Organization, Pharmacy, FAQ, Product, Article) |
| **Accessibility** | Semantic HTML, skip link, ARIA labels, visible focus states, reduced-motion support, ≥44px touch targets |
| **Analytics demo** | `/admin` shows live counts ("N people viewed your pharmacy this week") fed by `/api/track` |
| **Online shop** | Full checkout flow — basket (persists in localStorage) → details → prescription upload → payment (simulated M-Pesa STK push, card, or pay-on-collection) → ORD-XXXX confirmation. Rx items route through pharmacist review with pay-after-confirmation |
| **Order tracking** | ORD-XXXX (shop orders) joins MDX-XXXX (requests) and BKG-XXXX (bookings) on /track — live cards, 30s auto-refresh, reorder button |
| **Staff dashboard** | `/admin` gains a Shop orders queue (advance/undo statuses, searchable) alongside requests, bookings and analytics |
| **Security** | Server-side validation (zod), rate limiting, honeypot, file type/size restrictions — uploaded prescriptions are **not** stored (demo policy) |

## Where things live

```
app/                    routes + API routes (chat, contact, request-medicine, track)
components/site/        all website sections and views
components/ui/          shadcn/ui-style primitives
data/                   products.json, services.json, faqs.json, articles.json
lib/business.ts         ⚠️ single source of truth for contact details,
                        hours and location — replace placeholders here
lib/chatbot.ts          "Ask Medivyx" knowledge base + intent engine
public/images/          AI-generated demo photography (webp)
```

## Before going live

1. **Replace the placeholders in `lib/business.ts`** — phone, WhatsApp number, email, exact address, confirmed opening hours. Everything (WhatsApp links, chatbot answers, footer, schema.org data) updates automatically from this one file.
2. Replace demo photography and the mock catalogue in `data/*.json`.
3. Remove demo notes (hours note, catalogue disclaimers) once details are confirmed.
4. Point `NEXT_PUBLIC_SITE_URL` at the production domain for correct canonical/OG URLs.
5. Swap the in-memory analytics + JSON submission stores (`/api/track`, `lib/submissions.ts`) for a real database.

> **Demo boundaries (by design):** no invented certifications, prices, or availability guarantees; antibiotics and prescription medicines are never purchasable; the chatbot refuses medical advice and points to the pharmacist.


---

## Online shop (this revision)

The catalogue is now a real (demo) store:

- **Prices & packs** — every product carries an indicative KES price and pack
  size (`data/products.json`); the API re-prices basket lines **server-side**
  from the catalogue so a tampered client can't invent totals.
- **Basket** — persistent (localStorage), quantity-steppers, live badge in the
  header and mobile bottom bar, slide-over sheet with subtotal.
- **Checkout** (`/checkout`) — basket review → contact & pickup/delivery →
  prescription (Rx baskets only) → payment → confirmation.
  - **M-Pesa**: simulated STK-push dialog (clearly labelled demo — no money moves).
  - **Card**: demo mode, any values accepted.
  - **Pay on collection/confirmation**.
  - **Rx baskets**: M-Pesa/card disabled, order lands as `reviewing` and payment
    happens after the pharmacist confirms — antibiotics are never
    one-tap-purchasable.
- **Orders** — `POST /api/orders` (zod + rate-limit + atomic JSON store),
  ORD-XXXX references, status machine `received → reviewing → preparing →
  ready → completed` driven from `/admin` and surfaced live on `/track`
  (30s polling, status-change toasts, reorder button).
- **Demo seeds** — `ORD-DEMO` is auto-seeded so the tracking demo chip works
  on a fresh clone (mirrors MDX-DEMO / BKG-DEMO).
