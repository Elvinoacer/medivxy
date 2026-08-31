# Medivyx Medical Care — Demo Website

A modern, mobile-first pharmacy & healthcare website for **Medivyx Medical Care (Roysambu, Nairobi)**, built to the demo specification in `research.md`.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui-style components · JSON mock data

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
| **Catalogue** | 27 demo products across 5 categories with search, filters, availability indicators and "Prescription Required" flags — nothing is purchasable, everything routes to "Ask" |
| **WhatsApp integration** | Floating button + context-aware pre-filled messages on products, prescriptions, directions and requests |
| **Mobile** | Sticky bottom bar (Home · Services · Products · WhatsApp · Call), one-hand friendly, safe-area aware |
| **SEO** | Per-page metadata, canonical URLs, Open Graph/Twitter cards, `sitemap.xml`, `robots.txt`, JSON-LD (Organization, Pharmacy, FAQ, Product, Article) |
| **Accessibility** | Semantic HTML, skip link, ARIA labels, visible focus states, reduced-motion support, ≥44px touch targets |
| **Analytics demo** | `/admin` shows live counts ("N people viewed your pharmacy this week") fed by `/api/track` |
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
