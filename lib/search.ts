import { products, services, articles, faqs } from "@/lib/data";
import type { SearchResult } from "@/lib/types";

/**
 * Unified site search across products, services, articles, FAQs
 * and quick actions. Powers the "Find what you need" experience
 * (research.md §7) and the global ⌘K search dialog.
 */

const ACTION_RESULTS: SearchResult[] = [
  {
    kind: "action",
    title: "Request Medicine",
    subtitle: "Submit a medicine or prescription request",
    href: "/request-medicine",
  },
  {
    kind: "action",
    title: "Book a Consultation",
    subtitle: "Reserve a free pharmacist consultation slot",
    href: "/book",
  },
  {
    kind: "action",
    title: "Track a Request",
    subtitle: "Follow your medicine request status",
    href: "/track",
  },
  {
    kind: "action",
    title: "Contact Medivyx",
    subtitle: "Call, WhatsApp or send a message",
    href: "/contact",
  },
];

/** Matches a tracking reference typed into search (MDX-XXXX / BKG-XXXX). */
const REFERENCE_QUERY = /^(?:mdx|bkg)[-\s]?[a-z0-9]{4}$/i;

/**
 * When the query looks like a tracking reference, offer a direct
 * "Track MDX-1234" action that pre-fills the tracking page (?ref=).
 */
function referenceAction(query: string): SearchResult | null {
  const raw = query.trim();
  if (!REFERENCE_QUERY.test(raw)) return null;
  const ref = raw.toUpperCase().replace(/\s+/g, "-");
  const kind = ref.startsWith("MDX") ? "medicine request" : "consultation booking";
  return {
    kind: "action",
    title: `Track ${ref}`,
    subtitle: `Look up your ${kind} status`,
    href: `/track?ref=${encodeURIComponent(ref)}`,
  };
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function score(haystack: string, terms: string[]): number {
  const h = normalize(haystack);
  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    if (h.includes(term)) score += term.length >= 3 ? 3 : 1;
    if (h.startsWith(term)) score += 2;
  }
  return score;
}

export interface SearchResults {
  products: SearchResult[];
  services: SearchResult[];
  articles: SearchResult[];
  faqs: SearchResult[];
  actions: SearchResult[];
}

export function searchAll(query: string, limit = 8): SearchResults {
  const terms = normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length > 1);

  const empty: SearchResults = {
    products: [],
    services: [],
    articles: [],
    faqs: [],
    actions: ACTION_RESULTS.slice(0, 4),
  };

  if (terms.length === 0) return empty;

  const scoredProducts = products
    .map((p) => ({
      result: {
        kind: "product" as const,
        title: p.name,
        subtitle: p.prescriptionRequired
          ? `${p.category} · Prescription Required`
          : `${p.category} · ${p.tagline}`,
        href: `/products/${p.slug}`,
        prescriptionRequired: p.prescriptionRequired,
      },
      s: score(`${p.name} ${p.tagline} ${p.category}`, terms),
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.result);

  const scoredServices = services
    .map((sv) => ({
      result: {
        kind: "service" as const,
        title: sv.name,
        subtitle: sv.short,
        href: "/services",
      },
      s: score(`${sv.name} ${sv.short} ${sv.description}`, terms),
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.result);

  const scoredArticles = articles
    .map((a) => ({
      result: {
        kind: "article" as const,
        title: a.title,
        subtitle: `Health Information · ${a.category}`,
        href: `/health-information/${a.slug}`,
      },
      s: score(`${a.title} ${a.excerpt} ${a.category}`, terms),
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.result);

  const scoredFaqs = faqs
    .map((f) => ({
      result: {
        kind: "faq" as const,
        title: f.question,
        subtitle: `FAQ · ${f.answer.replace(/\s+/g, " ").slice(0, 76)}…`,
        href: "/services",
      },
      s: score(`${f.question} ${f.answer}`, terms),
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map((x) => x.result);

  const scoredActions = ACTION_RESULTS.map((a) => ({
    result: a,
    s: score(`${a.title} ${a.subtitle}`, terms),
  }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map((x) => x.result);

  // A typed reference code always wins the top action slot.
  const refAction = referenceAction(query);

  return {
    products: scoredProducts,
    services: scoredServices,
    articles: scoredArticles,
    faqs: scoredFaqs,
    actions: refAction
      ? [refAction, ...scoredActions]
      : scoredActions.length > 0
        ? scoredActions
        : empty.actions.slice(0, 1),
  };
}
